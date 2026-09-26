import datetime
import json
import socket
import threading
import unittest

from support import READY, ComposerCase

TASHKENT = datetime.timezone(datetime.timedelta(hours=5))


def stalling_server():
    srv = socket.socket()
    srv.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    srv.bind(("127.0.0.1", 0))
    srv.listen(5)

    def answer(conn):
        data = b""
        conn.settimeout(30)
        while b"\r\n\r\n" not in data:
            chunk = conn.recv(65536)
            if not chunk:
                return
            data += chunk
        cors = b"Access-Control-Allow-Origin: *\r\n"
        if data.startswith(b"OPTIONS"):
            conn.sendall(b"HTTP/1.1 204 No Content\r\n" + cors + b"Access-Control-Allow-Methods: POST\r\n"
                         b"Access-Control-Allow-Headers: content-type, idempotency-key\r\nContent-Length: 0\r\n\r\n")
            return answer(conn)
        conn.sendall(b"HTTP/1.1 201 Created\r\nContent-Type: application/json\r\n" + cors +
                     b"Content-Length: 100\r\n\r\n{\"event_id\":")

    def loop():
        while True:
            try:
                conn, _ = srv.accept()
            except OSError:
                return
            threading.Thread(target=answer, args=(conn,), daemon=True).start()

    threading.Thread(target=loop, daemon=True).start()
    return srv


class ComposerTransportTest(ComposerCase):
    def ready_to_send(self, page=None):
        page = page or self.page
        self.set_endpoint(page)
        self.fill_sql_texts(page)
        page.click("#scopeAll")

    def test_double_enter_or_space_never_sends(self):
        seen = self.capture([(201, {"event_id": 1})])
        self.ready_to_send()
        for key in ["Enter", " "]:
            with self.subTest(key=key):
                self.page.focus("#submitBtn")
                self.page.keyboard.press(key)
                self.page.wait_for_timeout(120)
                self.page.keyboard.press(key)
                self.page.wait_for_timeout(300)
                self.assertEqual(self.page.evaluate("document.activeElement.id"), "resultTitle")
                self.assertEqual(seen, [])
                self.page.click("#cancelSend")
                self.assertFalse(self.page.evaluate("document.getElementById('resultDialog').open"))

    def test_a_redirect_is_not_reported_as_sent(self):
        self.capture([(302, "", {"location": "/index.html", "content-type": "text/html"})])
        self.ready_to_send()
        self.page.click("#submitBtn")
        self.confirm()
        self.page.wait_for_selector('.send-result[data-state="failed"]')
        self.assertEqual(self.page.inner_text("#draftBadge"), "ҚОРАЛАМА")
        self.assertTrue(self.leaving_is_held())

    def test_an_html_page_is_not_reported_as_sent(self):
        self.capture([(200, "<html>login</html>", {"content-type": "text/html"})])
        self.ready_to_send()
        self.page.click("#submitBtn")
        self.confirm()
        self.page.wait_for_selector('.send-result[data-state="unknown"]')
        self.assertIn("text/html", self.page.inner_text(".send-sub"))
        self.assertTrue(self.page.is_visible("#retryBtn"))
        self.assertTrue(self.leaving_is_held())

    def test_conflict_means_it_was_already_sent(self):
        seen = self.capture([(409, {"error": "duplicate"})])
        self.ready_to_send()
        self.page.click("#submitBtn")
        self.confirm()
        self.page.wait_for_selector('.send-result[data-state="duplicate"]')
        self.assertEqual(self.page.locator("#retryBtn").count(), 0)
        self.assertEqual(self.page.inner_text("#draftBadge"), "ЮБОРИЛДИ")
        self.page.click("#resultClose")
        self.page.click("#submitBtn")
        self.page.wait_for_selector('.send-result[data-state="duplicate"]')
        self.assertEqual(len(seen), 1)

    def test_server_field_errors_are_listed_without_a_retry(self):
        self.capture([(422, {"errors": {"texts.uz.title": "жуда узун"}})])
        self.ready_to_send()
        self.page.click("#submitBtn")
        self.confirm()
        self.page.wait_for_selector('.send-result[data-state="failed"]')
        self.assertIn("Ўзбекча сарлавҳа: жуда узун", self.page.inner_text(".send-errors"))
        self.assertEqual(self.page.locator("#retryBtn").count(), 0)

    def test_a_stalled_body_still_times_out(self):
        srv = stalling_server()
        self.addCleanup(srv.close)
        page = self.context.new_page()
        page.clock.install()
        page.goto(self.url, wait_until="domcontentloaded")
        page.wait_for_function(READY)
        self.ready_to_send(page)
        self.set_endpoint(page, f"http://127.0.0.1:{srv.getsockname()[1]}/api/announcements")
        page.click("#submitBtn")
        self.confirm(page)
        page.wait_for_selector('.send-result[data-state="sending"]')
        page.wait_for_timeout(500)
        page.clock.run_for(15500)
        page.wait_for_selector('.send-result[data-state="unknown"]', timeout=10000)
        self.assertIn("жавоб бермади", page.inner_text(".send-sub"))

    def test_expiry_that_passes_during_review_is_refused(self):
        seen = self.capture([(201, {"event_id": 1})])
        page = self.context.new_page()
        page.clock.install(time=datetime.datetime(2030, 3, 4, 10, 0, tzinfo=TASHKENT))
        page.goto(self.url, wait_until="domcontentloaded")
        page.wait_for_function(READY)
        self.ready_to_send(page)
        self.to_custom(page)
        self.type_date("04032030", page)
        page.fill("#fTime", "10:03")
        page.click("#submitBtn")
        page.wait_for_selector('.send-result[data-state="review"]')
        page.clock.fast_forward("05:00")
        page.click("#confirmSend")
        page.wait_for_selector('.send-result[data-state="stale"]')
        self.assertEqual(seen, [])

    def test_tampered_autosave_ids_are_refused(self):
        page = self.context.new_page()
        draft = {"v": 2, "texts": {"uzTitle": "Эски"}, "scope": {"scope": "region", "regionId": "6"}}
        page.add_init_script(f"localStorage.setItem('om-composer-draft-v2', {json.dumps(json.dumps(draft))})")
        page.goto(self.url, wait_until="domcontentloaded")
        page.wait_for_function(READY)
        self.assertEqual(page.input_value("#uzTitle"), "Эски")
        self.assertEqual(page.get_attribute("#scopeArea", "aria-checked"), "false")

    def test_an_unknown_copied_district_does_not_widen_the_audience(self):
        page = self.context.new_page()
        page.add_init_script("sessionStorage.setItem('om-draft', JSON.stringify({ uzTitle: 'Эски', scope: { region: 'Хоразм вилояти', district: 'Нет такого' } }))")
        page.goto(self.url, wait_until="domcontentloaded")
        page.wait_for_function(READY)
        self.assertEqual(page.get_attribute("#scopeArea", "aria-checked"), "false")
        self.assertIn("топилмади", page.inner_text(".toast"))

    def test_emoji_joiners_survive_and_bidi_controls_go(self):
        self.fill_sql_texts()
        self.page.fill("#uzTitle", "​Оила 👨‍👩‍👧 ‮тест​")
        self.page.click("#scopeAll")
        self.page.click("#submitBtn")
        title = self.dialog_json()["payload"]["texts"]["uz"]["title"]
        self.assertEqual(title, "Оила 👨‍👩‍👧 тест")


if __name__ == "__main__":
    unittest.main()
