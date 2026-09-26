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
SQL_TEXTS = {
    "uz": {"title": "Profilaktika ishlari", "body": "Tizimda texnik ishlar olib borish munosabati nosozliklar kuzatislishi mumkin"},
    "ru": {"title": "Профилактические работы", "body": "В связи с проведением технических работ в системе возможны сбои в работе."},
}


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

    def fill_sql_texts(self, page=None):
        page = page or self.page
        for lang in ("uz", "ru"):
            page.fill(f"#{lang}Title", SQL_TEXTS[lang]["title"])
            page.fill(f"#{lang}Body", SQL_TEXTS[lang]["body"])

    def capture(self, responses):
        seen = []

        def handle(route):
            req = route.request
            seen.append({"body": json.loads(req.post_data), "headers": req.headers})
            reply = responses[min(len(seen), len(responses)) - 1]
            if reply is None:
                return
            status, body = reply[0], reply[1]
            headers = reply[2] if len(reply) > 2 else {}
            kind = headers.pop("content-type", "application/json")
            route.fulfill(status=status, content_type=kind, headers=headers,
                          body=body if isinstance(body, str) else json.dumps(body))

        self.context.route("**/api/announcements", handle)
        return seen

    def compose_sql_example(self):
        self.fill_sql_texts()
        self.pick("mahalla:606008")
        self.to_custom()
        self.type_date("15082027")
        self.page.fill("#fTime", "18:00")

    def confirm(self, page=None):
        page = page or self.page
        page.wait_for_selector('.send-result[data-state="review"]')
        page.wait_for_timeout(650)
        page.click("#confirmSend")

    def bars_bottom(self):
        return self.page.evaluate(
            "Math.max(...[...document.querySelectorAll('.topbar, .page-bar')]"
            ".map(e => getComputedStyle(e).position === 'sticky' ? e.getBoundingClientRect().bottom : 0))")
