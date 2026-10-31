"""Chromium regression for the real 28.8s demo clock (no accelerated test mode).

Run with the dev server already running: python scripts/test-mobile-demo-motion.py
The existing test-mobile-demo.py still verifies reduced-motion static inspection.
"""

import argparse
import hashlib
import json
import os
from pathlib import Path
import tempfile
from urllib.parse import urlparse

from playwright.sync_api import sync_playwright


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--url", default="http://localhost:3000/about/mobile-demo")
    parser.add_argument("--landing", action="store_true", help="Exercise the embedded demo on the public landing page")
    temp = Path(os.environ["LOCALAPPDATA"]) / "Temp" if "LOCALAPPDATA" in os.environ else Path(tempfile.gettempdir())
    parser.add_argument("--output", default=str(temp / "opencode/mobile-demo-phase2"))
    args = parser.parse_args()
    output = Path(args.output)
    output.mkdir(parents=True, exist_ok=True)
    origin = urlparse(args.url).netloc
    stage_selector = "#landing-mobile-demo" if args.landing else "#mobile-demo-preview"
    reports = []

    with sync_playwright() as p:
        browser = p.chromium.launch()
        for width in (375, 768, 1440, 1919):
            context = browser.new_context(viewport={"width": width, "height": 1250})
            page = context.new_page()
            errors, requests = [], []
            page.on("pageerror", lambda error: errors.append(str(error)))
            page.on("console", lambda message: errors.append(message.text) if message.type == "error" else None)
            page.on("request", lambda request: requests.append(request.url) if urlparse(request.url).netloc != origin or (request.resource_type in ("fetch", "xhr") and "/_next/" not in request.url) else None)
            page.goto(args.url, wait_until="networkidle", timeout=180000)
            stage = page.locator(stage_selector)
            stage.scroll_into_view_if_needed()
            if args.landing:
                section = page.locator('section[aria-labelledby="mobile-title"]')
                assert section.locator('img[src="/landing/app-mobile-my-rental.png"]').count() == 0
                assert section.locator('[data-demo-frame]').count() == 1
                assert section.locator('h1').count() == 0
                assert section.get_by_role('heading', name='A simpler way to stay connected.', exact=True).count() == 1
                assert section.evaluate('e=>getComputedStyle(e).backgroundColor') == 'rgb(239, 246, 255)'
                assert section.get_by_text('Your rental conversations, records, and important updates can stay within reach while you are on the go.', exact=True).count() == 1
                assert section.get_by_role('button', name='Download for Android', exact=True).count() == 1
                assert section.locator('[data-demo-viewport]').get_attribute('aria-hidden') == 'true'
                assert stage.evaluate('e=>getComputedStyle(e).pointerEvents') == 'none'

            def running(value):
                page.wait_for_function("value => document.querySelector('[data-demo-running]').dataset.demoRunning === value", arg=str(value).lower())

            def time():
                return float(stage.get_attribute("data-demo-time"))

            def wait_time(target):
                page.wait_for_function("t => Number(document.querySelector('[data-demo-running]').dataset.demoTime) >= t", arg=target, timeout=40000)

            def fingerprint():
                return stage.evaluate("""root => ({time:root.dataset.demoTime,
                    layers:[...root.querySelectorAll('[data-demo-layer]')].map(e=>({id:e.dataset.demoLayer,style:e.getAttribute('style'),scroll:e.querySelector('[tabindex="0"]').scrollTop})),
                    touch:root.querySelector('[data-demo-touch]').getAttribute('style'),
                    chrome:[...root.querySelectorAll('[data-demo-os-chrome]')].map(e=>e.getAttribute('style')),
                    targets:[...root.querySelectorAll('[data-demo-tap]')].map(e=>e.getAttribute('style'))})""")

            def assert_frozen():
                before = fingerprint()
                page.wait_for_timeout(450)
                assert fingerprint() == before, (before, fingerprint())

            def screenshot(name):
                return page.locator("[data-demo-frame]").screenshot(path=str(output / f"{width}-{name}.png"))

            running(True)
            wait_time(.5)
            assert stage.get_attribute("data-demo-screen-name") == "rentals"
            initial = hashlib.sha256(screenshot("start")).hexdigest()
            initial_size = page.locator('[data-demo-viewport]').evaluate("e=>[e.offsetWidth,e.offsetHeight]")

            # Freeze mid-touch: pulse, target press and playhead all stop together.
            wait_time(3.15)
            target = page.locator('[data-demo-tap="history"]')
            touch = page.locator('[data-demo-touch]')
            page.get_by_role("button", name="Pause", exact=True).click()
            running(False)
            assert 3 < time() < 3.45
            assert float(touch.evaluate("e=>getComputedStyle(e).opacity")) > 0
            a, b = target.bounding_box(), touch.bounding_box()
            assert abs(a["x"] + a["width"] / 2 - b["x"] - b["width"] / 2) < 2
            assert abs(a["y"] + a["height"] / 2 - b["y"] - b["height"] / 2) < 2
            assert_frozen()
            screenshot("touch-paused")
            page.get_by_role("button", name="Resume", exact=True).click()

            wait_time(3.55)
            page.get_by_role("button", name="Pause", exact=True).click()
            assert page.locator("[data-demo-layer]").count() == 2
            assert_frozen()
            screenshot("history-transition")
            page.get_by_role("button", name="Resume", exact=True).click()
            wait_time(6.2)
            scroll = page.locator('[data-demo-screen="payments"] [tabindex="0"]')
            first_scroll = scroll.evaluate("e=>e.scrollTop")
            assert first_scroll > 0
            page.get_by_role("button", name="Pause", exact=True).click()
            assert_frozen()
            screenshot("history-scroll-paused")
            page.get_by_role("button", name="Resume", exact=True).click()
            wait_time(8.5)
            assert scroll.evaluate("e=>e.scrollTop") > first_scroll
            wait_time(10.8)
            assert stage.get_attribute("data-demo-screen-name") == "rentals"
            wait_time(11.55)
            assert page.locator('[data-demo-tap="messages"]').count() == 1
            screenshot("chat-tab-touch")
            wait_time(12.3)
            assert stage.get_attribute("data-demo-screen-name") == "messages"
            wait_time(14)
            assert page.locator('[data-demo-tap="landlord"]').count() == 1
            screenshot("landlord-touch")
            wait_time(15)
            assert stage.get_attribute("data-demo-screen-name") == "conversation"
            wait_time(17.4)
            chat = page.locator('[data-demo-screen="conversation"] [tabindex="0"]')
            assert chat.evaluate("e=>e.scrollTop") < 0
            screenshot("conversation-older")
            wait_time(21)
            screenshot("conversation-return")
            wait_time(22.3)
            assert abs(chat.evaluate("e=>e.scrollTop")) < 1
            wait_time(24)
            assert stage.get_attribute("data-demo-screen-name") == "messages"
            wait_time(26)
            assert stage.get_attribute("data-demo-screen-name") == "rentals"
            assert hashlib.sha256(screenshot("loop-end")).hexdigest() == initial, "Final phone pixels must match the starting phone"
            assert page.locator('[data-demo-viewport]').evaluate("e=>[e.offsetWidth,e.offsetHeight]") == initial_size
            page.wait_for_function("Number(document.querySelector('[data-demo-running]').dataset.demoTime) < 2", timeout=10000)
            assert stage.get_attribute("data-demo-screen-name") == "rentals"

            # Actual viewport visibility gate, not an injected controller flag.
            page.evaluate("let e=document.createElement('div');e.id='test-spacer';e.style.height='1600px';document.body.append(e);scrollTo(0,document.body.scrollHeight)")
            running(False)
            assert_frozen()
            stage.scroll_into_view_if_needed()
            running(True)
            page.get_by_role("button", name="Pause", exact=True).click()
            page.evaluate("scrollTo(0,document.body.scrollHeight)")
            stage.scroll_into_view_if_needed()
            assert_frozen()
            assert stage.get_attribute("data-demo-running") == "false"
            page.get_by_role("button", name="Resume", exact=True).click()
            running(True)

            # Headless Chromium reports every tab as visible. Exercise the actual
            # document listener with the visibility value a background tab supplies.
            page.evaluate("Object.defineProperty(document,'visibilityState',{configurable:true,get:()=> 'hidden'});document.dispatchEvent(new Event('visibilitychange'))")
            running(False)
            assert_frozen()
            page.evaluate("Object.defineProperty(document,'visibilityState',{configurable:true,get:()=> 'visible'});document.dispatchEvent(new Event('visibilitychange'))")
            running(True)

            if not args.landing:
                page.get_by_role("button", name="Conversation", exact=True).click()
                running(False)
                assert stage.get_attribute("data-demo-screen-name") == "conversation"
                assert time() == 14.6
                assert_frozen()
                page.get_by_role("button", name="Resume", exact=True).click()
                running(True)
                page.wait_for_timeout(150)
                assert time() > 14.6
            page.get_by_role("button", name="Replay", exact=True).click()
            assert time() < 1
            assert stage.get_attribute("data-demo-screen-name") == "rentals"

            # Live OS and saved APT reduced-motion preferences, including manual inspection.
            page.emulate_media(reduced_motion="reduce")
            running(False)
            assert stage.get_attribute("data-demo-screen-name") == "rentals"
            assert time() == 0
            assert_frozen()
            if not args.landing:
                page.get_by_role("button", name="Messages", exact=True).click()
                assert stage.get_attribute("data-demo-screen-name") == "messages"
            page.emulate_media(reduced_motion="no-preference")
            page.evaluate("localStorage.setItem('apt-reduce-motion','true');window.dispatchEvent(new Event('apt-reduce-motion-change'))")
            running(False)
            page.get_by_role("button", name="Replay", exact=True).click()
            assert stage.get_attribute("data-demo-screen-name") == "rentals"
            assert_frozen()
            assert not page.evaluate("document.documentElement.scrollWidth>innerWidth")
            assert not errors, errors
            assert not requests, requests
            if args.landing:
                # Wheel over the decorative phone must scroll the PAGE, not its
                # internal list or a cancelling capture handler. No real APK fetch.
                page.evaluate("document.querySelector('#test-spacer').remove()")
                stage.scroll_into_view_if_needed()
                rect = stage.bounding_box()
                before = page.evaluate('scrollY')
                page.mouse.move(rect['x'] + rect['width'] / 2, rect['y'] + rect['height'] / 2)
                page.mouse.wheel(0, -100)
                page.wait_for_timeout(150)
                assert page.evaluate('scrollY') < before
                assert page.locator('[data-demo-screen="rentals"] [tabindex="0"]').evaluate('e=>e.scrollTop') == 0
                # Intercept only the existing destination; do not download an APK.
                page.route('**/download', lambda route: route.fulfill(status=200, content_type='text/plain', body='Existing download destination verified'))
                with page.expect_request('**/download'):
                    section.get_by_role('button', name='Download for Android', exact=True).click()
            reports.append({"width": width, "loop": "pixel-identical end/start", "pause": "touch/scroll/transition clock frozen", "visibility": "viewport real, document hidden event emulated", "errors": errors, "backendRequests": requests})
            context.close()
        # Autoplay cannot outrun a below-the-fold image that is still decoding.
        context = browser.new_context(viewport={"width": 1440, "height": 1250})
        page = context.new_page()
        pending = []
        page.route("**/landing/hero-living-room.png", lambda route: pending.append(route))
        page.goto(args.url, wait_until="domcontentloaded", timeout=180000)
        stage = page.locator(stage_selector)
        stage.scroll_into_view_if_needed()
        page.wait_for_timeout(300)
        assert stage.get_attribute('data-demo-running') == 'false'
        assert float(stage.get_attribute('data-demo-time')) == 0
        for route in pending:
            route.continue_()
        page.wait_for_function("document.querySelector('[data-demo-running]').dataset.demoRunning === 'true'")
        page.goto('about:blank')
        context.close()
        browser.close()
    print(json.dumps({"checks": reports, "screenshots": str(output)}, indent=2))


if __name__ == "__main__":
    main()
