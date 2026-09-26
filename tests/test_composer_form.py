import datetime
import unittest

from support import READY, ComposerCase, css_colour


class ComposerFormTest(ComposerCase):
    def test_every_section_is_open_at_once(self):
        for sel in ["#scopeAll", "#uzTitle", "#ruBody", "#orgType", '[data-sev="info"]', '[data-expiry="custom"]', ".phone"]:
            self.assertTrue(self.page.is_visible(sel), sel)
        self.assertEqual(self.page.locator("#drop, #whenGroup, [data-when]").count(), 0)

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

    def test_error_text_is_not_rewritten_on_every_key(self):
        self.page.click("#scopeAll")
        self.page.click("#submitBtn")
        self.page.evaluate("""() => { window.__mut = 0; new MutationObserver(l => window.__mut += l.length)
          .observe(document.getElementById('errRuTitle'), { childList: true, subtree: true, characterData: true, attributes: true }); }""")
        self.page.click("#uzBody")
        self.page.keyboard.type("абвгдеж")
        self.assertEqual(self.page.evaluate("window.__mut"), 0)

    def test_send_with_gaps_goes_to_the_first_gap(self):
        self.page.click("#scopeAll")
        self.page.click("#submitBtn")
        self.page.wait_for_function("document.activeElement.id === 'uzTitle'")
        self.assertIn("Тўлдирилмаган: «Хабар матни»", self.page.inner_text("#status"))
        self.assertEqual(self.page.get_attribute("#status", "data-tone"), "crit")

    def test_expiry_presets_name_the_exact_moment(self):
        for key in ["1d", "3d", "7d"]:
            sub = self.page.inner_text(f'[data-expiry="{key}"] .choice-sub')
            self.assertRegex(sub, r"^\d{1,2} [а-яўқғҳ]+( \d{4})?, \d{2}:\d{2} гача$")

    def test_expiry_error_clears_once_a_date_is_typed(self):
        self.to_custom()
        self.page.click("#submitBtn")
        self.assertTrue(self.page.is_visible("#errDate"))
        self.type_date("05102030")
        self.assertFalse(self.page.is_visible("#errDate"))
        self.assertIn("5 октябр 2030, 18:00 гача", self.page.inner_text("#rcExp"))

    def test_switching_expiry_mode_clears_its_errors(self):
        self.to_custom()
        self.page.click("#fDate")
        self.leave_field()
        self.assertTrue(self.page.is_visible("#errDate"))
        self.page.click('[data-expiry="1d"]')
        self.to_custom()
        self.assertFalse(self.page.is_visible("#errDate"))

    def test_status_tells_missing_from_wrong(self):
        self.to_custom()
        self.page.fill("#fTime", "")
        self.page.click("#fTime")
        self.page.keyboard.type("2570")
        self.leave_field()
        status = self.page.inner_text("#status")
        self.assertIn("Тузатиш керак: «Амал қилиш муддати»", status)
        self.assertIn("Тўлдириш керак: «Хабар матни», «Ким олади»", status)

    def test_arrow_keys_stay_inside_their_radio_group(self):
        self.page.focus('[data-sev="warning"]')
        self.page.keyboard.press("ArrowDown")
        self.assertEqual(self.page.get_attribute('[data-sev="critical"]', "aria-checked"), "true")
        self.assertEqual(self.page.get_attribute('[data-expiry="1d"]', "aria-checked"), "true")
        self.page.focus('[data-expiry="1d"]')
        self.page.keyboard.press("ArrowUp")
        self.assertEqual(self.page.get_attribute('[data-expiry="custom"]', "aria-checked"), "true")
        self.assertEqual(self.page.get_attribute('[data-sev="critical"]', "aria-checked"), "true")

    def test_text_limits_are_named_with_the_overflow(self):
        self.page.fill("#uzTitle", "а" * 121)
        self.leave_field()
        self.assertIn("120 белгидан ошмасин — ҳозир 121", self.page.inner_text("#errUzTitle"))
        self.assertEqual(self.page.inner_text("#uzTitleCount"), "121 / 120")
        self.assertIn("Тузатиш керак: «Хабар матни»", self.page.inner_text("#status"))

    def test_invisible_characters_do_not_count_as_text(self):
        self.page.fill("#uzTitle", "​​ ")
        self.leave_field()
        self.assertTrue(self.page.is_visible("#errUzTitle"))
        self.assertEqual(self.page.inner_text("#uzTitleCount"), "0 / 120")

    def test_org_type_must_be_a_positive_code(self):
        for value, ok in [("", False), ("0", False), ("12a", False), ("-5", False), ("200", True)]:
            with self.subTest(value=value):
                self.page.fill("#orgType", value)
                self.leave_field()
                self.assertEqual(self.page.is_visible("#errOrgType"), not ok)

    def test_preview_follows_the_language_being_edited(self):
        self.page.click("#ruTitle")
        self.assertEqual(self.page.get_attribute("#pvRu", "aria-pressed"), "true")
        self.page.fill("#ruTitle", "Заголовок")
        self.assertEqual(self.page.inner_text("#pvTitle"), "Заголовок")
        self.page.click("#uzBody")
        self.assertEqual(self.page.get_attribute("#pvUz", "aria-pressed"), "true")
        self.assertEqual(self.page.inner_text("#pvTitle"), "")

    def test_preview_shows_severity_and_expiry(self):
        self.page.click('[data-sev="critical"]')
        self.assertEqual(self.page.inner_text("#rcSev"), "Критик")
        self.page.click('[data-expiry="7d"]')
        self.assertEqual(self.page.inner_text("#rcExp"), self.page.inner_text('[data-expiry="7d"] .choice-sub'))

    def test_lock_screen_shows_now_in_tashkent(self):
        now = datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=5)))
        stamps = {(now + datetime.timedelta(minutes=d)).strftime("%H:%M") for d in (-1, 0, 1)}
        self.assertIn(self.page.inner_text("#lockTime"), stamps)

    def test_lock_screen_clock_keeps_running(self):
        page = self.context.new_page()
        page.clock.install(time=datetime.datetime(2030, 3, 4, 9, 58, 30, tzinfo=datetime.timezone(datetime.timedelta(hours=5))))
        page.goto(self.url, wait_until="domcontentloaded")
        page.wait_for_function("document.getElementById('lockTime').textContent !== ''")
        self.assertEqual(page.inner_text("#lockTime"), "09:58")
        page.clock.run_for(90000)
        self.assertEqual(page.inner_text("#lockTime"), "10:00")
        self.assertEqual(page.inner_text("#lockDate"), "Душанба, 4 март")
        self.assertEqual(page.inner_text('[data-expiry="1d"] .choice-sub'), "5 март, 10:00 гача")

    def test_leaving_with_a_draft_asks_first(self):
        self.page.click("#scopeAll")
        self.assertTrue(self.leaving_is_held())

    def test_leaving_an_untouched_form_does_not_ask(self):
        self.assertFalse(self.leaving_is_held())

    def test_reset_after_confirming_does_not_ask_twice(self):
        self.page.click("#scopeAll")
        seen = []
        self.page.on("dialog", lambda d: (seen.append(d.type), d.accept()))
        with self.page.expect_navigation():
            self.page.click("#resetBtn")
        self.assertEqual(seen, ["confirm"])
        self.page.wait_for_function(READY)
        self.assertEqual(self.page.get_attribute("#scopeAll", "aria-checked"), "false")

    def test_uzbek_letters_render_in_the_interface_fonts(self):
        self.page.click("#scopeArea")
        self.page.evaluate("document.fonts.ready.then(() => 1)")
        self.page.wait_for_timeout(300)
        cdp = self.context.new_cdp_session(self.page)
        cdp.send("DOM.enable")
        cdp.send("CSS.enable")
        root = cdp.send("DOM.getDocument", {"depth": -1})["root"]["nodeId"]
        for selector in ["#h-sec-4", '[data-sev="warning"] .choice-name', ".scope-name", "label[for=orgType]"]:
            with self.subTest(selector=selector):
                node = cdp.send("DOM.querySelector", {"nodeId": root, "selector": selector})["nodeId"]
                fonts = {f["familyName"].split(" ")[0] for f in cdp.send("CSS.getPlatformFontsForNode", {"nodeId": node})["fonts"]}
                self.assertEqual(fonts, {"Onest"})

    def test_page_actions_show_a_focus_ring(self):
        self.page.focus("#resetBtn")
        self.page.keyboard.press("Shift+Tab")
        self.page.keyboard.press("Tab")
        ring = self.page.eval_on_selector("#resetBtn", "e => getComputedStyle(e).boxShadow")
        focus = self.page.evaluate("getComputedStyle(document.documentElement).getPropertyValue('--focus').trim()")
        self.assertIn(css_colour(self.page, focus), ring)

    def test_field_boundaries_meet_three_to_one(self):
        ratio = self.page.evaluate("""() => {
          const rgb = s => s.match(/\\d+(\\.\\d+)?/g).slice(0, 3).map(Number);
          const lum = c => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
            const [r, g, b] = c.map(f); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
          const cr = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
          const out = {};
          for (const sel of ['#uzTitle', '#scopeSearch', '#orgType']) {
            const el = document.querySelector(sel); const box = sel === '#scopeSearch' ? el.closest('.search') : el;
            out[sel] = cr(rgb(getComputedStyle(box).borderTopColor), rgb(getComputedStyle(box.closest('.section')).backgroundColor));
          }
          return out; }""")
        for sel, value in ratio.items():
            with self.subTest(sel=sel):
                self.assertGreaterEqual(value, 3)

    def test_theme_colour_survives_reduced_motion(self):
        ctx = self.browser.new_context(viewport={"width": 1280, "height": 900}, reduced_motion="reduce")
        try:
            page = self.open_page(ctx)
            page.click("[data-theme-toggle]")
            page.wait_for_timeout(100)
            colour = page.eval_on_selector('meta[name="theme-color"]:not([media])', "m => m.content")
            self.assertNotIn("rgba(0, 0, 0, 0)", colour)
            self.assertNotEqual(colour.strip(), "")
        finally:
            ctx.close()


if __name__ == "__main__":
    unittest.main()
