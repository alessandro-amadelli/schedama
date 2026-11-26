"""
Test degli eventi privati.

Usano DynamoTestCase ed event_payload di events/tests.py (il file di test visto prima).
- I primi 3 descrivono il comportamento attuale e devono restare verdi.
- Gli altri 5 descrivono le correzioni proposte: oggi falliscono, dopo le modifiche passano.
"""
from django.urls import reverse

from events.tests import DynamoTestCase, event_payload

PASSWORD = "cena-segreta"


class PrivateEventTests(DynamoTestCase):

    def create_private(self, password=PASSWORD):
        return self.create_event(private_event=True, password_1=password, password_2=password)

    def login(self, item_id, password=PASSWORD, admin_key=""):
        return self.client.post(
            reverse("password_check"),
            {"event_id": item_id, "password": password, "admin_key": admin_key},
        )

    # ---- Comportamento attuale (deve restare) ----

    def test_private_event_asks_password(self):
        item_id, _ = self.create_private()
        response = self.client.get(reverse("participate_view", args=[item_id]))
        self.assertTemplateUsed(response, "events/private_event.html")

    def test_right_password_opens_event(self):
        item_id, _ = self.create_private()
        self.login(item_id)
        response = self.client.get(reverse("participate_view", args=[item_id]))
        self.assertTemplateUsed(response, "events/view_event.html")

    def test_password_change_logs_everyone_out(self):
        item_id, admin_key = self.create_private()
        self.login(item_id)
        body = event_payload(private_event=True, password_1="nuova-password", password_2="nuova-password")
        response = self.post_json("update_event_view", {"item_id": item_id, "admin_key": admin_key, **body})
        self.assertEqual(response.json()["status"], "OK", response.json())
        # Il cookie ottenuto con la vecchia password non vale più
        response = self.client.get(reverse("participate_view", args=[item_id]))
        self.assertTemplateUsed(response, "events/private_event.html")

    # ---- Correzioni proposte ----

    def test_short_password_is_rejected(self):
        response = self.post_json("save_event_view", event_payload(private_event=True, password_1="1", password_2="1"))
        self.assertEqual(response.json()["status"], "ERROR")

    def test_cookie_is_lax_and_expires(self):
        item_id, _ = self.create_private()
        cookie = self.login(item_id).cookies[f"auth_event_{item_id}"]
        self.assertEqual(cookie["samesite"], "Lax")
        self.assertTrue(cookie["max-age"])
        self.assertTrue(cookie["secure"] and cookie["httponly"])

    def test_admin_key_alone_opens_private_edit_page(self):
        item_id, admin_key = self.create_private()
        response = self.client.get(reverse("edit_event_view", args=[item_id]) + f"?k={admin_key}")
        self.assertTemplateUsed(response, "events/edit_event.html")
        # Da quel momento l'admin vede anche la pagina dei partecipanti
        response = self.client.get(reverse("participate_view", args=[item_id]))
        self.assertTemplateUsed(response, "events/view_event.html")

    def test_wrong_admin_key_on_private_event_is_forbidden(self):
        item_id, _ = self.create_private()
        response = self.client.get(reverse("edit_event_view", args=[item_id]) + "?k=sbagliata")
        self.assertEqual(response.status_code, 403)

    def test_reactions_of_private_event_are_hidden(self):
        item_id, _ = self.create_private()
        response = self.client.get(reverse("get_reactions_view", args=[item_id]))
        self.assertEqual(response.json()["status"], "ERROR")
