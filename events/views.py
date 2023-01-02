from django.shortcuts import render, redirect
from django.http import HttpResponse, JsonResponse

import json

import schedama.dynamodb_ops as dynamodb_ops

def get_event_data(item_id, item_type="event"):
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
            "description": "You are not authorized to perform this operation."
        }
        return JsonResponse(response)

    try:
        new_event = dynamodb_ops.insert_record(event_data)
    except:
        response = {
            "status": "ERROR",
            "description": "An error has occurred while creating the event. Please try again later."
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
    print(event_data)
    context = {
        "event": event_data
    }

    return render(request, "events/view_event.html", context)

def add_participant_view(request):
    if request.method != 'POST':
        return redirect("index")
    
    request_data = json.loads(request.body)
    item_id = request_data.get("item_id")
    added_participants = request_data.get("participants")
    admin_key = request_data.get("admin_key")

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
            "description": "You are not authorized to perform this operation."
        }
        return JsonResponse(response)
    ### ###
    
    # Adding new participants to the event
    event_data["participants"] += added_participants

    dynamodb_ops.insert_record(event_data)
    
    response = {
        "status": "OK"
    }

    return JsonResponse(response)

