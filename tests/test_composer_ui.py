import contextlib
import datetime
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

    TEXT = [("#uzTitle", "Сарлавҳа"), ("#uzBody", "Матн"), ("#ruTitle", "Заголовок"), ("#ruBody", "Текст")]

    def fill_text(self):
        for sel, text in self.TEXT:
            self.page.fill(sel, text)

    def leave_field(self):
        self.page.click("#h-sec-3")
        self.page.evaluate("new Promise(r => setTimeout(r, 0))")

    def to_repeat(self):
        self.page.click('[data-when="repeat"]')
        self.page.wait_for_selector("#whenRepeat:not([hidden])")

    def to_later(self):
        self.page.click('[data-when="later"]')
        self.page.wait_for_selector("#whenLater:not([hidden])")

    def test_every_section_is_open_at_once(self):
        for sel in ["#scopeList", "#uzTitle", "#ruBody", '[data-when="later"]', "#drop", ".phone"]:
            self.assertTrue(self.page.is_visible(sel), sel)
        self.assertEqual(self.page.locator("[data-edit], [data-save]").count(), 0)

    def test_status_names_the_sections_still_missing(self):
        status = lambda: self.page.inner_text("#status")
        self.assertIn("«Ким олади»", status())
        self.assertIn("«Хабар матни»", status())
        self.page.click("#scopeAll")
        self.assertNotIn("«Ким олади»", status())
        self.fill_text()
        self.assertEqual(status(), "Хабар юборишга тайёр")
        self.assertEqual(self.page.get_attribute("#status", "data-tone"), "ok")

    def test_errors_wait_until_the_field_is_left(self):
        self.page.click("#uzTitle")
        self.assertFalse(self.page.is_visible("#errUzTitle"))
        self.leave_field()
        self.assertTrue(self.page.is_visible("#errUzTitle"))
        self.assertFalse(self.page.is_visible("#errUzBody"))

    def test_text_error_clears_once_field_is_filled(self):
        self.page.click("#scopeAll")
        self.page.click("#submitBtn")
        self.assertTrue(self.page.is_visible("#errUzTitle"))
        self.page.fill("#uzTitle", "Сув таъминоти вақтинча тўхтатилади")
        self.assertFalse(self.page.is_visible("#errUzTitle"))
        self.assertIsNone(self.page.get_attribute("#uzTitle", "aria-invalid"))
        self.assertTrue(self.page.is_visible("#errUzBody"))

    def test_send_with_gaps_goes_to_the_first_gap(self):
        self.page.click("#scopeAll")
        self.page.click("#submitBtn")
        self.page.wait_for_function("document.activeElement.id === 'uzTitle'")
        self.assertIn("Тўлдирилмаган: «Хабар матни»", self.page.inner_text("#status"))
        self.assertEqual(self.page.get_attribute("#status", "data-tone"), "crit")

    def test_day_error_clears_once_a_day_is_picked(self):
        self.to_repeat()
        self.page.click("#submitBtn")
        self.assertTrue(self.page.is_visible("#errDays"))
        self.page.click('[data-day="1"]')
        self.assertFalse(self.page.is_visible("#errDays"))

    def test_nested_period_choice_keeps_its_own_selection(self):
        self.to_repeat()
        self.assertEqual(self.page.get_attribute('[data-when="repeat"]', "aria-checked"), "true")
        self.assertEqual(self.page.get_attribute('[data-span="months"]', "aria-checked"), "true")
        self.page.click('[data-span="range"]')
        self.assertEqual(self.page.get_attribute('[data-when="repeat"]', "aria-checked"), "true")
        self.assertTrue(self.page.is_visible("#spanRange"))

    def test_chip_row_shows_its_error_state(self):
        self.to_repeat()
        self.page.click("#submitBtn")
        self.page.wait_for_timeout(400)
        colour = self.page.eval_on_selector('#dayRow [data-day="1"]', "e => getComputedStyle(e).borderTopColor")
        crit = self.page.evaluate("getComputedStyle(document.documentElement).getPropertyValue('--crit').trim()")
        self.assertEqual(colour, self.page.evaluate(f"(() => {{ const d = document.createElement('i'); d.style.color = '{crit}'; document.body.append(d); const c = getComputedStyle(d).color; d.remove(); return c; }})()"))

    def test_upcoming_dates_are_written_for_people(self):
        self.to_repeat()
        self.page.click('[data-day="1"]')
        self.page.click('[data-month="10"]')
        label = self.page.inner_text("#runsChips .run-chip b")
        self.assertRegex(label, r"^\d{1,2} [а-яўқғҳ]+( \d{4})?$")

    def test_preview_follows_the_language_being_edited(self):
        self.page.click("#ruTitle")
        self.assertEqual(self.page.get_attribute("#pvRu", "aria-pressed"), "true")
        self.page.fill("#ruTitle", "Заголовок")
        self.assertEqual(self.page.inner_text("#pvTitle"), "Заголовок")
        self.page.click("#uzBody")
        self.assertEqual(self.page.get_attribute("#pvUz", "aria-pressed"), "true")
        self.assertEqual(self.page.inner_text("#pvTitle"), "")

    def test_lock_screen_shows_the_moment_it_arrives(self):
        self.to_later()
        self.page.click("#fDate")
        self.page.keyboard.type("05102030")
        self.assertEqual(self.page.inner_text("#lockTime"), "09:00")
        self.assertEqual(self.page.inner_text("#lockDate"), "Шанба, 5 октябр 2030")

    def press(self, sel, dy=6, hold=120):
        box = self.page.locator(sel).bounding_box()
        self.page.mouse.move(box["x"] + box["width"] / 2, box["y"] + dy)
        self.page.mouse.down()
        self.page.wait_for_timeout(hold)
        self.page.mouse.up()
        self.page.wait_for_timeout(100)

    def test_leaving_a_field_does_not_swallow_the_next_click(self):
        self.page.click("#scopeAll")
        for sel, text in self.TEXT[:3]:
            self.page.fill(sel, text)
        self.page.click("#ruBody")
        self.page.evaluate("document.getElementById('ruBody').scrollIntoView({block: 'start'}); window.scrollBy(0, -80)")
        self.press('[data-when="later"]')
        self.assertEqual(self.page.get_attribute('[data-when="later"]', "aria-checked"), "true")
        self.assertTrue(self.page.is_visible("#errRuBody"))

    def tap_after_leaving(self, left, target, prep=None):
        ctx = self.browser.new_context(viewport={"width": 390, "height": 844}, has_touch=True, is_mobile=True)
        page = ctx.new_page()
        try:
            page.goto(self.url, wait_until="domcontentloaded")
            page.wait_for_function("document.querySelectorAll('.scope-row').length > 0")
            page.tap("#scopeAll")
            for sel, text in self.TEXT:
                if sel != left:
                    page.fill(sel, text)
            if prep:
                prep(page)
            page.evaluate(f"scrollTo(0, document.querySelector('{left}').getBoundingClientRect().top + scrollY - 90)")
            page.tap(left)
            page.wait_for_timeout(100)
            box = page.locator(target).first.bounding_box()
            x, y = box["x"] + box["width"] / 2, box["y"] + 5
            self.assertTrue(page.evaluate(f"document.querySelector('{target}').contains(document.elementFromPoint({x}, {y}))"))
            page.touchscreen.tap(x, y)
            page.wait_for_timeout(200)
            return page.get_attribute(target, "aria-pressed") or page.get_attribute(target, "aria-checked")
        finally:
            ctx.close()

    def test_tapping_after_leaving_a_field_lands_on_phones(self):
        self.assertEqual(self.tap_after_leaving("#ruBody", "#pvUz"), "true")

    def test_tapping_a_chip_after_leaving_a_field_lands_on_phones(self):
        def repeat(page):
            page.tap('[data-when="repeat"]')
            page.fill("#fRepeatTime", "")
        self.assertEqual(self.tap_after_leaving("#fRepeatTime", '[data-month="11"]', repeat), "true")

    def pinned_card(self, width, height):
        self.page.set_viewport_size({"width": width, "height": height})
        self.to_repeat()
        self.page.click('[data-day="1"]')
        self.page.click('[data-month="10"]')
        self.page.evaluate("window.scrollTo(0, 1400)")
        self.page.wait_for_timeout(150)
        first = self.page.locator(".side-card").bounding_box()
        self.page.evaluate("window.scrollTo(0, 1500)")
        self.page.wait_for_timeout(150)
        return first, self.page.locator(".side-card").bounding_box()

    def test_sticky_preview_stays_below_the_top_bar(self):
        first, box = self.pinned_card(1280, 720)
        self.assertEqual(first["y"], box["y"])
        self.assertGreaterEqual(box["y"], 64)
        self.assertLessEqual(box["y"] + box["height"], 720)
        toggle = self.page.locator("#pvUz").bounding_box()
        self.assertTrue(self.page.evaluate(
            f"document.getElementById('pvUz').contains(document.elementFromPoint({toggle['x'] + 10}, {toggle['y'] + 10}))"))

    def test_preview_is_never_pinned_under_the_top_bar(self):
        for width, height in [(1100, 600), (1024, 768), (1366, 768)]:
            with self.subTest(size=(width, height)):
                self.page.goto(self.url, wait_until="domcontentloaded")
                first, box = self.pinned_card(width, height)
                if first["y"] == box["y"]:
                    self.assertGreaterEqual(box["y"], 64)
                    self.assertLessEqual(box["y"] + box["height"], height)

    def test_preview_facts_scroll_instead_of_overlapping(self):
        self.pinned_card(1100, 600)
        rects = self.page.eval_on_selector_all(".side-card .fact", "els => els.map(e => [e.getBoundingClientRect().top, e.getBoundingClientRect().bottom])")
        for (_, bottom), (top, _) in zip(rects, rects[1:]):
            self.assertLessEqual(bottom, top + 0.5)
        self.assertEqual(self.page.get_attribute(".side-card .fact-grid", "tabindex"), "0")

    def test_hidden_preview_facts_are_signalled(self):
        self.pinned_card(1100, 600)
        grid = ".side-card .fact-grid"
        self.assertEqual(self.page.get_attribute(grid, "data-more"), "true")
        self.page.eval_on_selector(grid, "g => g.scrollTop = g.scrollHeight")
        self.page.wait_for_timeout(100)
        self.assertEqual(self.page.get_attribute(grid, "data-more"), "false")

    def test_preview_is_not_pinned_when_facts_would_not_fit(self):
        self.page.set_viewport_size({"width": 1280, "height": 540})
        self.assertEqual(self.page.eval_on_selector(".side-card", "e => getComputedStyle(e).position"), "static")

    def test_a_lost_pointer_release_does_not_delay_keyboard_errors(self):
        self.page.evaluate("document.dispatchEvent(new PointerEvent('pointerdown', { pointerType: 'mouse', bubbles: true }))")
        self.page.wait_for_timeout(2100)
        self.page.focus("#uzTitle")
        self.page.keyboard.press("Tab")
        self.page.evaluate("new Promise(r => setTimeout(r, 0))")
        self.assertTrue(self.page.is_visible("#errUzTitle"))

    def test_long_region_names_are_not_cut_on_phones(self):
        self.page.set_viewport_size({"width": 390, "height": 844})
        cut = self.page.eval_on_selector_all(".scope-name", "els => els.filter(e => e.scrollWidth > e.clientWidth + 1).map(e => e.textContent)")
        self.assertEqual(cut, [])

    def platform_fonts(self, selector):
        self.page.evaluate("document.fonts.ready.then(() => 1)")
        self.page.wait_for_timeout(300)
        cdp = self.page.context.new_cdp_session(self.page)
        cdp.send("DOM.enable")
        cdp.send("CSS.enable")
        root = cdp.send("DOM.getDocument", {"depth": -1})["root"]["nodeId"]
        node = cdp.send("DOM.querySelector", {"nodeId": root, "selector": selector})["nodeId"]
        return {f["familyName"].split(" ")[0] for f in cdp.send("CSS.getPlatformFontsForNode", {"nodeId": node})["fonts"]}

    def test_uzbek_letters_render_in_the_interface_fonts(self):
        self.page.evaluate("document.querySelector('.scope-row').click()")
        for selector, family in [("#h-sec-3", "Onest"), ('[data-when="now"] .choice-name', "Onest"),
                                 (".scope-name", "Onest"), ("label[for=uzTitle]", "Source")]:
            with self.subTest(selector=selector):
                self.assertEqual(self.platform_fonts(selector), {family})

    def test_top_bar_focus_ring_stands_out_on_green(self):
        self.page.focus("#resetBtn")
        self.page.keyboard.press("Shift+Tab")
        self.page.keyboard.press("Tab")
        ring = self.page.eval_on_selector("#resetBtn", "e => getComputedStyle(e).boxShadow")
        ink = self.page.evaluate("getComputedStyle(document.documentElement).getPropertyValue('--backdrop-ink').trim()")
        self.assertIn(self.page.evaluate(f"(() => {{ const d = document.createElement('i'); d.style.color = '{ink}'; document.body.append(d); const c = getComputedStyle(d).color; d.remove(); return c; }})()"), ring)

    def test_preview_stays_below_the_top_bar_at_the_page_end(self):
        self.page.click("#scopeAll")
        self.fill_text()
        self.to_repeat()
        self.page.click('[data-day="1"]')
        self.page.click('[data-month="10"]')
        self.page.evaluate("scrollTo(0, document.documentElement.scrollHeight)")
        self.page.wait_for_timeout(200)
        card = self.page.locator(".side-card").bounding_box()
        bar = self.page.locator(".topbar").bounding_box()
        self.assertGreaterEqual(card["y"], bar["y"] + bar["height"])
        last = self.page.locator("#sec-4").bounding_box()
        self.assertLessEqual(card["y"] + card["height"], last["y"] + last["height"] + 1)

    def test_theme_colour_survives_reduced_motion(self):
        page = self.browser.new_page(viewport={"width": 1280, "height": 900}, reduced_motion="reduce")
        try:
            page.goto(self.url, wait_until="domcontentloaded")
            page.click("[data-theme-toggle]")
            page.wait_for_timeout(100)
            colour = page.eval_on_selector('meta[name="theme-color"]:not([media])', "m => m.content")
            self.assertNotIn("rgba(0, 0, 0, 0)", colour)
            self.assertNotEqual(colour.strip(), "")
        finally:
            page.close()

    def test_calendar_clears_the_phone_send_bar(self):
        self.page.set_viewport_size({"width": 390, "height": 844})
        self.to_later()
        self.page.click("#whenLater .pick-toggle")
        self.page.wait_for_timeout(300)
        pop = self.page.locator("#whenLater .date-pop").bounding_box()
        bar = self.page.locator("#actions").bounding_box()
        self.assertLessEqual(pop["y"] + pop["height"], bar["y"])

    def test_phone_toasts_leave_the_bottom_free(self):
        self.page.set_viewport_size({"width": 320, "height": 640})
        self.page.click("#submitBtn")
        self.page.wait_for_selector(".toast")
        toast = self.page.locator(".toast").first.bounding_box()
        self.assertLess(toast["y"] + toast["height"], 320)

    def test_status_tells_missing_from_wrong(self):
        self.to_later()
        self.page.fill("#fTime", "")
        self.page.click("#fTime")
        self.page.keyboard.type("2570")
        self.leave_field()
        status = self.page.inner_text("#status")
        self.assertIn("Тузатиш керак: «Қачон кетади»", status)
        self.assertIn("Тўлдириш керак: «Ким олади», «Хабар матни»", status)

    def test_switching_schedule_mode_clears_its_errors(self):
        self.to_later()
        self.page.click("#fDate")
        self.leave_field()
        self.assertTrue(self.page.is_visible("#errDate"))
        self.to_repeat()
        self.to_later()
        self.assertFalse(self.page.is_visible("#errDate"))

    def test_arrow_keys_stay_inside_their_radio_group(self):
        self.to_repeat()
        self.page.focus('[data-span="months"]')
        self.page.keyboard.press("ArrowRight")
        self.assertEqual(self.page.get_attribute('[data-span="range"]', "aria-checked"), "true")
        self.assertEqual(self.page.get_attribute('[data-when="repeat"]', "aria-checked"), "true")
        self.page.focus('[data-when="repeat"]')
        self.page.keyboard.press("ArrowUp")
        self.assertEqual(self.page.get_attribute('[data-when="later"]', "aria-checked"), "true")
        self.assertEqual(self.page.get_attribute('[data-span="range"]', "aria-checked"), "true")

    def test_lock_screen_shows_now_in_tashkent(self):
        now = datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=5)))
        shown = self.page.inner_text("#lockTime")
        stamps = {(now + datetime.timedelta(minutes=d)).strftime("%H:%M") for d in (-1, 0, 1)}
        self.assertIn(shown, stamps)

    def test_lock_screen_clock_keeps_running(self):
        page = self.browser.new_page(viewport={"width": 1280, "height": 900})
        try:
            page.clock.install(time=datetime.datetime(2030, 3, 4, 9, 58, 30, tzinfo=datetime.timezone(datetime.timedelta(hours=5))))
            page.goto(self.url, wait_until="domcontentloaded")
            page.wait_for_function("document.getElementById('lockTime').textContent !== ''")
            self.assertEqual(page.inner_text("#lockTime"), "09:58")
            page.clock.run_for(90000)
            self.assertEqual(page.inner_text("#lockTime"), "10:00")
            self.assertEqual(page.inner_text("#lockDate"), "Душанба, 4 март")
        finally:
            page.close()

    def test_lock_screen_shows_the_first_repeat(self):
        self.to_repeat()
        self.page.click('[data-day="1"]')
        self.page.click('[data-month="10"]')
        first = self.page.inner_text("#runsChips .run-chip b")
        self.assertEqual(self.page.inner_text("#lockTime"), "09:00")
        self.assertTrue(self.page.inner_text("#lockDate").endswith(", " + first))

    def test_send_brings_the_first_gap_into_view(self):
        self.page.click("#scopeAll")
        self.page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
        self.page.click("#submitBtn")
        self.page.wait_for_timeout(900)
        box = self.page.locator("#uzTitle").bounding_box()
        self.assertGreaterEqual(box["y"], 64)
        self.assertLessEqual(box["y"] + box["height"], 900)

    def test_preview_follows_the_message_on_narrow_screens(self):
        self.page.set_viewport_size({"width": 800, "height": 900})
        side = self.page.locator(".page-side").bounding_box()
        text = self.page.locator("#sec-2").bounding_box()
        when = self.page.locator("#sec-3").bounding_box()
        self.assertGreater(side["y"], text["y"] + text["height"] - 1)
        self.assertLess(side["y"] + side["height"], when["y"] + 1)

    def test_send_bar_is_pinned_on_phones(self):
        self.page.set_viewport_size({"width": 390, "height": 844})
        self.assertEqual(self.page.eval_on_selector("#actions", "e => getComputedStyle(e).position"), "fixed")
        box = self.page.locator("#actions").bounding_box()
        self.assertEqual(round(box["y"] + box["height"]), 844)

    def test_sticky_preview_fits_short_screens(self):
        self.page.set_viewport_size({"width": 1280, "height": 720})
        self.page.set_input_files("#fFiles", files=[
            {"name": f"ilova-{i}.pdf", "mimeType": "application/pdf", "buffer": b"%PDF-1.4"} for i in range(5)])
        self.page.evaluate("window.scrollTo(0, 1400)")
        self.page.wait_for_timeout(200)
        box = self.page.locator(".side-card").bounding_box()
        self.assertLessEqual(box["y"] + box["height"], 720)

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
        self.page.click("#scopeAll")
        self.fill_text()
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

    def test_date_field_is_written_in_cyrillic(self):
        self.to_later()
        self.assertEqual(self.page.get_attribute("#fDate", "placeholder"), "КК.ОО.ЙЙЙЙ")
        self.page.click("#fDate")
        self.page.keyboard.type("05102030")
        self.assertEqual(self.page.input_value("#fDate"), "05.10.2030")
        self.assertEqual(self.page.get_attribute("#fDate", "data-iso"), "2030-10-05")
        self.assertIn("5 октябр 2030", self.page.inner_text("#rcDates"))

    def test_calendar_speaks_cyrillic_and_fills_the_field(self):
        self.to_later()
        self.page.click("#whenLater .pick-toggle")
        pop = "#whenLater .pick-pop"
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
        self.to_later()
        self.page.click("#whenLater .pick-toggle")
        today = self.page.get_attribute("#fDate", "data-min")
        blocked = self.page.eval_on_selector_all(
            "#whenLater .date-day[aria-disabled='true']", "els => els.map(e => e.dataset.iso)")
        self.assertTrue(all(d < today for d in blocked))
        self.assertNotIn(today, blocked)
        self.assertTrue(self.page.is_disabled("#whenLater .date-nav[aria-label='Олдинги ой']"))

    def test_calendar_works_from_the_keyboard(self):
        self.to_later()
        self.page.focus("#whenLater .pick-toggle")
        self.page.keyboard.press("Enter")
        start = self.page.evaluate("document.activeElement.dataset.iso")
        self.page.keyboard.press("ArrowRight")
        self.page.keyboard.press("ArrowDown")
        moved = self.page.evaluate("document.activeElement.dataset.iso")
        self.assertGreater(moved, start)
        self.page.keyboard.press("Enter")
        self.assertEqual(self.page.get_attribute("#fDate", "data-iso"), moved)
        self.page.click("#whenLater .pick-toggle")
        self.page.keyboard.press("Escape")
        self.assertTrue(self.page.is_hidden("#whenLater .pick-pop"))
        self.assertTrue(self.page.evaluate("document.activeElement.classList.contains('pick-toggle')"))

    def test_calendar_opens_on_the_month_being_typed(self):
        self.to_later()
        self.page.click("#fDate")
        self.page.keyboard.type("1512")
        self.page.click("#whenLater .pick-toggle")
        self.assertTrue(self.page.inner_text("#whenLater .date-title").startswith("Декабр"))
        self.assertTrue(self.page.evaluate("document.activeElement.dataset.iso.endsWith('-12-15')"))

    def test_time_field_is_written_in_cyrillic(self):
        self.to_later()
        self.assertEqual(self.page.get_attribute("#fTime", "placeholder"), "СС:ДД")
        self.assertEqual(self.page.get_attribute("#fTime", "data-time"), "09:00")
        self.page.fill("#fTime", "")
        self.page.click("#fTime")
        self.page.keyboard.type("1430")
        self.assertEqual(self.page.input_value("#fTime"), "14:30")
        self.assertEqual(self.page.get_attribute("#fTime", "data-time"), "14:30")

    def test_time_list_picks_hour_then_minute(self):
        self.to_later()
        self.page.click("#whenLater .field:last-child .pick-toggle")
        pop = "#whenLater .field:last-child .pick-pop"
        labels = self.page.eval_on_selector_all(pop + " .time-col-label", "els => els.map(e => e.textContent)")
        self.assertEqual(labels, ["Соат", "Дақиқа"])
        self.assertEqual(self.page.evaluate("document.activeElement.textContent"), "09")
        self.page.click(pop + " [data-kind='h'] [data-value='18']")
        self.assertEqual(self.page.input_value("#fTime"), "18:00")
        self.assertTrue(self.page.is_visible(pop))
        self.page.click(pop + " [data-kind='m'] [data-value='45']")
        self.assertEqual(self.page.input_value("#fTime"), "18:45")
        self.assertTrue(self.page.is_hidden(pop))

    def test_impossible_time_is_named_as_such(self):
        self.to_later()
        self.page.fill("#fTime", "")
        self.page.click("#fTime")
        self.page.keyboard.type("2570")
        self.leave_field()
        self.assertIn("мавжуд эмас", self.page.inner_text("#errTime"))

    def test_impossible_date_is_named_as_such(self):
        self.to_repeat()
        self.page.click('[data-span="range"]')
        self.page.click("#fFrom")
        self.page.keyboard.type("31022030")
        self.page.click('[data-day="1"]')
        self.assertIn("мавжуд эмас", self.page.inner_text("#errFrom"))



if __name__ == "__main__":
    unittest.main()
