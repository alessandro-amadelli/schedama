"""
Test automatici di Schedama.

Per eseguirli (dalla cartella dove si trova manage.py):
    python manage.py test events          # tutti i test dell'app events
    python manage.py test events -v 2     # con il nome di ogni test
"""
import json
from unittest import mock

import boto3
from django.test import SimpleTestCase, override_settings
from django.urls import reverse
from moto import mock_aws

from events.forms import EventForm
from schedama import dynamodb_ops


DATES = ["2027-03-01T20:00", "2027-03-02T20:00"]


def event_payload(**changes):
    """Dati validi per creare un evento. Ogni test cambia solo quello che gli serve."""
    data = {
        "author": "Ale",
        "title": "Cena",
        "description": "",
        "has_location": False,
        "location": "",
        "has_parking": False,
        "parking": "",
        "dates": DATES,
        "duration": 60,
        "participants": [],
        "event_theme": "",
        "private_event": False,
        "password_1": "",
        "password_2": "",
        "settings": {"add_participant": True, "edit_participant": True, "remove_participant": True},
    }
    data.update(changes)
    return data


# --------------------------------------------------------------------------
# 1) Test del form: niente database, niente rete. Sono i più semplici e veloci.
# --------------------------------------------------------------------------
class EventFormTests(SimpleTestCase):

    def test_dates_are_sorted_and_deduplicated(self):
        form = EventForm(event_payload(dates=[DATES[1], DATES[0], DATES[1]]))
        self.assertTrue(form.is_valid(), form.errors)
        self.assertEqual(form.cleaned_data["dates"], DATES)

    def test_malformed_date_is_rejected(self):
        form = EventForm(event_payload(dates=["ciao"]))
        self.assertFalse(form.is_valid())
        self.assertIn("dates", form.errors)

    def test_participant_dates_outside_the_event_are_dropped(self):
        participants = [{"name": "Anna", "dates": [DATES[0], "fake", {}]}]
        form = EventForm(event_payload(participants=participants))
        self.assertTrue(form.is_valid(), form.errors)
        self.assertEqual(form.cleaned_data["participants"][0]["dates"], [DATES[0]])

    def test_zalgo_name_is_capped(self):
        participants = [{"name": "a" + "́" * 10_000, "dates": []}]
        form = EventForm(event_payload(participants=participants))
        self.assertTrue(form.is_valid(), form.errors)
        self.assertLessEqual(len(form.cleaned_data["participants"][0]["name"]), 30)


# --------------------------------------------------------------------------
# 2) Base per i test che passano da DynamoDB: lo sostituisce con moto,
#    un DynamoDB finto in memoria. Il tuo DB locale e quello di produzione
#    non vengono mai toccati.
# --------------------------------------------------------------------------
class DynamoTestCase(SimpleTestCase):

    def setUp(self):
        aws = mock_aws()
        aws.start()
        self.addCleanup(aws.stop)

        resource = boto3.resource(
            "dynamodb", region_name="eu-central-1",
            aws_access_key_id="test", aws_secret_access_key="test",
        )
        table = resource.create_table(
            TableName="schedama_table",
            KeySchema=[
                {"AttributeName": "item_type", "KeyType": "HASH"},
                {"AttributeName": "item_id", "KeyType": "RANGE"},
            ],
            AttributeDefinitions=[
                {"AttributeName": "item_type", "AttributeType": "S"},
                {"AttributeName": "item_id", "AttributeType": "S"},
            ],
            BillingMode="PAY_PER_REQUEST",
        )
        # Tutte le funzioni di dynamodb_ops usano la variabile globale "table":
        # per la durata del test punta alla tabella finta.
        patcher = mock.patch.object(dynamodb_ops, "table", table)
        patcher.start()
        self.addCleanup(patcher.stop)

    def post_json(self, url_name, body, *args, **headers):
        return self.client.post(
            reverse(url_name, args=args), data=json.dumps(body),
            content_type="application/json", **headers,
        )

    def create_event(self, **changes):
        response = self.post_json("save_event_view", event_payload(**changes))
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "OK", data)
        return data["item_id"], data["admin_key"]


# --------------------------------------------------------------------------
# 3) Test dei flussi: richieste vere alle tue view, come farebbe il browser.
# --------------------------------------------------------------------------
class EventFlowTests(DynamoTestCase):

    def test_create_event_saves_it_in_dynamodb(self):
        item_id, admin_key = self.create_event(title="Cena di prova")
        saved = dynamodb_ops.select_record_by_id(item_id, "event")
        self.assertEqual(saved["title"], "Cena di prova")
        self.assertEqual(saved["admin_key"], admin_key)

    def test_participate_page_shows_the_event(self):
        item_id, _ = self.create_event(title="Cena di prova")
        response = self.client.get(reverse("participate_view", args=[item_id]))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Cena di prova")

    def test_invalid_participant_dates_do_not_break_the_page(self):
        # Il bug del punto 1: dates=[{}] mandava in errore 500 la pagina dell'evento
        item_id, _ = self.create_event()
        response = self.post_json(
            "add_participant_view",
            {"item_id": item_id, "new_participant": {"name": "Test", "dates": [{}]}},
        )
        self.assertEqual(response.json()["status"], "OK")
        saved = dynamodb_ops.select_record_by_id(item_id, "event")
        self.assertEqual(saved["participants"][-1]["dates"], [])
        page = self.client.get(reverse("participate_view", args=[item_id]))
        self.assertEqual(page.status_code, 200)


# --------------------------------------------------------------------------
# 4) Rate limit: in sviluppo usi la DummyCache, che non conta nulla.
#    Per questo test si usa una cache vera in memoria.
# --------------------------------------------------------------------------
@override_settings(CACHES={"default": {"BACKEND": "django.core.cache.backends.locmem.LocMemCache"}})
class RateLimitTests(DynamoTestCase):

    def setUp(self):
        super().setUp()
        from django.core.cache import cache
        cache.clear()

    def test_reactions_are_limited_per_ip(self):
        item_id, _ = self.create_event()
        anna = {"HTTP_CF_CONNECTING_IP": "93.40.1.1"}
        marco = {"HTTP_CF_CONNECTING_IP": "151.20.7.7"}
        for _ in range(2):  # limite: 2 al minuto
            response = self.post_json("add_reaction_view", {"emoji": "heart"}, item_id, **anna)
            self.assertEqual(response.status_code, 200)
        third = self.post_json("add_reaction_view", {"emoji": "heart"}, item_id, **anna)
        self.assertEqual(third.status_code, 429)
        # Un'altra persona non è bloccata dal limite di Anna
        other = self.post_json("add_reaction_view", {"emoji": "heart"}, item_id, **marco)
        self.assertEqual(other.status_code, 200)
