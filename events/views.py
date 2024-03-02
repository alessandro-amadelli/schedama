from django.shortcuts import render, redirect
from django.http import JsonResponse
from django.core.exceptions import PermissionDenied
from django.utils.translation import gettext as _
from django.views.generic.base import TemplateView

from django.views.decorators.cache import cache_page
from django.core.cache import cache

import json

from datetime import datetime, timedelta
import schedama.dynamodb_ops as dynamodb_ops
from schedama.settings import CACHE_TTL, CACHE_DB_TTL

from collections import Counter

class ServiceWorker(TemplateView):
    template_name="events/sw.js"
    content_type="application/javascript"

def get_event_data(item_id, item_type="event"):
    """
    Retrieves saved event's data with a cache-first logic.
    """
    cache_key = item_type + "_" + item_id
    
    event_data = cache.get(cache_key)
    if not event_data:
        event_data = dynamodb_ops.select_record_by_id(item_id, item_type)
        cache.set(cache_key, event_data, CACHE_DB_TTL)

    event_data = dynamodb_ops.select_record_by_id(item_id, item_type)

    return event_data

def validate_event(event_data):
    """
    This function validates the received event.
    It needs to be called before saving event to server
    """
    # Max lengths of event fields
    AUTHOR_MAX_LENGTH = 30
    TITLE_MAX_LENGTH = 150
    DESCRIPTION_MAX_LENGTH = 400
    LOCATION_MAX_LENGTH = 100
    DATE_MIN = datetime.now().strftime("%Y-%m-%dT%H:%M")
    DURATION_MAX = (60 * 24 * 30) + (60 * 23) + 59
    PARTICIPANT_NAME_MAX_LENGTH = 30
    THEME_MAX_LENGTH = 20

    is_valid = True

    # Check if author is present and truncate length
    author = event_data.get("author", "").replace(" ", "")
    if len(author) > AUTHOR_MAX_LENGTH:
        author = author[:AUTHOR_MAX_LENGTH]
    event_data["author"] = author

    # Check if title is present and truncate length
    if event_data.get("title", "").replace(" ", "") == "":
        is_valid = False
    else:
        if len(event_data["title"]) > TITLE_MAX_LENGTH:
            event_data["title"] = event_data["title"][:TITLE_MAX_LENGTH]
    
    # Check description and truncate length
    description = event_data.get("description", "")
    if len(description) > DESCRIPTION_MAX_LENGTH:
        event_data["description"] = event_data["description"][:DESCRIPTION_MAX_LENGTH]

    # Check location and truncate
    has_location = event_data.get("has_location", False)
    if has_location and (
        len(event_data.get("location", "").replace(" ", "")) == 0 
    ):
        is_valid = False
    if len(event_data.get("location", "")) > LOCATION_MAX_LENGTH:
        event_data["location"] = event_data["location"][:LOCATION_MAX_LENGTH]
    
    # Check event dates
    # Skip check for the moment because multiple dates could be present

    # Check duration and set default if missing or wrong format
    event_data["duration"] = event_data.get("duration", 60)
    try:
        event_data["duration"] = int(event_data["duration"])
    except:
        event_data["duration"] = 60

    if event_data["duration"] == 0:
        event_data["duration"] = 60

    if event_data["duration"] > DURATION_MAX:
        event_data["duration"] = DURATION_MAX

    # Check event participants
    if len(event_data.get("participants", [])) > 0:
        for p in event_data["participants"]:
            if len(p["name"]) > PARTICIPANT_NAME_MAX_LENGTH:
                p["name"] = p["name"][:PARTICIPANT_NAME_MAX_LENGTH]

    # Check event_theme
    event_theme = event_data.get("event_theme", "")
    if event_theme:
        if len(event_theme) > THEME_MAX_LENGTH:
            event_theme = event_theme[:THEME_MAX_LENGTH]
            event_data["event_theme"] = event_theme

    return (is_valid, event_data)

