import copy
from datetime import datetime, timedelta
import hashlib
import json
import re

from django.contrib.auth.hashers import make_password, check_password
from django.core import signing
from django.core.cache import cache
from django.core.exceptions import PermissionDenied
from django.http import JsonResponse
from django.shortcuts import render, redirect
from django.utils.translation import gettext as _
from django.views.decorators.cache import cache_page
from django.views.generic.base import TemplateView
from django_ratelimit.decorators import ratelimit

from collections import Counter
import schedama.dynamodb_ops as dynamodb_ops
from schedama.settings import CACHE_TTL, CACHE_DB_TTL, SECRET_KEY
from .forms import EventForm, PasswordForm


class ServiceWorker(TemplateView):
    template_name = "events/sw.js"
    content_type = "application/javascript"


def generate_cookie_salt(event_id):
    """
    Generates a hash to be used as a salt in signing and verification of signed cookies
    for private events authorization.
    """
    # Retrieving event data
    event_data = get_event_data(event_id)
    creation_timestamp = event_data.get("creation_date")
    password = event_data.get("password", "")

    salt_hash = hashlib.sha256(
        f'{event_id}{creation_timestamp}{SECRET_KEY}{password}'.encode()
    ).hexdigest()
    return salt_hash


def check_event_authorization(request, event_id):
    """
    Check the request signed_cookie to verify if the user is authorized to access the event
    """
    try:
        signed_value = request.get_signed_cookie(
            f"auth_event_{event_id}", salt=generate_cookie_salt(event_id)
        )
        value = signing.loads(signed_value)
    except (signing.BadSignature, KeyError):
        return False

    return value.get("authenticated", False)


def get_event_data(item_id, item_type="event"):
    """
    Retrieves saved event's data with a cache-first logic.
    """
    cache_key = item_type + "_" + item_id
    
    event_data = cache.get(cache_key)
    if not event_data:
        event_data = dynamodb_ops.select_record_by_id(item_id, item_type)
        cache.set(cache_key, event_data, CACHE_DB_TTL)

    return event_data


def validate_event(event_data, custom_validation=False):
    """
    Event is validated through the django form.is_valid() function and fields are cleaned based on
    EventForm form class
    """
    form = EventForm(event_data, custom_validation)

    if form.is_valid(custom_validation):
        # Getting cleaned_data values for event fields
        event_data["author"] = form.cleaned_data["author"]
        event_data["title"] = form.cleaned_data["title"]
        event_data["description"] = form.cleaned_data["description"]
        event_data["location"] = form.cleaned_data["location"]
        event_data["has_location"] = form.cleaned_data["has_location"]
        event_data["duration"] = form.cleaned_data["duration"]
        event_data["event_theme"] = form.cleaned_data["event_theme"]
        event_data["item_type"] = form.cleaned_data["item_type"]
        event_data["private_event"] = form.cleaned_data.get("private_event", False)
        # Saving event password
        if custom_validation and event_data["private_event"]:
            password = form.cleaned_data.get("password_1", None)
            if password:
                password = make_password(password)
                event_data["password"] = password
        # Removing password_1, password_2 fields
        event_data.pop("password_1", None)
        event_data.pop("password_2", None)
        return True, event_data
    return False, form.errors


def save_event_to_db(event_data, custom_validation=False):
    """
    This function calls event validation and saves event to the database
    """
    is_validated, event_data = validate_event(event_data, custom_validation)

    if not is_validated:
        error_msg = re.sub(r'\* .*?\n\s*\*', '', (event_data.as_text())).strip()
        return False, error_msg

    # Save event to database
    db_event = dynamodb_ops.insert_record(event_data)

    # Saving event_data to cache (or update value if already present)
    cache_key = db_event["item_type"] + "_" + db_event["item_id"]
    cache.set(cache_key, event_data, CACHE_DB_TTL)

    return True, event_data


def update_event_in_db(item_id, item_type, update_dict):
    dynamodb_ops.update_single_event(
        item_id,
        item_type,
        update_dict
    )
    cache_key = f"{item_type}_{item_id}"
    cache.delete(cache_key)


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


@cache_page(CACHE_TTL)
def privacy_view(request):
    return render(request, "events/privacy.html")


