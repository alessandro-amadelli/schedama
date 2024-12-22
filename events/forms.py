from django import forms
from django.utils.text import Truncator
from django.utils.translation import gettext as _

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
    participants = forms.JSONField(required=False)
    event_theme = forms.CharField(required=False)
    settings = forms.JSONField()
    item_type = forms.CharField(required=False, initial="event")
    private_event = forms.BooleanField(required=False)
    password_1 = forms.CharField(required=False)
    password_2 = forms.CharField(required=False)
    custom_validation = forms.BooleanField(required=False)

    def clean_author(self):
        author = self.cleaned_data.get("author", "")
        return Truncator(author).chars(AUTHOR_MAX_LENGTH)

    def clean_title(self):
        title = self.cleaned_data["title"]
        return Truncator(title).chars(TITLE_MAX_LENGTH)

    def clean_description(self):
        description = self.cleaned_data.get("description", "")
        return Truncator(description).chars(DESCRIPTION_MAX_LENGTH)

    def clean_dates(self):
        dates = self.cleaned_data.get("dates", [])
        return list(set(dates))

    def clean_location(self):
        location = self.cleaned_data.get("location", "")
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
        participants = self.cleaned_data.get("participants")
        if participants is None:
            participants = []
        for p in participants:
            p["name"] = Truncator(p.get("name" "")).chars(PARTICIPANT_NAME_MAX_LENGTH)
        return participants

    def clean_event_theme(self):
        event_theme = self.cleaned_data["event_theme"]
        return Truncator(event_theme).chars(THEME_MAX_LENGTH)

    def clean_settings(self):
        settings = self.cleaned_data["settings"]
        return settings

    @staticmethod
    def clean_item_type():
        return "event"

    def clean_private_event(self):
        private_event = self.cleaned_data["private_event"]
        if private_event is None:
            private_event = False
        return private_event

    def is_valid(self, custom_validation=False):
        valid = super(EventForm, self).is_valid()

        if not custom_validation:
            return valid

        if self.cleaned_data.get("private_event"):
            if not self.cleaned_data.get("password_1") or not self.cleaned_data.get("password_2"):
                self.add_error(
                    None,
                    _("You checked \"Make event private\" option but did not set a password.")
                )
                return False
            if self.cleaned_data.get("password_1") != self.cleaned_data.get("password_2"):
                self.add_error(
                    None,
                    _("The passwords you entered do not match.")
                )
                return False

        return valid


class PasswordForm(forms.Form):
    event_id = forms.CharField()
    password = forms.CharField()
    admin_key = forms.CharField(required=False)
