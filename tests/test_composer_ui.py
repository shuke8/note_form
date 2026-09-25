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


if __name__ == "__main__":
    unittest.main()
