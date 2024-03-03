from django import forms
from django.utils.text import Truncator

# Max lengths of EventForm fields
AUTHOR_MAX_LENGTH = 30
TITLE_MAX_LENGTH = 150
DESCRIPTION_MAX_LENGTH = 400
LOCATION_MAX_LENGTH = 100
DURATION_MAX = (60 * 24 * 30) + (60 * 23) + 59
PARTICIPANT_NAME_MAX_LENGTH = 30
THEME_MAX_LENGTH = 20


class EventForm(forms.Form):
    author = forms.CharField(required=False)
    title = forms.CharField()
    description = forms.CharField(required=False)
    location = forms.CharField(required=False)
    has_location = forms.BooleanField(required=False, initial=False)
    dates = forms.JSONField()
    duration = forms.IntegerField(initial=60)
    participants = forms.JSONField()
    event_theme = forms.CharField(required=False)
    settings = forms.JSONField()
    item_type = forms.CharField(required=False, initial="event")

    def clean_author(self):
        author = self.cleaned_data["author"]
        return Truncator(author).chars(AUTHOR_MAX_LENGTH)

    def clean_title(self):
        title = self.cleaned_data["title"]
        return Truncator(title).chars(TITLE_MAX_LENGTH)

    def clean_description(self):
        description = self.cleaned_data["description"]
        return Truncator(description).chars(DESCRIPTION_MAX_LENGTH)

    def clean_location(self):
        location = self.cleaned_data["location"]
        return Truncator(location).chars(LOCATION_MAX_LENGTH)

    def clean_has_location(self):
        has_location = self.cleaned_data["has_location"]
        if has_location is None:
            has_location = False
        return has_location

    def clean_duration(self):
        duration = self.cleaned_data["duration"]
        if duration == 0:
            return 60
        if duration > DURATION_MAX:
            return DURATION_MAX
        return duration

    def clean_participants(self):
        participants = self.cleaned_data["participants"]
        for p in participants:
            p["name"] = Truncator(p.get("name" "")).chars(PARTICIPANT_NAME_MAX_LENGTH)
        return participants

    def clean_event_theme(self):
        event_theme = self.cleaned_data["event_theme"]
        return Truncator(event_theme).chars(THEME_MAX_LENGTH)

    def clean_settings(self):
        settings = self.cleaned_data["settings"]
        print(settings)
        return settings

    def clean_item_type(self):
        return "event"