@ratelimit(key='ip', rate='3/m', method='POST', block=True)
def save_event_view(request):
    """
    This view is called when creating a new event
    """
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

    # Activate form custom validation (for private event settings managing)
    custom_validation = True

    try:
        result, new_event = save_event_to_db(event_data, custom_validation)

        if not result:
            response = {
                "status": "ERROR",
                "description": new_event
            }
            return JsonResponse(response)
    except Exception as e:
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
    event_data = get_event_data(eventID)

    # Return page not found
    if not event_data:
        return error404_view(request, None, eventID)

    # Check if event is private and user is authorized
    if event_data.get("private_event") and not check_event_authorization(request, eventID):
        return private_event_view(request, eventID)

    # Removing admin_key and event password (if present) from event data before
    # sending to the client for security reasons
    event_data.pop('admin_key', None)
    event_data.pop('password', None)

    # Adding dates so Django can display it in template
    event_data["dates_formatted"] = [
        datetime.strptime(d, "%Y-%m-%dT%H:%M") for d in event_data["dates"]
    ]

    # Format event duration
    event_data["duration"] = int(event_data.get("duration", 60)) or 60

    # Selecting best date for the event (if event has multiple dates and
    # at least 1 participant)
    if len(event_data["dates"]) > 1 and len(event_data["participants"]) > 0:
        max_participants_per_date = 0
        best_date = ""

        # Convoluted but elegant way to obtain a total list of dates inserted
        # by every participant
        participants_dates = Counter(
            [
                d for dp in (
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
    response = render(request, "events/view_event.html", context)

    if event_data.get("private_event"):
        # Prevent caching for private events
        response["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
        response["Pragma"] = "no-cache"
        response["Expires"] = "0"

    return response


@ratelimit(key='ip', rate='10/m', method='POST', block=True)
def add_participant_view(request):
    if request.method != 'POST':
        return redirect("index")
    
    request_data = json.loads(request.body)
    item_id = request_data.get("item_id")
    new_participant = request_data.get("new_participant")
    admin_key = request_data.get("admin_key", None)

    # Event data retrieved from database
    event_data = get_event_data(item_id)
    event_settings = event_data["settings"]

    ### AUTHORIZATION CHECKS ###
    # Check if event is private and user is authorized
    if event_data.get("private_event") and not check_event_authorization(request, item_id):
        return private_event_view(request, item_id)

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

    # Check if the name is already present in the participants list
    participants_names = [p.get("name") for p in event_data.get("participants", [])]
    if new_participant_ok["name"] in participants_names:
        response = {
            "status": "ERROR",
            "description": _(
                "Mmmmh, a participant with this name already exists. "
                "Maybe you've already registered? Or just try to be more...original"
            )
        }
        return JsonResponse(response)

    # Adding new participant and cleaning input
    event_data["participants"].append(new_participant_ok)
    form = EventForm(event_data)
    if not form.is_valid():
        response = {
            "status": "ERROR",
            "description": _("Sorry, submitted data is invalid.")
        }
        return JsonResponse(response)

    participants = form.cleaned_data.get("participants", [])

    # Updating event
    try:
        update_event_in_db(
            event_data["item_id"],
            event_data["item_type"],
            {"participants": participants}
        )
        result = True
    except Exception as e:
        result = False

    if result:
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
    admin_key = request.GET.get('k')

    ### CHECK AUTHORIZATION ###
    # Check if the admin key (URL parameter k) is present
    if not admin_key:
        return redirect("participate_view", eventID)

    # Get event data (only if the admin key is present)
    event_data = get_event_data(eventID)

    # Return page not found
    if not event_data:
        return error404_view(request, None, eventID)

    # Check if event is private and user is authorized
    if event_data.get("private_event") and not check_event_authorization(request, eventID):
        return private_event_view(request, eventID)

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


@ratelimit(key='ip', rate='10/m', method='POST', block=True)
def update_event_view(request):
    if request.method != 'POST':
        return redirect("index")

    # Retrieve request data
    request_data = json.loads(request.body)
    form = EventForm(request_data)

    if not form.is_valid():
        response = {
            "status": "ERROR",
            "description": _("Sorry, submitted data is invalid.")
        }
        return JsonResponse(response)

    item_id = request_data.get("item_id", "")
    admin_key = request_data.get("admin_key", "")

    # Retrieve event's data
    old_event_data = get_event_data(item_id)
    if not old_event_data:
        response = {
            "status": "ERROR",
            "description": _("An error has occurred.")
        }
        return JsonResponse(response)
    event_data = copy.deepcopy(old_event_data)

    event_settings = event_data["settings"]

    ### CHECK AUTHORIZATION ###
    # Check user's and event authorizations
    is_admin = admin_key == event_data["admin_key"]
    if event_data.get("private_event") and not check_event_authorization(request, item_id):
        response = {
            "status": "ERROR",
            "description": _("You are not authorized to perform this operation.")
        }
        return JsonResponse(response)
    ### ###

    # Update ADMIN fields of the event
    if is_admin:
        # Handle participants explicitly removed from admin to avoid 
        # race conditions on participant list
        admin_participants = form.cleaned_data.get("participants", [])
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
        
        request_author = form.cleaned_data.get("author")
        if request_author:
            event_data["author"] = request_author
        event_data["title"] = form.cleaned_data.get("title", event_data["title"])
        event_data["description"] = form.cleaned_data.get("description", "")
        event_data["has_location"] = form.cleaned_data.get("has_location", False)
        event_data["location"] = form.cleaned_data.get("location", "")
        event_data["has_parking"] = form.cleaned_data.get("has_parking", False)
        event_data["parking"] = form.cleaned_data.get("parking", "")
        event_data["dates"] = form.cleaned_data.get("dates", [])
        event_data["dates"].sort()  # Order event dates
        event_data["duration"] = form.cleaned_data.get("duration", 60)
        event_data["event_theme"] = form.cleaned_data.get("event_theme", "")
        event_data["participants"] = total_participants
        event_data["settings"]["add_participant"] = (
            form.cleaned_data["settings"].get("add_participant", False)
        )
        event_data["settings"]["edit_participant"] = (
            form.cleaned_data["settings"].get("edit_participant", False)
        )
        event_data["settings"]["remove_participant"] = (
            form.cleaned_data["settings"].get("remove_participant", False)
        )
        event_data["event_bin"] = event_bin

        # Check if user has modified security settings
        custom_validation = False
        request_private_event = request_data.get("private_event")
        # Check if private_event flag is present in request data
        if request_private_event is not None:
            # Check if private_event flag has been changed
            if request_private_event != event_data.get("private_event", False):
                event_data["private_event"] = request_private_event
                # Check if private_event has been flagged
                if request_private_event:
                    custom_validation = True
                    event_data["password_1"] = request_data.get("password_1", "")
                    event_data["password_2"] = request_data.get("password_2", "")
            else:
                # If private_event flag has not been modified, check if the password has been updated
                if (
                        request_private_event and
                        any([request_data.get("password_1", ""), request_data.get("password_2", "")])
                ):
                    custom_validation = True
                    event_data["password_1"] = request_data.get("password_1", "")
                    event_data["password_2"] = request_data.get("password_2", "")

        # Check if at least one event info has changed
        if event_data == old_event_data:
            response = {
                "status": "OK"
            }
            return JsonResponse(response)

        # Saving new event's info
        result, new_event = save_event_to_db(event_data, custom_validation)

        if result:
            response = {
                "status": "OK"
            }
        else:
            response = {
                "status": "ERROR",
                "description": new_event
            }

        return JsonResponse(response)
    response = {
        "status": "ERROR",
        "description": _("You are not authorized to perform this operation.")
    }
    return JsonResponse(response)


@ratelimit(key='ip', rate='10/m', method='POST', block=True)
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
    old_event_data = get_event_data(item_id)
    if not old_event_data:
        response = {
            "status": "ERROR",
            "description": _("An error has occurred.")
        }
        return JsonResponse(response)
    event_data = copy.deepcopy(old_event_data)

    # Check if event is private and user is authorized
    if event_data.get("private_event") and not check_event_authorization(request, item_id):
        response = {
            "status": "ERROR",
            "description": _("You are not authorized to perform this operation.")
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
            uid = p.get("uid", "")
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

    # Updating event with new participants list
    form = EventForm(event_data)
    if not form.is_valid():
        response = {
            "status": "ERROR",
            "description": _("Sorry, submitted data is invalid.")
        }
        return JsonResponse(response)

    participants = form.cleaned_data.get("participants", [])

    # Check if at a least one event info has changed
    if event_data == old_event_data:
        response = {
            "status": "OK"
        }
        return JsonResponse(response)

    # Updating event
    try:
        update_event_in_db(
            event_data["item_id"],
            event_data["item_type"],
            {
                "participants": participants,
                "event_bin": event_data.get("event_bin", [])
            }
        )
        result = True
    except Exception as e:
        result = False

    if result:
        response = {
            "status": "OK"
        }
    else:
        response = {
            "status": "ERROR",
            "description": _("Sorry, submitted data is invalid.")
        }

    return JsonResponse(response)


@ratelimit(key='ip', rate='10/m', method='POST', block=True)
def cancel_event_view(request):
    if request.method != 'POST':
        return redirect("index")

    # Retrieve request data
    request_data = json.loads(request.body)

    item_id = request_data["item_id"]
    admin_key = request_data.get("admin_key")

    # Only event administrators are authorized - check if admin_key is present
    if not admin_key:
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
    # Expiration date in unix timestamp format -> TTL function of dynamoDB will take care of deletion
    expiration_datetime = datetime.now() + timedelta(days=2)
    expiration_date = int(expiration_datetime.timestamp())
    event_data["is_cancelled"] = True
    event_data["expiration_date"] = expiration_date

    # Change event settings to turn off participants permission
    event_data["settings"]["add_participant"] = False
    event_data["settings"]["edit_participant"] = False
    event_data["settings"]["remove_participant"] = False

    # Save changes to DB
    result, new_event = save_event_to_db(event_data)

    if result:
        response = {
            "status": "OK"
        }
    else:
        response = {
            "status": "ERROR",
            "description": _("An error has occurred.")
        }
    return JsonResponse(response)


@ratelimit(key='ip', rate='10/m', method='POST', block=True)
def reactivate_event_view(request):
    if request.method != 'POST':
        return redirect("index")

    # Retrieve request data
    request_data = json.loads(request.body)

    item_id = request_data["item_id"]
    admin_key = request_data.get("admin_key")

    # Only event administrators are authorized - check if admin_key is present
    if not admin_key:
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
    
    result = True
    if event_data.get("is_cancelled", False):
        # Removing expiration date and is_cancelled
        event_data.pop("is_cancelled", None)
        event_data.pop("expiration_date", None)
        # Update event data
        result, new_event = save_event_to_db(event_data)
    
    if result:
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


def private_event_view(request, eventID):
    admin_key = request.GET.get('k')

    context = {
        "event_id": eventID,
        "admin_key": admin_key or ""
    }

    return render(request, "events/private_event.html", context)


@ratelimit(key='ip', rate='5/m', method='POST', block=True)
def password_check_view(request):
    if request.method != 'POST':
        return redirect("index")

    form = PasswordForm(request.POST)
    if not form.is_valid():
        return redirect("index")

    event_id = form.cleaned_data["event_id"]
    password = form.cleaned_data["password"]
    admin_key = form.cleaned_data.get("admin_key")

    # Retrieve event data
    event_data = get_event_data(event_id)

    # Return page not found
    if not event_data:
        return error404_view(request, None, event_id)

    # Check request password against event password
    event_password = event_data.get("password")
    if not check_password(password, event_password):
        form.add_error(
            "password",
            _("Wrong password! Ehm...are you sure you're supposed to see this event?")
        )
        context = {
            "event_id": event_id,
            "admin_key": admin_key,
            "form": form
        }
        return render(request, "events/private_event.html", context)

    # Check if admin_key is present
    if admin_key:
        # Direct user to edit_event view
        response = redirect(f"/edit-event/{event_id}?k={admin_key}")
    else:
        # Direct user to participate view
        response = redirect(f'/participate/{event_id}')

    # Authorise user and redirect to participant view
    signed_value = signing.dumps({'authenticated': True})
    response.set_signed_cookie(
        f"auth_event_{event_id}",
        signed_value,
        salt=generate_cookie_salt(event_id),
        secure=True,
        httponly=True,
    )
    return response


@ratelimit(key='ip', rate='2/m', method='POST', block=True)
def add_reaction_view(request, eventID):
    if request.method != 'POST':
        return redirect("index")

    VALID_EMOJIS = ["heart", "fire", "thumbs_up", "party", "eyes"]

    # Retrieve request data
    request_data = json.loads(request.body)
    emoji = request_data.get("emoji", "")

    if emoji not in VALID_EMOJIS:
        response = {
            "status": "ERROR",
            "description": _("Emoji is required.")
        }
        return JsonResponse(response)

    # Retrieve event data
    event_data = get_event_data(eventID)

    # Return page not found
    if not event_data:
        return error404_view(request, None, eventID)

    if "reactions" not in event_data:
        event_data["reactions"] = {}
    event_data["reactions"][emoji] = event_data["reactions"].get(emoji, 0) + 1
    update_event_in_db(eventID, "event", {"reactions": event_data["reactions"]})

    response = {
        "status": "OK",
        "reactions": event_data.get("reactions", [])
    }

    return JsonResponse(response)


def get_reactions_view(request, eventID):
    """
    Returns the reactions for a specific event.
    """
    # Retrieve event data
    event_data = get_event_data(eventID)

    # Return page not found
    if not event_data:
        return error404_view(request, None, eventID)

    # Get reactions from event data
    reactions = event_data.get("reactions", {})

    response = {
        "status": "OK",
        "reactions": reactions
    }

    return JsonResponse(response)


@cache_page(CACHE_TTL)
def error404_view(request, exception, eventID=""):
    context = {}

    # If eventID is passed, pass down the value to template, so it can be
    # removed from user's history
    if eventID:
        context["item_id"] = eventID

    return render(request, "events/error404.html", context)


@cache_page(CACHE_TTL)
def error403_view(request, exception):
    return render(request, "events/error403.html", status=403)
