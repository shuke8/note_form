import contextlib
import functools
import http.server
import pathlib
import threading
import unittest

from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent


@contextlib.contextmanager
def serve():
    handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(ROOT))
    handler.func.log_message = lambda *a: None
    httpd = http.server.ThreadingHTTPServer(("127.0.0.1", 0), handler)
    thread = threading.Thread(target=httpd.serve_forever, daemon=True)
    thread.start()
    try:
        yield f"http://127.0.0.1:{httpd.server_address[1]}/composer.html"
    finally:
        httpd.shutdown()


class ComposerUiTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls._server = serve()
        cls.url = cls._server.__enter__()
        cls._pw = sync_playwright().start()
        cls.browser = cls._pw.chromium.launch(channel="msedge")

    @classmethod
    def tearDownClass(cls):
        cls.browser.close()
        cls._pw.stop()
        cls._server.__exit__(None, None, None)

    def setUp(self):
        self.page = self.browser.new_page(viewport={"width": 1280, "height": 900})
        self.errors = []
        self.page.on("pageerror", lambda e: self.errors.append(str(e)))
        self.page.goto(self.url, wait_until="domcontentloaded")
        self.page.wait_for_function("document.querySelectorAll('.scope-row').length > 0")

    def tearDown(self):
        self.page.close()
        self.assertEqual(self.errors, [])

    def to_step_two(self):
        self.page.click("#scopeAll")
        self.page.click("#nextBtn")
        self.page.wait_for_selector("#step-2:not([hidden])")

    def test_text_error_clears_once_field_is_filled(self):
        self.to_step_two()
        self.page.click("#nextBtn")
        self.assertTrue(self.page.is_visible("#errUzTitle"))
        self.page.fill("#uzTitle", "Сув таъминоти вақтинча тўхтатилади")
        self.assertFalse(self.page.is_visible("#errUzTitle"))
        self.assertIsNone(self.page.get_attribute("#uzTitle", "aria-invalid"))
        self.assertTrue(self.page.is_visible("#errUzBody"))

    def test_day_error_clears_once_a_day_is_picked(self):
        self.to_step_two()
        for sel, text in [("#uzTitle", "Сарлавҳа"), ("#uzBody", "Матн"), ("#ruTitle", "Заголовок"), ("#ruBody", "Текст")]:
            self.page.fill(sel, text)
        self.page.click("#nextBtn")
        self.page.click('[data-when="repeat"]')
        self.page.click("#nextBtn")
        self.assertTrue(self.page.is_visible("#errDays"))
        self.page.click('[data-day="1"]')
        self.assertFalse(self.page.is_visible("#errDays"))

    def to_step_three(self):
        self.to_step_two()
        for sel, text in [("#uzTitle", "Сарлавҳа"), ("#uzBody", "Матн"), ("#ruTitle", "Заголовок"), ("#ruBody", "Текст")]:
            self.page.fill(sel, text)
        self.page.click("#nextBtn")
        self.page.wait_for_selector("#step-3:not([hidden])")

    def test_chip_row_shows_its_error_state(self):
        self.to_step_three()
        self.page.click('[data-when="repeat"]')
        self.page.click("#nextBtn")
        self.page.wait_for_timeout(400)
        colour = self.page.eval_on_selector('#dayRow [data-day="1"]', "e => getComputedStyle(e).borderTopColor")
        crit = self.page.evaluate("getComputedStyle(document.documentElement).getPropertyValue('--crit').trim()")
        self.assertEqual(colour, self.page.evaluate(f"(() => {{ const d = document.createElement('i'); d.style.color = '{crit}'; document.body.append(d); const c = getComputedStyle(d).color; d.remove(); return c; }})()"))

    def test_upcoming_dates_are_written_for_people(self):
        self.to_step_three()
        self.page.click('[data-when="repeat"]')
        self.page.click('[data-day="1"]')
        self.page.click('[data-month="10"]')
        label = self.page.inner_text("#runsChips .run-chip b")
        self.assertRegex(label, r"^\d{1,2} [а-яўқғҳ]+( \d{4})?$")

    def leaving_is_held(self):
        return self.page.evaluate(
            "() => { const e = new Event('beforeunload', { cancelable: true }); window.dispatchEvent(e); return e.defaultPrevented; }"
        )

    def test_leaving_with_a_draft_asks_first(self):
        self.page.click("#scopeAll")
        self.assertTrue(self.leaving_is_held())

    def test_leaving_an_untouched_form_does_not_ask(self):
        self.assertFalse(self.leaving_is_held())

    def test_leaving_after_dispatch_does_not_ask(self):
        self.to_step_three()
        self.page.click("#nextBtn")
        self.page.click("#nextBtn")
        self.page.click("#submitBtn")
        self.page.wait_for_selector("#resultDialog[open]")
        self.assertFalse(self.leaving_is_held())

    def test_reset_after_confirming_does_not_ask_twice(self):
        self.page.click("#scopeAll")
        seen = []
        self.page.on("dialog", lambda d: (seen.append(d.type), d.accept()))
        with self.page.expect_navigation():
            self.page.click("#resetBtn")
        self.assertEqual(seen, ["confirm"])
        self.page.wait_for_function("document.querySelectorAll('.scope-row').length > 0")
        self.assertIsNone(self.page.get_attribute("#scopeAll", "aria-current"))

    def to_later(self):
        self.to_step_three()
        self.page.click('[data-when="later"]')
        self.page.wait_for_selector("#whenLater:not([hidden])")

    def test_date_field_is_written_in_cyrillic(self):
        self.to_later()
        self.assertEqual(self.page.get_attribute("#fDate", "placeholder"), "КК.ОО.ЙЙЙЙ")
        self.page.click("#fDate")
        self.page.keyboard.type("05102030")
        self.assertEqual(self.page.input_value("#fDate"), "05.10.2030")
        self.assertEqual(self.page.get_attribute("#fDate", "data-iso"), "2030-10-05")
        self.assertIn("5 октябр 2030", self.page.inner_text("#st3"))

    def test_calendar_speaks_cyrillic_and_fills_the_field(self):
        self.to_later()
        self.page.click("#whenLater .date-toggle")
        pop = "#whenLater .date-pop"
        self.page.wait_for_selector(pop + ":not([hidden])")
        self.assertRegex(self.page.inner_text(pop + " .date-title"), r"^(Январ|Феврал|Март|Апрел|Май|Июн|Июл|Август|Сентябр|Октябр|Ноябр|Декабр) \d{4}$")
        heads = self.page.eval_on_selector_all(pop + " .date-wd", "els => els.map(e => e.textContent)")
        self.assertEqual(heads, ["Ду", "Се", "Чо", "Па", "Жу", "Ша", "Як"])
        self.page.click(pop + " .date-nav[aria-label='Кейинги ой']")
        self.page.click(pop + " .date-day:not(.is-out) >> nth=14")
        self.assertTrue(self.page.is_hidden(pop))
        self.assertRegex(self.page.input_value("#fDate"), r"^15\.\d{2}\.\d{4}$")
        self.page.click("#nextBtn")
        self.assertFalse(self.page.is_visible("#errDate"))

    def test_calendar_blocks_days_before_today(self):
        self.to_later()
        self.page.click("#whenLater .date-toggle")
        today = self.page.get_attribute("#fDate", "data-min")
        blocked = self.page.eval_on_selector_all(
            "#whenLater .date-day[aria-disabled='true']", "els => els.map(e => e.dataset.iso)")
        self.assertTrue(all(d < today for d in blocked))
        self.assertNotIn(today, blocked)
        self.assertTrue(self.page.is_disabled("#whenLater .date-nav[aria-label='Олдинги ой']"))

    def test_calendar_works_from_the_keyboard(self):
        self.to_later()
        self.page.focus("#whenLater .date-toggle")
        self.page.keyboard.press("Enter")
        start = self.page.evaluate("document.activeElement.dataset.iso")
        self.page.keyboard.press("ArrowRight")
        self.page.keyboard.press("ArrowDown")
        moved = self.page.evaluate("document.activeElement.dataset.iso")
        self.assertGreater(moved, start)
        self.page.keyboard.press("Enter")
        self.assertEqual(self.page.get_attribute("#fDate", "data-iso"), moved)
        self.page.click("#whenLater .date-toggle")
        self.page.keyboard.press("Escape")
        self.assertTrue(self.page.is_hidden("#whenLater .date-pop"))
        self.assertTrue(self.page.evaluate("document.activeElement.classList.contains('date-toggle')"))

    def test_calendar_opens_on_the_month_being_typed(self):
        self.to_later()
        self.page.click("#fDate")
        self.page.keyboard.type("1512")
        self.page.click("#whenLater .date-toggle")
        self.assertTrue(self.page.inner_text("#whenLater .date-title").startswith("Декабр"))
        self.assertTrue(self.page.evaluate("document.activeElement.dataset.iso.endsWith('-12-15')"))

    def test_impossible_date_is_named_as_such(self):
        self.to_step_three()
        self.page.click('[data-when="repeat"]')
        self.page.click('[data-span="range"]')
        self.page.click("#fFrom")
        self.page.keyboard.type("31022030")
        self.page.click('[data-day="1"]')
        self.page.click("#nextBtn")
        self.assertIn("мавжуд эмас", self.page.inner_text("#errFrom"))


if __name__ == "__main__":
    unittest.main()