def save_event_to_db(event_data):
    """
    This function calls event validation and saves event to the database
    """
    is_validated, event_data = validate_event(event_data)

    if not is_validated:
        return False

    # Save event to database
    db_event = dynamodb_ops.insert_record(event_data)

    # Saving event_data to cache (or update value if already present)
    cache_key = db_event["item_type"] + "_" + db_event["item_id"]
    cache.set(cache_key, event_data, CACHE_DB_TTL)

    return event_data

@cache_page(CACHE_TTL)
def index(request):
    return render(request, "events/index.html")

@cache_page(CACHE_TTL)
def robots_view(request):
    return render(request, "events/robots.txt")

@cache_page(CACHE_TTL)
def new_event_view(request):
    return render(request, "events/new_event.html")

@cache_page(CACHE_TTL)
def about_us_view(request):
    return render(request, "events/about_us.html")

def save_event_view(request):
    if request.method != 'POST':
        return redirect("index")

    event_data = json.loads(request.body)
    event_data["item_type"] = "event"

    # Check if 'item_id' is included.
    # It shouldn't be present because this request is only used to create
    # new events, not to edit old ones.
    if "item_id" in event_data.keys():
        response = {
            "status": "ERROR",
            "description": _(
                "You are not authorized to perform this operation."
            )
        }
        return JsonResponse(response)

    # Order event dates
    event_data["dates"].sort()

    try:
        new_event = save_event_to_db(event_data)
        if not new_event:
            raise Exception
    except:
        response = {
            "status": "ERROR",
            "description": _(
                "An error has occurred while creating the event."
                " Please try again later."
            )
        }
        return JsonResponse(response)

    response = {
        "status": "OK",
        "item_id": new_event["item_id"],
        "admin_key": new_event["admin_key"]
    }

    return JsonResponse(response)

@cache_page(CACHE_TTL)
def open_event_view(request):
    return render(request, "events/open_event.html")

