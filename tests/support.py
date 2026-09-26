import contextlib
import functools
import http.server
import json
import pathlib
import threading
import unittest

from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
READY = "document.querySelectorAll('.scope-row').length > 0"


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


def css_colour(page, value):
    return page.evaluate(
        f"(() => {{ const d = document.createElement('i'); d.style.color = '{value}'; document.body.append(d);"
        " const c = getComputedStyle(d).color; d.remove(); return c; })()")


class ComposerCase(unittest.TestCase):
    TEXT = [("#uzTitle", "Сарлавҳа"), ("#uzBody", "Матн"), ("#ruTitle", "Заголовок"), ("#ruBody", "Текст")]

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
        self.context = self.browser.new_context(viewport={"width": 1280, "height": 900}, timezone_id="Asia/Tashkent")
        self.page = self.open_page(self.context)

    def open_page(self, context):
        page = context.new_page()
        errors = []
        page.on("pageerror", lambda e: errors.append(str(e)))
        self.addCleanup(lambda: self.assertEqual(errors, []))
        page.goto(self.url, wait_until="domcontentloaded")
        page.wait_for_function(READY)
        return page

    def tearDown(self):
        self.context.close()

    def fill_text(self, page=None):
        for sel, text in self.TEXT:
            (page or self.page).fill(sel, text)

    def leave_field(self):
        self.page.click("#h-sec-3")
        self.page.evaluate("new Promise(r => setTimeout(r, 0))")

    def to_custom(self, page=None):
        page = page or self.page
        page.click('[data-expiry="custom"]')
        page.wait_for_selector("#expiryCustom:not([hidden])")

    def type_date(self, digits, page=None):
        page = page or self.page
        page.click("#fDate")
        page.keyboard.type(digits)

    def pick(self, key, page=None):
        page = page or self.page
        if page.get_attribute("#scopeArea", "aria-checked") != "true":
            page.click("#scopeArea")
        kind, ident = key.split(":")
        if kind == "region":
            page.click(f'.scope-row[data-key="{key}"]')
            return
        row = page.locator(f'.scope-row[data-key="{key}"]')
        if not row.count():
            name = {"district:606": "Қўшкўпир", "mahalla:606008": "Дўстлик"}[key]
            page.fill("#scopeSearch", name)
            page.wait_for_selector(f'.scope-row[data-key="{key}"]')
        page.click(f'.scope-row[data-key="{key}"]')

    def search(self, query):
        self.page.fill("#scopeSearch", query)
        self.page.wait_for_timeout(200)
        return self.page.eval_on_selector_all(".scope-row .scope-name", "els => els.map(e => e.firstChild.textContent)")

    def set_endpoint(self, page=None, value="/api/announcements"):
        (page or self.page).evaluate(
            "v => document.querySelector('meta[name=om-announce-endpoint]').setAttribute('content', v)", value)

    def dialog_json(self, page=None):
        page = page or self.page
        page.wait_for_selector("#resultDialog[open] .send-code")
        return json.loads(page.inner_text(".send-code"))

    def leaving_is_held(self, page=None):
        return (page or self.page).evaluate(
            "() => { const e = new Event('beforeunload', { cancelable: true }); window.dispatchEvent(e); return e.defaultPrevented; }")

    def bars_bottom(self):
        return self.page.evaluate(
            "Math.max(...[...document.querySelectorAll('.topbar, .page-bar')]"
            ".map(e => getComputedStyle(e).position === 'sticky' ? e.getBoundingClientRect().bottom : 0))")
