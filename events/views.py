from django.shortcuts import render, redirect
from django.http import HttpResponse, JsonResponse, HttpResponseNotFound
from django.utils.translation import gettext as _

import json

from datetime import datetime
import schedama.dynamodb_ops as dynamodb_ops

def get_event_data(item_id, item_type="event"):
    # TO-DO: implement cache-first
    return dynamodb_ops.select_record_by_id(item_id, item_type)

def index(request):
    return render(request, "events/index.html")

def new_event_view(request):

    return render(request, "events/new_event.html")

def about_us_view(request):

    return render(request, "events/about_us.html")

def save_event_view(request):
    if request.method != 'POST':
        return redirect("index")

    event_data = json.loads(request.body)
    event_data["item_type"] = "event"

    # Check if 'item_id' is included.
    # It shouldn't be present because this request is only used to create new events, not to edit old ones.
    if "item_id" in event_data.keys():
        response = {
            "status": "ERROR",
            "description": _("You are not authorized to perform this operation.")
        }
        return JsonResponse(response)

    # Order event dates
    event_data["dates"].sort()

    try:
        new_event = dynamodb_ops.insert_record(event_data)
    except:
        response = {
            "status": "ERROR",
            "description": _("An error has occurred while creating the event. Please try again later.")
            }
        return JsonResponse(response)

    response = {
        "status": "OK",
        "item_id": new_event["item_id"],
        "admin_key": new_event["admin_key"]
    }

    return JsonResponse(response)

def participate_view(request, eventID):
    # Retrieving event data
    event_data = get_event_data(eventID, "event")

    if event_data == []:
        return redirect("index")

    # Removing admin_key from event data before sending to the client for security reasons
    event_data.pop('admin_key', None)
    # Adding dates so Django can display it in template
    event_data["dates_formatted"] = [datetime.strptime(d, "%Y-%m-%dT%H:%M") for d in event_data["dates"]]
    
    context = {
        "event": event_data
    }

    return render(request, "events/view_event.html", context)

def add_participant_view(request):
    if request.method != 'POST':
        return redirect("index")
    
    request_data = json.loads(request.body)
    item_id = request_data.get("item_id")
    new_participant = request_data.get("new_participant")
    admin_key = request_data.get("admin_key", None)

    # Event data retrieved from database
    event_data = get_event_data(item_id, "event")
    event_settings = event_data["settings"]

    ### AUTHORIZATION CHECK ###
    # Check if the admin key is present and if it's correct
    is_admin = False
    user_add_participant = event_settings["add_participant"]

    # Check if user is admin of the event
    if admin_key:
        if admin_key == event_data["admin_key"]:
            is_admin = True
    
    # If user is not admin and the add_participant permission is false the action is blocked
    if not is_admin and not user_add_participant:
        response = {
            "status": "ERROR",
            "description": _("You are not authorized to perform this operation.")
        }
        return JsonResponse(response)
    ### ###
    
    # Adding new participant to the event (after checking correct format)
    name_ok = new_participant.get("name", "")
    if name_ok == "":
        response = {
            "status": "ERROR",
            "description": _("An error has occurred.")
        }
        return JsonResponse(response)

    new_participant_ok = {
        "name": name_ok[:30],
        "dates": new_participant.get("dates", [])
    }

    event_data["participants"].append(new_participant_ok)

    # Saving updated event data
    dynamodb_ops.insert_record(event_data)
    
    response = {
        "status": "OK"
    }

    return JsonResponse(response)

def edit_event_view(request, eventID):
    admin_key = request.GET.get('k','')
    
    ### CHECK AUTHORIZATION ###
    # Check if the admin key (URL parameter k) is present
    if admin_key == '':
        return redirect("participate_view", eventID)

    # Get event data (only if the admin key is present)
    event_data = get_event_data(eventID, "event")

    # Check if the admin key provided as URL parameter correspond with the one associated with the event
    if admin_key != event_data["admin_key"]:
        return redirect("index")
    ### ###

    # All checks are passed
    context = {
        "event": event_data
    }

    return render(request, "events/edit_event.html", context)

def update_event_view(request):
    if request.method != 'POST':
        return redirect("index")

    #Retrieve request data
    request_data = json.loads(request.body)
    print(request_data)
    item_id = request_data.get("item_id", "")
    admin_key = request_data.get("admin_key", "")

    # Retrieve event's data
    event_data = get_event_data(item_id, "event")
    if event_data == []:
        response = {
            "status": "ERROR",
            "description": _("An error has occurred.")
        }
        return JsonResponse(response)

    event_settings = event_data["settings"]

    ### CHECK AUTHORIZATION ###
    # Check user's and event authorizations
    is_admin = admin_key == event_data["admin_key"]
    add_participant = event_settings.get("add_participant", False)
    remove_participant = event_settings.get("remove_participant", False)
    ### ###

    # Update ADMIN fields of the event
    if is_admin:
        event_data["title"] = request_data.get("title", event_data["title"])
        event_data["has_location"] = request_data.get("has_location", False)
        event_data["location"] = request_data.get("location", "")
        event_data["dates"] = request_data.get("dates", [])
        event_data["dates"].sort() # Order event dates
        event_data["participants"] = request_data.get("participants", [])
        event_data["settings"]["add_participant"] = request_data["settings"].get("add_participant", False)
        event_data["settings"]["remove_participant"] = request_data["settings"].get("remove_participant", False)
    
    # Saving new event's info
    dynamodb_ops.insert_record(event_data)

    response = {
        "status": "OK"
    }

    return JsonResponse(response)

def error404_view(request, exception):
    
    return render(request, "events/error404.html")