def participate_view(request, eventID):
    # Retrieving event data
    event_data = get_event_data(eventID, "event")

    # Return page not found
    if event_data == []:
        # raise Http404
        return error404_view(request, None, eventID)

    # Removing admin_key from event data before sending to the client for 
    # security reasons
    event_data.pop('admin_key', None)

    # Adding dates so Django can display it in template
    event_data["dates_formatted"] = [
        datetime.strptime(d, "%Y-%m-%dT%H:%M") for d in event_data["dates"]
    ]

    # Format event duration
    event_data["duration"] = int(event_data.get("duration", 60))

    # Selecting best date for the event (if event has multiple dates and
    # at least 1 participant)
    if len(event_data["dates"]) > 1 and len(event_data["participants"]) > 0:
        max_participants_per_date = 0
        best_date = ""

        # Convoluted but elegant way to obtain a total list of dates inserted
        # by every participant
        participants_dates = Counter(
            [d for dp in (
                    p["dates"] for p in event_data["participants"]
                ) for d in dp
            ]
        )

        # Best date as the first date with maximum number of participants
        for d in event_data["dates"]:
            if participants_dates[d] > max_participants_per_date:
                best_date = d
                max_participants_per_date = participants_dates[d]
        
        try:
            event_data["best_date"] = best_date
            event_data["best_date_formatted"] = datetime.strptime(
                best_date, "%Y-%m-%dT%H:%M"
            )
        except ValueError:
            pass

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
    
    # If user is not admin and the add_participant permission is false the
    # action is blocked
    if not is_admin and not user_add_participant:
        response = {
            "status": "ERROR",
            "description": _(
                "You are not authorized to perform this operation."
            )
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
    new_event = save_event_to_db(event_data)

    if new_event:
        response = {
            "status": "OK"
        }
    else:
        response = {
            "status": "ERROR",
            "description": _("Sorry, submitted data is invalid.")
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

    # Return page not found
    if event_data == []:
        return error404_view(request, None, eventID)

    # Check if the admin key provided as URL parameter correspond with the one
    # associated with the event
    if admin_key != event_data["admin_key"]:
        # Return permission denied HTTP 403
        raise PermissionDenied
    ### ###

    # Convert expiration_date to readable format (if present)
    if event_data.get("expiration_date", False):
        event_data["expiration_date"] = datetime.fromtimestamp(
            int(event_data["expiration_date"])
        )

    # Event duration in int format (represents duration in minutes)
    event_data["duration"] = int(event_data.get("duration", 60))

    # Adding dates so Django can display it in template
    event_data["dates_formatted"] = [
        datetime.strptime(d, "%Y-%m-%dT%H:%M") for d in event_data["dates"]
    ]

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
    new_event = True
    if is_admin:
        # Handle participants explicitly removed from admin to avoid 
        # race conditions on participant list
        admin_participants = request_data.get("participants", [])
        removed_participants = request_data.get("removed_participants", [])
        restored_participants = request_data.get("restored_participants", [])
        event_participants = event_data.get("participants", [])
        event_bin = event_data.get("event_bin", [])
        total_participants = []

        # Iteration over admin_participants
        event_participants_uids = [p["uid"] for p in event_participants]
        for p in admin_participants:
            p_uid = p.get("uid")
            if p_uid:
                if p_uid in removed_participants:
                    continue
                if p_uid in event_participants_uids:
                    total_participants.append(p)
            else:
                total_participants.append(p)

        # Iteration over event_participants
        total_participants_uids = [
            p.get("uid") for p in total_participants if p.get("uid")
        ]
        for p in event_participants:
            p_uid = p.get("uid")
            if p_uid in removed_participants:
                # Move participant to event_bin
                event_bin.append(p)
                continue
            if p_uid in total_participants_uids:
                continue
            total_participants.append(p)
        
        # Previously removed participants restored by admin page
        if restored_participants:
            for p in list(event_bin):
                if p["uid"] in restored_participants:
                    total_participants.append(p)
                    event_bin.remove(p)
        
        request_author = request_data.get("author")
        if request_author:
            event_data["author"] = request_author
        event_data["title"] = request_data.get("title", event_data["title"])
        event_data["description"] = request_data.get("description", "")
        event_data["has_location"] = request_data.get("has_location", False)
        event_data["location"] = request_data.get("location", "")
        event_data["dates"] = request_data.get("dates", [])
        event_data["dates"].sort() # Order event dates
        event_data["duration"] = request_data.get("duration", 60)
        event_data["event_theme"] = request_data.get("event_theme", "")
        event_data["participants"] = total_participants
        event_data["settings"]["add_participant"] = (
            request_data["settings"].get("add_participant", False)
        )
        event_data["settings"]["edit_participant"] = (
            request_data["settings"].get("edit_participant", False)
        )
        event_data["settings"]["remove_participant"] = (
            request_data["settings"].get("remove_participant", False)
        )
        event_data["event_bin"] = event_bin
    
        # Saving new event's info
        new_event = save_event_to_db(event_data)

    if new_event:
        response = {
            "status": "OK"
        }
    else:
         response = {
            "status": "ERROR",
            "description": _("Sorry, submitted data is invalid.")
        }

    return JsonResponse(response)

def modify_participants_view(request):
    if request.method != 'POST':
        return redirect("index")

    # Retrieve request data
    request_data = json.loads(request.body)

    item_id = request_data["item_id"]
    to_modify = request_data["modifications"].get("edited", {})
    to_delete = request_data["modifications"].get("deleted", [])

    # If there are no modifications then returns "OK"
    if len(to_modify) + len(to_delete) == 0:
        response = {
            "status": "OK"
        }
        return JsonResponse(response)
    
    # Retrieve event's data
    event_data = get_event_data(item_id, "event")
    if event_data == []:
        response = {
            "status": "ERROR",
            "description": _("An error has occurred.")
        }
        return JsonResponse(response)
    
    # Event' settings
    event_settings = event_data["settings"]
    edit_participant = event_settings.get("edit_participant", False)
    remove_participant = event_settings.get("remove_participant", False)

    # If the setting that allows for participants modification is true
    if edit_participant:
        # Applying modifications
        for i, p in enumerate(event_data["participants"]):
            uid = p.get("uid","")
            if uid in to_modify.keys():
                event_data["participants"][i] = to_modify[uid]

    # If the setting that allows for participants removal is true
    if remove_participant:
        event_data["event_bin"] = event_data.get("event_bin", [])
        # Deleting participants
        for p in list(event_data["participants"]):
            uid = p.get("uid", "")
            if uid in to_delete:
                event_data["event_bin"].append(p)
                event_data["participants"].remove(p)
    
    # Saving data to database
    new_event = save_event_to_db(event_data)
    
    if new_event:
        response = {
            "status": "OK"
        }
    else:
         response = {
            "status": "ERROR",
            "description": _("Sorry, submitted data is invalid.")
        }

    return JsonResponse(response)

def cancel_event_view(request):
    if request.method != 'POST':
        return redirect("index")

    # Retrieve request data
    request_data = json.loads(request.body)

    item_id = request_data["item_id"]
    admin_key = request_data.get("admin_key", "")

    # Only event administrators are authorized - check if admin_key is present
    if admin_key == "":
        response = {
            "status": "ERROR",
            "description": _(
                "You are not authorized to perform this operation."
            )
        }
        return JsonResponse(response)
    
    # Retrieve event data
    event_data = get_event_data(item_id)

    # Check if admin_key is correct
    if admin_key != event_data["admin_key"]:
        response = {
            "status": "ERROR",
            "description": _(
                "You are not authorized to perform this operation."
            )
        }
        return JsonResponse(response)
    
    # Calculate expiration date and update event
    # Expiration date in unix timestamp format -> TTL function of dynamoDB will
    # take care of deletion
    expiration_datetime = datetime.now() + timedelta(days=2)
    expiration_date = int(expiration_datetime.timestamp())
    event_data["is_cancelled"] = True
    event_data["expiration_date"] = expiration_date

    # Change event settings to turn off participants permission
    event_data["settings"]["add_participant"] = False
    event_data["settings"]["edit_participant"] = False
    event_data["settings"]["remove_participant"] = False

    # Save changes to DB
    new_event = save_event_to_db(event_data)

    if new_event:
        response = {
            "status": "OK"
            # "expiration_date": expiration_datetime
        }
    else: 
         response = {
            "status": "ERROR",
            "description": _("An error has occurred.")
        }
    return JsonResponse(response)

def reactivate_event_view(request):
    if request.method != 'POST':
        return redirect("index")

    # Retrieve request data
    request_data = json.loads(request.body)

    item_id = request_data["item_id"]
    admin_key = request_data.get("admin_key", "")

    # Only event administrators are authorized - check if admin_key is present
    if admin_key == "":
        response = {
            "status": "ERROR",
            "description": _(
                "You are not authorized to perform this operation."
            )
        }
        return JsonResponse(response)
    
    # Retrieve event data
    event_data = get_event_data(item_id)

    # Check if admin_key is correct
    if admin_key != event_data["admin_key"]:
        response = {
            "status": "ERROR",
            "description": _(
                "You are not authorized to perform this operation."
            )
        }
        return JsonResponse(response)
    
    # Removing expiration date and is_cancelled
    new_event = True
    if event_data.get("is_cancelled", False):
        try:
            del event_data["is_cancelled"]
            del event_data["expiration_date"]
        except:
            pass
        # Update event data
        new_event = save_event_to_db(event_data)
    
    if new_event:
        response = {
            "status": "OK"
        }
    else: 
         response = {
            "status": "ERROR",
            "description": _("An error has occurred.")
        }
    return JsonResponse(response)

def history_view(request):
    return render(request, "events/history.html")

@cache_page(CACHE_TTL)
def error404_view(request, exception, eventID=""):
    context = {}

    # If eventID is passed, pass down the value to template so it can be
    # removed from user's history
    if eventID != "":
        context["item_id"] = eventID

    return render(request, "events/error404.html", context)