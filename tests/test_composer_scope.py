import unittest

from support import ComposerCase


class ComposerScopeTest(ComposerCase):
    def test_region_mode_opens_a_searchable_list(self):
        self.assertTrue(self.page.is_hidden("#scopeList"))
        self.page.click("#scopeArea")
        self.assertTrue(self.page.is_visible("#scopeSearch"))
        self.assertTrue(self.page.is_visible("#scopeList"))
        self.assertIn("«Ким олади»", self.page.inner_text("#status"))
        self.assertIn("Урганч шаҳри", self.search("урганч"))
        self.page.click('.scope-row[data-kind="district"]')
        self.assertEqual(self.page.input_value("#scopeSearch"), "")
        self.assertIn("Урганч шаҳри", self.page.inner_text("#scopeCrumbs"))
        self.assertNotIn("«Ким олади»", self.page.inner_text("#status"))
        self.assertEqual(self.page.get_attribute("#scopeArea", "aria-checked"), "true")

    def test_search_says_when_nothing_matches(self):
        self.page.click("#scopeArea")
        self.search("йўққишлоқ")
        self.assertIn("топилмади", self.page.inner_text("#scopeList"))

    def test_whole_republic_closes_the_region_list(self):
        self.page.click("#scopeArea")
        self.page.click('.scope-row[data-kind="region"] >> nth=0')
        self.page.click("#scopeAll")
        self.assertTrue(self.page.is_hidden("#scopeList"))
        self.assertEqual(self.page.get_attribute("#scopeAll", "aria-checked"), "true")
        self.assertEqual(self.page.get_attribute("#scopeArea", "aria-checked"), "false")

    def test_search_works_on_russian_and_latin_keyboards(self):
        self.page.click("#scopeArea")
        for query, name in [("кашкадарё", "Қашқадарё вилояти"), ("фаргона", "Фарғона вилояти"),
                            ("toshkent", "Тошкент шаҳри"), ("qashqadaryo", "Қашқадарё вилояти"),
                            ("farg'ona", "Фарғона вилояти"), ("Samarqand", "Самарқанд вилояти")]:
            with self.subTest(query=query):
                self.assertIn(name, self.search(query))

    def test_search_tolerates_spelling_variants(self):
        self.page.click("#scopeArea")
        for query, name in [("Energetik", "Энергетик МФЙ"), ("Fargʼona", "Фарғона вилояти"), ("toshkent  shahri", "Тошкент шаҳри")]:
            with self.subTest(query=query):
                self.assertIn(name, self.search(query))

    def test_search_count_tells_when_results_are_cut(self):
        self.page.click("#scopeArea")
        self.search("а")
        if self.page.locator(".scope-row").count() == 40:
            self.assertRegex(self.page.inner_text("#scopeLvl"), r"40 / \d+")

    def test_only_the_picked_mahalla_is_marked_current(self):
        self.pick("region:13")
        self.page.click('.scope-row[data-key="district:1318"]')
        self.page.click('.scope-row[data-key="mahalla:1318002"]')
        self.search("Янгиобод")
        current = self.page.eval_on_selector_all('.scope-row[aria-current="true"]', "els => els.map(e => e.dataset.key)")
        self.assertEqual(current, ["mahalla:1318002"])

    def test_arrow_up_from_the_first_row_returns_to_search(self):
        self.page.click("#scopeArea")
        self.page.focus("#scopeSearch")
        self.page.keyboard.press("ArrowDown")
        self.page.keyboard.press("ArrowUp")
        self.assertEqual(self.page.evaluate("document.activeElement.id"), "scopeSearch")

    def test_switching_to_republic_and_back_keeps_the_region(self):
        self.page.click("#scopeArea")
        self.page.click('.scope-row[data-kind="region"] >> nth=6')
        picked = self.page.inner_text("#scopeCrumbs")
        self.page.click("#scopeAll")
        self.page.click("#scopeArea")
        self.assertEqual(self.page.inner_text("#scopeCrumbs"), picked)
        self.assertNotIn("«Ким олади»", self.page.inner_text("#status"))

    def test_clearing_the_region_is_not_undone_by_switching(self):
        self.page.click("#scopeArea")
        self.page.click('.scope-row[data-kind="region"] >> nth=6')
        self.page.click("#scopeAll")
        self.page.click("#scopeArea")
        self.page.click('.scope-crumb-btn[data-up="root"]')
        self.page.click("#scopeAll")
        self.page.click("#scopeArea")
        self.assertIn("«Ким олади»", self.page.inner_text("#status"))

    def test_region_data_failure_is_shown_at_once(self):
        ctx = self.browser.new_context(viewport={"width": 1280, "height": 900})
        try:
            ctx.route("**/composer-data.js", lambda r: r.fulfill(status=404, body=""))
            page = ctx.new_page()
            page.goto(self.url, wait_until="domcontentloaded")
            page.wait_for_function("document.getElementById('scope').dataset.failed === 'true'")
            page.wait_for_timeout(200)
            self.assertTrue(page.is_visible("#scopeError"))
            self.assertIn("юкланмади", page.inner_text("#scopeError"))
        finally:
            ctx.close()


