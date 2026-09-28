import datetime
import unittest

from support import TASHKENT, ComposerCase

MONDAY_10 = datetime.datetime(2030, 3, 4, 10, 0, tzinfo=TASHKENT)


def weekly_mondays(page, case):
    case.to_repeat(page)
    page.click('[data-day="1"]')


class ComposerRepeatFlowTest(ComposerCase):
    def ready_weekly(self, page, end="13032030"):
        self.fill_sql_texts(page)
        page.click("#scopeAll")
        self.to_repeat(page)
        page.click('[data-day="1"]')
        page.click('[data-day="3"]')
        self.type_end(end, page)

    def open_review(self, page):
        self.set_endpoint(page)
        page.click("#submitBtn")
        page.wait_for_selector('.send-result[data-state="review"]')
        return page.inner_text("#resultSub")

    def test_day_chips_move_with_the_arrow_keys(self):
        self.to_repeat()
        self.assertEqual(self.page.get_attribute("#dayRow", "role"), "toolbar")
        self.page.focus('[data-day="1"]')
        focused = lambda: self.page.evaluate("document.activeElement.getAttribute('data-day')")
        self.page.keyboard.press("ArrowRight")
        self.assertEqual(focused(), "2")
        self.page.keyboard.press("End")
        self.assertEqual(focused(), "7")
        self.page.keyboard.press("Home")
        self.assertEqual(focused(), "1")
        self.page.keyboard.press("Space")
        self.assertEqual(self.page.get_attribute('[data-day="1"]', "aria-pressed"), "true")
        self.assertEqual(self.page.get_attribute('[data-day="2"]', "tabindex"), "-1")

    def test_review_names_the_first_send_and_the_total(self):
        page = self.clocked_page(MONDAY_10)
        self.ready_weekly(page)
        sub = self.open_review(page)
        self.assertIn("Биринчи юбориш", sub)
        self.assertIn("жами 3 марта", sub)

    def test_a_long_schedule_counts_every_send(self):
        page = self.clocked_page(MONDAY_10)
        weekly_mondays(page, self)
        self.type_end("31122099", page)
        day, mondays = datetime.date(2030, 3, 11), 0
        while day <= datetime.date(2099, 12, 31):
            mondays += 1
            day += datetime.timedelta(days=7)
        grouped = f"{mondays:,}".replace(",", " ")
        self.assertIn(f"жами {grouped} марта", page.inner_text("#runsSum"))
        self.fill_sql_texts(page)
        page.click("#scopeAll")
        self.assertIn(f"жами {grouped} марта", self.open_review(page))

    def test_sent_dialog_lists_the_schedule(self):
        self.ready_weekly(self.page, "15082027")
        self.send_and_read()
        self.assertIn("Жадвал", self.page.inner_text("#resultDialog"))
        self.assertIn("Ду, Чо · 09:00", self.page.inner_text("#resultDialog"))

    def test_retry_resends_the_same_schedule_with_the_same_key(self):
        seen = self.capture([(500, {}), (201, {"event_id": 7})])
        self.ready_weekly(self.page, "15082027")
        self.set_endpoint()
        self.page.click("#submitBtn")
        self.confirm()
        self.page.wait_for_selector('.send-result[data-state="failed"]')
        self.page.wait_for_selector("#retryBtn:not([disabled])", timeout=6000)
        self.page.click("#retryBtn")
        self.page.wait_for_selector('.send-result[data-state="sent"]')
        self.assertEqual(len(seen), 2)
        self.assertEqual(seen[0]["body"], seen[1]["body"])
        self.assertEqual(seen[0]["body"]["payload"]["recurrence"]["weekdays"], [1, 3])
        self.assertEqual(seen[0]["headers"]["idempotency-key"], seen[1]["headers"]["idempotency-key"])

    def test_leaving_repeat_drops_the_schedule(self):
        self.ready_weekly(self.page, "15082027")
        self.page.click('[data-expiry="1d"]')
        payload = self.send_and_read()["payload"]
        self.assertNotIn("recurrence", payload)

    def test_send_and_end_times_are_checked(self):
        self.fill_sql_texts()
        self.page.click("#scopeAll")
        self.to_repeat()
        self.page.click('[data-day="2"]')
        self.type_end("15082027")
        self.page.fill("#fRepeatTime", "")
        self.page.fill("#fEndTime", "")
        self.page.click("#submitBtn")
        self.assertIn("Юбориш вақтини танланг", self.page.inner_text("#errRepeatTime"))
        self.assertIn("Тугаш вақтини танланг", self.page.inner_text("#errEndTime"))
        self.page.click("#fRepeatTime")
        self.page.keyboard.type("2570")
        self.leave_field()
        self.assertIn("Бу вақт мавжуд эмас", self.page.inner_text("#errRepeatTime"))
        self.assertFalse(self.page.evaluate("document.getElementById('resultDialog').open"))

    def test_an_end_within_a_minute_is_refused(self):
        page = self.clocked_page(MONDAY_10)
        self.fill_sql_texts(page)
        page.click("#scopeAll")
        self.to_repeat(page)
        page.click('[data-freq="daily"]')
        self.type_end("04032030", page)
        page.fill("#fEndTime", "10:01")
        page.click("#submitBtn")
        self.assertIn("ўтиб кетган ёки жуда яқин", page.inner_text("#errEndDate"))

    def test_preview_notes_the_schedule(self):
        self.to_repeat()
        self.page.click('[data-day="1"]')
        self.page.click('[data-day="3"]')
        self.type_end("15082027")
        self.assertIn("Ду, Чо · 09:00", self.page.inner_text("#rcExpNote"))

    def test_a_schedule_with_no_sends_left_is_not_posted(self):
        page = self.clocked_page(datetime.datetime(2030, 3, 4, 8, 59, 30, tzinfo=TASHKENT))
        seen = self.capture([(201, {"event_id": 1})])
        self.fill_sql_texts(page)
        page.click("#scopeAll")
        weekly_mondays(page, self)
        self.type_end("04032030", page)
        page.fill("#fEndTime", "09:30")
        self.assertIn("жами 1 марта", self.open_review(page))
        page.clock.fast_forward(61000)
        page.click("#confirmSend")
        page.wait_for_selector('.send-result[data-state="stale"]')
        self.assertIn("кейинги юбориш йўқ", page.inner_text("#resultSub"))
        self.assertEqual(seen, [])

    def test_server_schedule_errors_land_on_the_fields(self):
        self.capture([(422, {"errors": {"recurrence.weekdays": "Кун нотўғри", "recurrence.time": "Вақт нотўғри"}})])
        self.ready_weekly(self.page, "15082027")
        self.set_endpoint()
        self.page.click("#submitBtn")
        self.confirm()
        self.page.wait_for_selector('.send-result[data-state="failed"]')
        dialog = self.page.inner_text("#resultDialog")
        self.assertIn("Жадвал кунлари: Кун нотўғри", dialog)
        self.assertIn("Юбориш вақти: Вақт нотўғри", dialog)
        self.assertIn("Сервер: Кун нотўғри", self.page.inner_text("#errDays"))
        self.assertIn("Сервер: Вақт нотўғри", self.page.inner_text("#errRepeatTime"))

    def test_a_schedule_error_does_not_block_a_one_off_send(self):
        seen = self.capture([(422, {"errors": {"recurrence": "Жадвал қўллаб-қувватланмайди"}}), (201, {"event_id": 2})])
        self.ready_weekly(self.page, "15082027")
        self.set_endpoint()
        self.page.click("#submitBtn")
        self.confirm()
        self.page.wait_for_selector('.send-result[data-state="failed"]')
        self.page.keyboard.press("Escape")
        self.page.click('[data-expiry="1d"]')
        self.page.click("#submitBtn")
        self.confirm()
        self.page.wait_for_selector('.send-result[data-state="sent"]')
        self.assertEqual(len(seen), 2)
        self.assertNotIn("recurrence", seen[1]["body"]["payload"])

    def test_a_daily_schedule_error_is_shown_under_the_frequency(self):
        self.capture([(422, {"errors": {"recurrence.freq": "Кунлик жадвал ёпиқ"}})])
        self.fill_sql_texts()
        self.page.click("#scopeAll")
        self.to_repeat()
        self.page.click('[data-freq="daily"]')
        self.type_end("15082027")
        self.set_endpoint()
        self.page.click("#submitBtn")
        self.confirm()
        self.page.wait_for_selector('.send-result[data-state="failed"]')
        self.page.keyboard.press("Escape")
        self.assertTrue(self.page.is_visible("#errFreq"))
        self.assertIn("Сервер: Кунлик жадвал ёпиқ", self.page.inner_text("#errFreq"))

    def test_duplicate_days_collapse_to_one(self):
        self.to_repeat()
        weekdays = self.page.evaluate("OM.recur.set({freq: 'weekly', days: [2, 2, 5]}), OM.recur.recurrence().weekdays")
        self.assertEqual(weekdays, [2, 5])
        complete = """days => OM.payload.complete({
            selection: {scope: 'republic'}, orgType: 100, severity: 'warning', expiresAt: Date.now() + 86400000,
            recurrence: {freq: 'weekly', time: '09:00', timezone: 'Asia/Tashkent', weekdays: days},
            texts: {uz: {title: 'a', body: 'b'}, ru: {title: 'c', body: 'd'}}})"""
        self.assertTrue(self.page.evaluate(complete, [2, 5]))
        self.assertFalse(self.page.evaluate(complete, [2, 2]))


if __name__ == "__main__":
    unittest.main()
