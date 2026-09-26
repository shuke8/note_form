import datetime
import unittest

from support import READY, ComposerCase

TASHKENT = datetime.timezone(datetime.timedelta(hours=5))


class ComposerResendTest(ComposerCase):
    def clocked_page(self):
        page = self.context.new_page()
        page.clock.install(time=datetime.datetime(2030, 3, 4, 10, 0, tzinfo=TASHKENT))
        page.goto(self.url, wait_until="domcontentloaded")
        page.wait_for_function(READY)
        self.set_endpoint(page)
        self.fill_sql_texts(page)
        page.click("#scopeAll")
        return page

    def test_a_late_retry_resends_the_reviewed_body(self):
        seen = self.capture([(503, {}), (201, {"event_id": 3})])
        page = self.clocked_page()
        page.click("#submitBtn")
        page.wait_for_selector('.send-result[data-state="review"]')
        reviewed = self.dialog_json(page)
        page.clock.fast_forward("02:00")
        page.click("#confirmSend")
        page.wait_for_selector('.send-result[data-state="failed"]')
        page.clock.fast_forward("00:31")
        page.wait_for_function("!document.getElementById('retryBtn').disabled")
        page.click("#retryBtn")
        page.wait_for_selector('.send-result[data-state="sent"]')
        self.assertEqual(len(seen), 2)
        self.assertEqual(seen[0]["body"], reviewed)
        self.assertEqual(seen[1]["body"], reviewed)
        self.assertEqual(seen[0]["headers"]["idempotency-key"], seen[1]["headers"]["idempotency-key"])

    def test_reopening_a_failed_message_later_keeps_its_body(self):
        seen = self.capture([(503, {}), (201, {"event_id": 4})])
        page = self.clocked_page()
        page.click("#submitBtn")
        self.confirm(page)
        page.wait_for_selector('.send-result[data-state="failed"]')
        page.click("#resultClose")
        page.clock.fast_forward("02:00")
        page.click("#submitBtn")
        page.wait_for_selector('.send-result[data-state="failed"]')
        page.click("#retryBtn")
        page.wait_for_selector('.send-result[data-state="sent"]')
        self.assertEqual(seen[0]["body"], seen[1]["body"])
        self.assertEqual(seen[0]["headers"]["idempotency-key"], seen[1]["headers"]["idempotency-key"])

    def test_a_rejected_message_is_not_offered_again(self):
        seen = self.capture([(422, {"errors": {"texts.uz.title": {"message": "жуда узун"}}})])
        self.set_endpoint()
        self.fill_sql_texts()
        self.page.click("#scopeAll")
        self.page.click("#submitBtn")
        self.confirm()
        self.page.wait_for_selector('.send-result[data-state="failed"]')
        self.assertIn("жуда узун", self.page.inner_text(".send-errors"))
        self.page.click("#resultClose")
        self.page.click("#submitBtn")
        self.page.wait_for_selector('.send-result[data-state="failed"]')
        self.assertEqual(self.page.locator("#retryBtn").count(), 0)
        self.assertEqual(len(seen), 1)

    def test_server_field_errors_land_on_the_field(self):
        self.capture([(422, {"errors": [{"field": "payload.texts.uz.title", "message": "жуда узун"}]})])
        self.set_endpoint()
        self.fill_sql_texts()
        self.page.click("#scopeAll")
        self.page.click("#submitBtn")
        self.confirm()
        self.page.wait_for_selector('.send-result[data-state="failed"]')
        self.page.click("#resultClose")
        self.assertIn("Сервер: жуда узун", self.page.inner_text("#errUzTitle"))
        self.assertEqual(self.page.get_attribute("#uzTitle", "aria-invalid"), "true")
        self.page.fill("#uzTitle", "Қисқа сарлавҳа")
        self.assertFalse(self.page.is_visible("#errUzTitle"))

    def test_a_json_array_is_not_a_success(self):
        self.capture([(200, [])])
        self.set_endpoint()
        self.fill_sql_texts()
        self.page.click("#scopeAll")
        self.page.click("#submitBtn")
        self.confirm()
        self.page.wait_for_selector('.send-result[data-state="unknown"]')

    def test_the_confirm_stays_in_view_on_small_screens(self):
        for size in [(320, 720), (844, 390)]:
            with self.subTest(size=size):
                self.page.set_viewport_size({"width": size[0], "height": size[1]})
                self.set_endpoint()
                self.fill_sql_texts()
                self.page.click("#scopeAll")
                self.page.click("#submitBtn")
                self.page.wait_for_selector('.send-result[data-state="review"]')
                for scroll in ["0", "document.getElementById('resultDialog').scrollHeight"]:
                    self.page.evaluate(f"document.getElementById('resultDialog').scrollTop = {scroll}")
                    self.page.wait_for_timeout(100)
                    box = self.page.locator("#confirmSend").bounding_box()
                    self.assertLessEqual(box["y"] + box["height"], size[1])
                    self.assertTrue(self.page.evaluate(
                        f"document.getElementById('confirmSend').contains(document.elementFromPoint({box['x'] + 10}, {box['y'] + 10}))"))
                self.page.click("#cancelSend")

    def test_odd_error_field_names_do_not_break_the_dialog(self):
        self.capture([(422, {"errors": {"constructor": "а", "__proto__": "б", "toString": "в"}})])
        self.set_endpoint()
        self.fill_sql_texts()
        self.page.click("#scopeAll")
        self.page.click("#submitBtn")
        self.confirm()
        self.page.wait_for_selector('.send-result[data-state="failed"]')
        self.assertIn("constructor: а", self.page.inner_text(".send-errors"))

    def test_signing_in_again_allows_a_retry_with_the_same_key(self):
        seen = self.capture([(401, {}), (201, {"event_id": 9})])
        self.set_endpoint()
        self.fill_sql_texts()
        self.page.click("#scopeAll")
        self.page.click("#submitBtn")
        self.confirm()
        self.page.wait_for_selector('.send-result[data-state="failed"]')
        self.assertNotIn("тузатиб", self.page.inner_text(".send-sub"))
        self.page.wait_for_function("!document.getElementById('retryBtn').disabled", timeout=5000)
        self.page.click("#retryBtn")
        self.page.wait_for_selector('.send-result[data-state="sent"]')
        self.assertEqual(seen[0]["headers"]["idempotency-key"], seen[1]["headers"]["idempotency-key"])

    def test_an_expiry_under_a_minute_away_is_refused_in_the_form(self):
        page = self.clocked_page()
        self.to_custom(page)
        self.type_date("04032030", page)
        page.fill("#fTime", "10:01")
        page.click("#submitBtn")
        self.assertIn("камида бир дақиқа", page.inner_text("#errDate"))
        self.assertFalse(page.evaluate("document.getElementById('resultDialog').open"))


if __name__ == "__main__":
    unittest.main()