class ComposerPickerTest(ComposerCase):
    def test_date_field_is_written_in_cyrillic(self):
        self.to_custom()
        self.assertEqual(self.page.get_attribute("#fDate", "placeholder"), "КК.ОО.ЙЙЙЙ")
        self.type_date("05102030")
        self.assertEqual(self.page.input_value("#fDate"), "05.10.2030")
        self.assertEqual(self.page.get_attribute("#fDate", "data-iso"), "2030-10-05")

    def test_a_full_date_moves_on_to_the_time(self):
        self.to_custom()
        self.type_date("05102030")
        self.assertEqual(self.page.evaluate("document.activeElement.id"), "fTime")
        self.page.click("#fDate")
        self.page.keyboard.press("End")
        self.page.keyboard.type("9")
        self.assertEqual(self.page.input_value("#fDate"), "05.10.2030")
        self.assertEqual(self.page.evaluate("document.activeElement.id"), "fDate")

    def test_calendar_speaks_cyrillic_and_fills_the_field(self):
        self.to_custom()
        self.page.click("#expiryCustom .pick-toggle")
        pop = "#expiryCustom .pick-pop"
        self.page.wait_for_selector(pop + ":not([hidden])")
        self.assertRegex(self.page.inner_text(pop + " .date-title"), r"^(Январ|Феврал|Март|Апрел|Май|Июн|Июл|Август|Сентябр|Октябр|Ноябр|Декабр) \d{4}$")
        heads = self.page.eval_on_selector_all(pop + " .date-wd", "els => els.map(e => e.textContent)")
        self.assertEqual(heads, ["Ду", "Се", "Чо", "Па", "Жу", "Ша", "Як"])
        self.page.click(pop + " .date-nav[aria-label='Кейинги ой']")
        self.page.click(pop + " .date-day:not(.is-out) >> nth=14")
        self.assertTrue(self.page.is_hidden(pop))
        self.assertRegex(self.page.input_value("#fDate"), r"^15\.\d{2}\.\d{4}$")
        self.leave_field()
        self.assertFalse(self.page.is_visible("#errDate"))

    def test_calendar_blocks_days_before_today(self):
        self.to_custom()
        self.page.click("#expiryCustom .pick-toggle")
        today = self.page.get_attribute("#fDate", "data-min")
        blocked = self.page.eval_on_selector_all("#expiryCustom .date-day[aria-disabled='true']", "els => els.map(e => e.dataset.iso)")
        self.assertTrue(all(d < today for d in blocked))
        self.assertNotIn(today, blocked)
        self.assertTrue(self.page.is_disabled("#expiryCustom .date-nav[aria-label='Олдинги ой']"))

    def test_calendar_today_is_the_tashkent_date(self):
        ctx = self.browser.new_context(viewport={"width": 1280, "height": 900}, timezone_id="America/New_York")
        try:
            page = ctx.new_page()
            page.clock.install(time="2030-03-04T21:30:00Z")
            page.goto(self.url, wait_until="domcontentloaded")
            self.to_custom(page)
            page.click("#expiryCustom .pick-toggle")
            page.click("#expiryCustom .pick-pop button:has-text('Бугун')")
            self.assertEqual(page.get_attribute("#fDate", "data-iso"), "2030-03-05")
        finally:
            ctx.close()

    def test_calendar_works_from_the_keyboard(self):
        self.to_custom()
        self.page.focus("#expiryCustom .pick-toggle")
        self.page.keyboard.press("Enter")
        start = self.page.evaluate("document.activeElement.dataset.iso")
        self.page.keyboard.press("ArrowRight")
        self.page.keyboard.press("ArrowDown")
        moved = self.page.evaluate("document.activeElement.dataset.iso")
        self.assertGreater(moved, start)
        self.page.keyboard.press("Enter")
        self.assertEqual(self.page.get_attribute("#fDate", "data-iso"), moved)
        self.page.click("#expiryCustom .pick-toggle")
        self.page.keyboard.press("Escape")
        self.assertTrue(self.page.is_hidden("#expiryCustom .pick-pop"))
        self.assertTrue(self.page.evaluate("document.activeElement.classList.contains('pick-toggle')"))

    def test_calendar_opens_on_the_month_being_typed(self):
        self.to_custom()
        self.type_date("1512")
        self.page.click("#expiryCustom .pick-toggle")
        self.assertTrue(self.page.inner_text("#expiryCustom .date-title").startswith("Декабр"))
        self.assertTrue(self.page.evaluate("document.activeElement.dataset.iso.endsWith('-12-15')"))

    def test_time_field_is_written_in_cyrillic(self):
        self.to_custom()
        self.assertEqual(self.page.get_attribute("#fTime", "placeholder"), "СС:ДД")
        self.assertEqual(self.page.get_attribute("#fTime", "data-time"), "18:00")
        self.page.fill("#fTime", "")
        self.page.click("#fTime")
        self.page.keyboard.type("1430")
        self.assertEqual(self.page.input_value("#fTime"), "14:30")
        self.assertEqual(self.page.get_attribute("#fTime", "data-time"), "14:30")

    def test_time_list_picks_hour_then_minute(self):
        self.to_custom()
        self.page.click("#expiryCustom .field:last-child .pick-toggle")
        pop = "#expiryCustom .field:last-child .pick-pop"
        labels = self.page.eval_on_selector_all(pop + " .time-col-label", "els => els.map(e => e.textContent)")
        self.assertEqual(labels, ["Соат", "Дақиқа"])
        self.assertEqual(self.page.evaluate("document.activeElement.textContent"), "18")
        self.page.click(pop + " [data-kind='h'] [data-value='20']")
        self.assertEqual(self.page.input_value("#fTime"), "20:00")
        self.assertTrue(self.page.is_visible(pop))
        self.page.click(pop + " [data-kind='m'] [data-value='45']")
        self.assertEqual(self.page.input_value("#fTime"), "20:45")
        self.assertTrue(self.page.is_hidden(pop))

    def test_impossible_time_is_named_as_such(self):
        self.to_custom()
        self.page.fill("#fTime", "")
        self.page.click("#fTime")
        self.page.keyboard.type("2570")
        self.leave_field()
        self.assertIn("мавжуд эмас", self.page.inner_text("#errTime"))

    def test_impossible_date_is_named_as_such(self):
        self.to_custom()
        self.type_date("31022030")
        self.leave_field()
        self.assertIn("мавжуд эмас", self.page.inner_text("#errDate"))


if __name__ == "__main__":
    unittest.main()
