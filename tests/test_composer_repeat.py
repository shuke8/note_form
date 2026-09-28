import datetime
import unittest

from support import READY, TASHKENT, ComposerCase


class ComposerRepeatTest(ComposerCase):
    def clocked(self):
        return self.clocked_page(datetime.datetime(2030, 3, 4, 10, 0, tzinfo=TASHKENT))

    def test_weekly_schedule_reaches_the_payload(self):
        self.fill_sql_texts()
        self.page.click("#scopeAll")
        self.to_repeat()
        self.page.click('[data-day="3"]')
        self.page.click('[data-day="1"]')
        self.type_end("15082027")
        payload = self.send_and_read()["payload"]
        self.assertEqual(list(payload), ["audience", "severity", "expires_at", "recurrence", "texts"])
        self.assertEqual(payload["recurrence"], {"freq": "weekly", "time": "09:00", "timezone": "Asia/Tashkent", "weekdays": [1, 3]})
        self.assertEqual(payload["expires_at"], "2027-08-15T18:59:00Z")

    def test_daily_schedule_carries_no_weekdays(self):
        self.fill_sql_texts()
        self.page.click("#scopeAll")
        self.to_repeat()
        self.page.click('[data-freq="daily"]')
        self.assertTrue(self.page.is_hidden("#daysField"))
        self.page.fill("#fRepeatTime", "07:30")
        self.type_end("01092027")
        self.page.fill("#fEndTime", "12:00")
        payload = self.send_and_read()["payload"]
        self.assertEqual(payload["recurrence"], {"freq": "daily", "time": "07:30", "timezone": "Asia/Tashkent"})
        self.assertEqual(payload["expires_at"], "2027-09-01T07:00:00Z")

    def test_a_weekly_schedule_needs_a_day_and_an_end(self):
        self.fill_sql_texts()
        self.page.click("#scopeAll")
        self.to_repeat()
        self.page.click("#submitBtn")
        self.assertIn("Камида битта кунни", self.page.inner_text("#errDays"))
        self.assertIn("Тугаш санасини", self.page.inner_text("#errEndDate"))
        self.assertEqual(self.page.get_attribute("#dayRow", "role"), "toolbar")
        self.assertIsNone(self.page.get_attribute("#dayRow", "aria-invalid"))
        self.assertIn("«Амал қилиш муддати»", self.page.inner_text("#status"))
        self.assertFalse(self.page.evaluate("document.getElementById('resultDialog').open"))

    def test_upcoming_sends_are_listed_and_counted(self):
        page = self.clocked()
        self.to_repeat(page)
        page.click('[data-day="1"]')
        page.click('[data-day="3"]')
        self.type_end("13032030", page)
        chips = page.eval_on_selector_all("#runsList .run-chip b", "els => els.map(e => e.textContent)")
        self.assertEqual(chips, ["6 март", "11 март", "13 март"])
        self.assertIn("жами 3 марта", page.inner_text("#runsSum"))
        self.assertEqual(page.inner_text("#lockTime"), "09:00")
        self.assertEqual(page.inner_text("#lockDate"), "Чоршанба, 6 март")

    def test_an_end_before_the_first_send_is_refused(self):
        page = self.clocked()
        self.fill_sql_texts(page)
        page.click("#scopeAll")
        self.to_repeat(page)
        page.click('[data-day="5"]')
        self.type_end("06032030", page)
        page.click("#submitBtn")
        self.assertIn("бирорта юбориш йўқ", page.inner_text("#errEndDate"))

    def test_a_repeat_draft_comes_back_after_reload(self):
        self.fill_sql_texts()
        self.to_repeat()
        self.page.click('[data-day="2"]')
        self.page.fill("#fRepeatTime", "08:15")
        self.type_end("15082027")
        self.page.wait_for_timeout(600)
        self.page.reload(wait_until="domcontentloaded")
        self.page.wait_for_function(READY)
        self.assertEqual(self.page.get_attribute('[data-expiry="repeat"]', "aria-checked"), "true")
        self.assertEqual(self.page.get_attribute('[data-day="2"]', "aria-pressed"), "true")
        self.assertEqual(self.page.input_value("#fRepeatTime"), "08:15")
        self.assertEqual(self.page.get_attribute("#fEndDate", "data-iso"), "2027-08-15")


if __name__ == "__main__":
    unittest.main()
