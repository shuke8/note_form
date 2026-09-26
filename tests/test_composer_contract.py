import json
import unittest

from support import READY, SQL_TEXTS, ComposerCase

class ComposerContractTest(ComposerCase):
    def test_nothing_leaves_before_the_operator_confirms(self):
        seen = self.capture([(201, {"event_id": 1})])
        self.set_endpoint()
        self.fill_sql_texts()
        self.page.click("#scopeAll")
        self.page.dblclick("#submitBtn")
        self.page.wait_for_selector('.send-result[data-state="review"]')
        self.assertIn("35,1 млн", self.page.inner_text(".send-sub"))
        self.assertTrue(self.page.evaluate("document.getElementById('resultDialog').open"))
        self.page.keyboard.press("Escape")
        self.assertEqual(seen, [])
        self.page.keyboard.press("Control+Enter")
        self.page.wait_for_selector('.send-result[data-state="review"]')
        self.assertEqual(seen, [])

    def test_payload_matches_the_backend_contract(self):
        seen = self.capture([(201, {"event_id": 42})])
        self.set_endpoint()
        self.compose_sql_example()
        self.page.click("#submitBtn")
        self.confirm()
        self.page.wait_for_selector('.send-result[data-state="sent"]')
        self.assertEqual(len(seen), 1)
        self.assertEqual(seen[0]["body"], {
            "type": "system.announcement",
            "payload": {
                "audience": {"org_type": 100, "level": 4, "region_id": 6, "district_id": 606, "mahalla_id": 606008},
                "severity": "warning",
                "expires_at": "2027-08-15T13:00:00Z",
                "texts": SQL_TEXTS,
            },
        })
        self.assertEqual(seen[0]["headers"]["content-type"], "application/json")
        self.assertRegex(seen[0]["headers"]["idempotency-key"], r"^[0-9a-f-]{36}$")
        self.assertIn("event_id 42", self.page.inner_text(".send-sub"))
        self.assertFalse(self.leaving_is_held())
        self.assertEqual(self.page.inner_text("#draftBadge"), "ЮБОРИЛДИ")
        self.page.click("#resultClose")
        self.page.fill("#uzTitle", "Янги сарлавҳа")
        self.assertEqual(self.page.inner_text("#draftBadge"), "ҚОРАЛАМА")

    def test_audience_carries_ids_down_to_the_chosen_level_only(self):
        self.fill_sql_texts()
        cases = [
            ("republic", {"org_type": 100, "level": 1}),
            ("region:6", {"org_type": 100, "level": 2, "region_id": 6}),
            ("district:606", {"org_type": 100, "level": 3, "region_id": 6, "district_id": 606}),
        ]
        for key, audience in cases:
            with self.subTest(key=key):
                if key == "republic":
                    self.page.click("#scopeAll")
                else:
                    self.pick(key)
                self.page.click("#submitBtn")
                self.assertEqual(self.dialog_json()["payload"]["audience"], audience)
                self.page.click("#resultClose")

    def test_expiry_is_sent_in_utc_whatever_the_browser_zone(self):
        for zone in ["Europe/Moscow", "Asia/Tokyo", "America/New_York"]:
            with self.subTest(zone=zone):
                ctx = self.browser.new_context(viewport={"width": 1280, "height": 900}, timezone_id=zone)
                try:
                    page = self.open_page(ctx)
                    self.fill_sql_texts(page)
                    page.click("#scopeAll")
                    self.to_custom(page)
                    self.type_date("15082027", page)
                    page.fill("#fTime", "18:00")
                    page.click("#submitBtn")
                    self.assertEqual(self.dialog_json(page)["payload"]["expires_at"], "2027-08-15T13:00:00Z")
                finally:
                    ctx.close()

    def test_preset_expiry_counts_from_the_send_moment(self):
        page = self.context.new_page()
        page.clock.install(time="2030-03-04T04:58:30Z")
        page.goto(self.url, wait_until="domcontentloaded")
        page.wait_for_function(READY)
        self.fill_sql_texts(page)
        page.click("#scopeAll")
        page.click('[data-expiry="3d"]')
        page.click("#submitBtn")
        self.assertEqual(self.dialog_json(page)["payload"]["expires_at"], "2030-03-07T04:58:00Z")

    def test_past_expiry_is_refused_before_sending(self):
        seen = self.capture([(201, {})])
        self.set_endpoint()
        self.fill_sql_texts()
        self.page.click("#scopeAll")
        self.to_custom()
        self.type_date(self.page.evaluate("OM.time.todayIso(Date.now()).split('-').reverse().join('')"))
        self.page.fill("#fTime", "00:00")
        self.page.click("#submitBtn")
        self.assertIn("ўтиб кетган", self.page.inner_text("#errDate"))
        self.assertFalse(self.page.evaluate("document.getElementById('resultDialog').open"))
        self.assertEqual(seen, [])

    def test_severity_and_org_type_reach_the_payload(self):
        self.fill_sql_texts()
        self.page.click("#scopeAll")
        self.page.click('[data-sev="critical"]')
        self.page.fill("#orgType", "200")
        self.page.click("#submitBtn")
        body = self.dialog_json()["payload"]
        self.assertEqual(body["severity"], "critical")
        self.assertEqual(body["audience"]["org_type"], 200)

    def test_without_an_endpoint_nothing_is_claimed_as_sent(self):
        self.fill_sql_texts()
        self.page.click("#scopeAll")
        self.page.click("#submitBtn")
        self.page.wait_for_selector('.send-result[data-state="draft"]')
        self.assertIn("ҳеч қаерга кетмади", self.page.inner_text(".send-sub"))
        self.assertTrue(self.leaving_is_held())

    def test_failed_send_retries_with_the_same_key_and_body(self):
        seen = self.capture([(503, {}), (201, {"event_id": 7})])
        self.set_endpoint()
        self.compose_sql_example()
        self.page.click("#submitBtn")
        self.confirm()
        self.page.wait_for_selector('.send-result[data-state="failed"]')
        self.assertIn("503", self.page.inner_text(".send-sub"))
        self.assertTrue(self.page.is_disabled("#retryBtn"))
        self.assertRegex(self.page.inner_text("#retryBtn"), r"Қайта уриниш \(\d\)")
        self.page.wait_for_function("!document.getElementById('retryBtn').disabled", timeout=5000)
        self.page.click("#retryBtn")
        self.page.wait_for_selector('.send-result[data-state="sent"]')
        self.assertEqual(len(seen), 2)
        self.assertEqual(seen[0]["headers"]["idempotency-key"], seen[1]["headers"]["idempotency-key"])
        self.assertEqual(seen[0]["body"], seen[1]["body"])

    def test_a_silent_server_is_reported_as_a_timeout(self):
        page = self.context.new_page()
        page.clock.install()
        held = []
        self.context.route("**/api/announcements", lambda route: held.append(route))
        self.addCleanup(lambda: [r.abort() for r in held])
        page.goto(self.url, wait_until="domcontentloaded")
        page.wait_for_function(READY)
        self.set_endpoint(page)
        self.fill_sql_texts(page)
        page.click("#scopeAll")
        page.click("#submitBtn")
        self.confirm(page)
        page.wait_for_selector('.send-result[data-state="sending"]')
        self.assertTrue(page.is_disabled("#submitBtn"))
        page.clock.run_for(15500)
        page.wait_for_selector('.send-result[data-state="failed"]')
        self.assertIn("жавоб бермади", page.inner_text(".send-sub"))
        self.assertFalse(page.is_disabled("#submitBtn"))

    def test_offline_is_reported_without_a_request(self):
        seen = self.capture([(201, {})])
        self.set_endpoint()
        self.fill_sql_texts()
        self.page.click("#scopeAll")
        self.context.set_offline(True)
        self.page.click("#submitBtn")
        self.confirm()
        self.page.wait_for_selector('.send-result[data-state="failed"]')
        self.assertIn("Интернет", self.page.inner_text(".send-sub"))
        self.assertEqual(seen, [])

    def test_repeated_clicks_send_once(self):
        seen = self.capture([(201, {"event_id": 1})])
        self.set_endpoint()
        self.fill_sql_texts()
        self.page.click("#scopeAll")
        self.page.click("#submitBtn")
        self.page.wait_for_selector('.send-result[data-state="review"]')
        self.page.wait_for_timeout(650)
        self.page.evaluate("() => { const b = document.getElementById('confirmSend'); b.click(); b.click(); b.click(); }")
        self.page.wait_for_selector('.send-result[data-state="sent"]')
        self.page.click("#resultClose")
        self.page.click("#submitBtn")
        self.page.wait_for_selector('.send-result[data-state="sent"]')
        self.assertEqual(len(seen), 1)

    def test_a_broken_copied_draft_keeps_the_form_working(self):
        page = self.context.new_page()
        page.add_init_script("sessionStorage.setItem('om-draft', JSON.stringify({ uzTitle: 'Эски', scope: { region: 'Xorazm viloyati', district: 'Нукус шаҳри' } }))")
        errors = []
        page.on("pageerror", lambda e: errors.append(str(e)))
        page.goto(self.url, wait_until="domcontentloaded")
        page.wait_for_function(READY)
        self.assertEqual(page.input_value("#uzTitle"), "Эски")
        self.assertEqual(page.get_attribute("#scopeAll", "aria-checked"), "false")
        page.click("#submitBtn")
        self.assertIn("«Ким олади»", page.inner_text("#status"))
        self.assertEqual(errors, [])

    def test_autosaved_draft_comes_back_after_reload(self):
        self.fill_sql_texts()
        self.pick("mahalla:606008")
        self.page.click('[data-sev="info"]')
        self.page.fill("#orgType", "300")
        self.page.wait_for_timeout(600)
        self.page.reload(wait_until="domcontentloaded")
        self.page.wait_for_function(READY)
        self.assertEqual(self.page.input_value("#ruBody"), SQL_TEXTS["ru"]["body"])
        self.assertEqual(self.page.input_value("#orgType"), "300")
        self.assertEqual(self.page.get_attribute('[data-sev="info"]', "aria-checked"), "true")
        self.assertIn("8-маҳалла “Дўстлик”", self.page.inner_text("#scopeCrumbs"))

    def test_reset_clears_the_autosaved_draft(self):
        self.fill_sql_texts()
        self.page.wait_for_timeout(600)
        self.page.on("dialog", lambda d: d.accept())
        with self.page.expect_navigation():
            self.page.click("#resetBtn")
        self.page.wait_for_function(READY)
        self.assertEqual(self.page.input_value("#uzTitle"), "")

    def test_copy_puts_the_exact_json_on_the_clipboard(self):
        self.context.grant_permissions(["clipboard-read", "clipboard-write"])
        self.fill_sql_texts()
        self.page.click("#scopeAll")
        self.page.click("#submitBtn")
        shown = self.dialog_json()
        self.page.click(".send-actions .btn-outline")
        self.page.wait_for_selector(".toast")
        self.assertEqual(json.loads(self.page.evaluate("navigator.clipboard.readText()")), shown)


if __name__ == "__main__":
    unittest.main()
