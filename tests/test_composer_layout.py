import unittest

from support import READY, ComposerCase


class ComposerLayoutTest(ComposerCase):
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
        self.page.fill("#orgType", "")
        self.page.click("#orgType")
        self.page.evaluate("document.getElementById('orgType').scrollIntoView({block: 'start'}); window.scrollBy(0, -80)")
        self.press('[data-sev="critical"]')
        self.assertEqual(self.page.get_attribute('[data-sev="critical"]', "aria-checked"), "true")
        self.assertTrue(self.page.is_visible("#errOrgType"))

    def tap_after_leaving(self, left, target, prep=None):
        ctx = self.browser.new_context(viewport={"width": 390, "height": 844}, has_touch=True, is_mobile=True)
        try:
            page = ctx.new_page()
            page.goto(self.url, wait_until="domcontentloaded")
            page.wait_for_function(READY)
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

    def test_tapping_a_radio_after_leaving_a_field_lands_on_phones(self):
        self.assertEqual(self.tap_after_leaving("#orgType", '[data-sev="critical"]', lambda p: p.fill("#orgType", "")), "true")

    def pinned_card(self, width, height):
        self.page.set_viewport_size({"width": width, "height": height})
        self.to_custom()
        self.page.evaluate("window.scrollTo(0, 1400)")
        self.page.wait_for_timeout(150)
        first = self.page.locator(".side-card").bounding_box()
        self.page.evaluate("window.scrollTo(0, 1500)")
        self.page.wait_for_timeout(150)
        return first, self.page.locator(".side-card").bounding_box()

    def test_sticky_preview_stays_below_the_top_bar(self):
        first, box = self.pinned_card(1280, 720)
        self.assertEqual(first["y"], box["y"])
        self.assertGreaterEqual(box["y"], self.bars_bottom())
        self.assertLessEqual(box["y"] + box["height"], 720)
        toggle = self.page.locator("#pvUz").bounding_box()
        self.assertTrue(self.page.evaluate(
            f"document.getElementById('pvUz').contains(document.elementFromPoint({toggle['x'] + 10}, {toggle['y'] + 10}))"))

    def test_preview_is_never_pinned_under_the_top_bar(self):
        for width, height in [(1100, 600), (1024, 768), (1366, 768)]:
            with self.subTest(size=(width, height)):
                self.page.goto(self.url, wait_until="domcontentloaded")
                self.page.wait_for_function(READY)
                first, box = self.pinned_card(width, height)
                if first["y"] == box["y"]:
                    self.assertGreaterEqual(box["y"], self.bars_bottom())
                    self.assertLessEqual(box["y"] + box["height"], height)

    def test_preview_facts_scroll_instead_of_overlapping(self):
        self.pinned_card(1280, 720)
        rects = self.page.eval_on_selector_all(".side-card .fact", "els => els.map(e => [e.getBoundingClientRect().top, e.getBoundingClientRect().bottom])")
        for (_, bottom), (top, _) in zip(rects, rects[1:]):
            self.assertLessEqual(bottom, top + 0.5)
        self.assertEqual(self.page.get_attribute(".side-card .fact-grid", "tabindex"), "0")

    def test_hidden_preview_facts_are_signalled(self):
        self.pinned_card(1280, 720)
        grid = ".side-card .fact-grid"
        self.assertEqual(self.page.get_attribute(grid, "data-more"), "true")
        self.page.eval_on_selector(grid, "g => g.scrollTop = g.scrollHeight")
        self.page.wait_for_timeout(100)
        self.assertEqual(self.page.get_attribute(grid, "data-more"), "false")

    def test_preview_is_not_pinned_when_facts_would_not_fit(self):
        self.page.set_viewport_size({"width": 1100, "height": 600})
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
        self.page.click("#scopeArea")
        cut = self.page.eval_on_selector_all(".scope-name", "els => els.filter(e => e.scrollWidth > e.clientWidth + 1).map(e => e.textContent)")
        self.assertEqual(cut, [])

    def test_preview_stays_below_the_top_bar_at_the_page_end(self):
        self.page.click("#scopeAll")
        self.fill_text()
        self.to_custom()
        self.page.evaluate("scrollTo(0, document.documentElement.scrollHeight)")
        self.page.wait_for_timeout(200)
        card = self.page.locator(".side-card").bounding_box()
        self.assertGreaterEqual(card["y"], self.bars_bottom())
        last = self.page.locator("#sec-4").bounding_box()
        self.assertLessEqual(card["y"] + card["height"], last["y"] + last["height"] + 1)

    def test_calendar_clears_the_phone_send_bar(self):
        self.page.set_viewport_size({"width": 390, "height": 844})
        self.to_custom()
        self.page.click("#expiryCustom .pick-toggle")
        self.page.wait_for_timeout(300)
        pop = self.page.locator("#expiryCustom .date-pop").bounding_box()
        bar = self.page.locator("#actions").bounding_box()
        self.assertLessEqual(pop["y"] + pop["height"], bar["y"])

    def test_phone_toasts_leave_the_bottom_free(self):
        self.page.set_viewport_size({"width": 320, "height": 640})
        self.page.evaluate("window.omToast('Маълумот нусхаланди', 'ok')")
        self.page.wait_for_selector(".toast")
        toast = self.page.locator(".toast").first.bounding_box()
        self.assertLess(toast["y"] + toast["height"], 320)

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
        who = self.page.locator("#sec-1").bounding_box()
        self.assertGreater(side["y"], text["y"] + text["height"] - 1)
        self.assertLess(side["y"] + side["height"], who["y"] + 1)

    def test_send_bar_is_pinned_on_phones(self):
        self.page.set_viewport_size({"width": 390, "height": 844})
        self.assertEqual(self.page.eval_on_selector("#actions", "e => getComputedStyle(e).position"), "fixed")
        box = self.page.locator("#actions").bounding_box()
        self.assertEqual(round(box["y"] + box["height"]), 844)

    def test_sticky_preview_fits_short_screens(self):
        self.page.set_viewport_size({"width": 1280, "height": 720})
        self.to_custom()
        self.page.evaluate("window.scrollTo(0, 1400)")
        self.page.wait_for_timeout(200)
        box = self.page.locator(".side-card").bounding_box()
        self.assertLessEqual(box["y"] + box["height"], 720)

    def test_result_dialog_fits_a_phone(self):
        self.page.set_viewport_size({"width": 360, "height": 740})
        self.page.click("#scopeAll")
        self.fill_text()
        self.page.click("#submitBtn")
        self.page.wait_for_selector("#resultDialog[open] .send-code")
        dlg = self.page.locator("#resultDialog").bounding_box()
        self.assertGreaterEqual(dlg["x"], 0)
        self.assertLessEqual(dlg["x"] + dlg["width"], 360)
        self.assertLessEqual(self.page.evaluate("document.documentElement.scrollWidth"), 360)


if __name__ == "__main__":
    unittest.main()
