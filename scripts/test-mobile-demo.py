"""Read-only browser checks for Phase 1. Requires the dev server + Python Playwright.

Run: python scripts/test-mobile-demo.py --url http://localhost:3000/about/mobile-demo
No auth, native runtime, or backend fixtures are required.
"""

import argparse
import json
import os
import tempfile
from pathlib import Path
from urllib.parse import urlparse

from playwright.sync_api import sync_playwright


SCREENS = [
    ("Rentals dashboard", "rentals"),
    ("Payment History", "payments"),
    ("Messages", "messages"),
    ("Conversation", "conversation"),
]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--url", default="http://localhost:3000/about/mobile-demo")
    parser.add_argument("--output", default=str((Path(os.environ["LOCALAPPDATA"]) / "Temp" if "LOCALAPPDATA" in os.environ else Path(tempfile.gettempdir())) / "opencode/mobile-demo-phase1"))
    parser.add_argument("--production", action="store_true", help="Check that the preview returns 404 instead of rendering fixtures")
    args = parser.parse_args()
    origin = urlparse(args.url).netloc
    output = Path(args.output)
    output.mkdir(parents=True, exist_ok=True)
    results = []

    with sync_playwright() as playwright:
        browser = playwright.chromium.launch()
        if args.production:
            page = browser.new_page()
            response = page.goto(args.url, wait_until="networkidle", timeout=180000)
            assert response.status == 404, response.status
            assert page.locator("[data-mobile-demo]").count() == 0
            browser.close()
            print("Production preview guard: HTTP 404, demo absent")
            return
        for width in (375, 768, 1440, 1919):
            context = browser.new_context(viewport={"width": width, "height": 1250}, reduced_motion="reduce")
            page = context.new_page()
            errors, remote, data_requests = [], [], []
            page.on("pageerror", lambda error: errors.append(str(error)))
            page.on("console", lambda message: errors.append(message.text) if message.type == "error" else None)

            def inspect_request(request):
                if urlparse(request.url).netloc != origin:
                    remote.append(request.url)
                if request.resource_type in ("fetch", "xhr") and "/_next/" not in request.url:
                    data_requests.append(request.url)

            page.on("request", inspect_request)
            response = page.goto(args.url, wait_until="networkidle", timeout=180000)
            assert response.status == 200 and page.url == args.url
            page.evaluate("document.fonts.ready")
            geometries = []
            for label, screen in SCREENS:
                page.get_by_role("button", name=label, exact=True).click()
                viewport = page.locator("[data-demo-viewport]")
                app = page.locator(f'[data-demo-screen="{screen}"]')
                app.wait_for()
                state = viewport.evaluate("""element => {
                    const r = element.getBoundingClientRect();
                    const app = element.querySelector('[data-demo-screen]');
                    return {width: element.offsetWidth, height: element.offsetHeight,
                        bounds: [r.width, r.height], font: getComputedStyle(app).fontFamily,
                        background: getComputedStyle(app).backgroundColor,
                        animations: element.getAnimations({subtree: true}).length};
                }""")
                assert [state["width"], state["height"]] == [412, 915]
                assert abs(state["bounds"][0] / state["bounds"][1] - 412 / 915) < .001
                assert state["background"] == "rgb(245, 247, 251)"
                assert "demoInter" in state["font"] and state["animations"] == 0
                assert page.locator("[data-demo-tab-bar]").count() == (1 if screen in ("rentals", "messages") else 0)
                assert app.locator("a, button, input, textarea, form").count() == 0
                assert not page.evaluate("document.documentElement.scrollWidth > innerWidth")
                assert not app.evaluate("element => element.scrollWidth > element.clientWidth")
                geometries.append(state["bounds"])
                page.locator("[data-demo-frame]").screenshot(path=str(output / f"{width}-{screen}.png"))

                scroll = app.locator("[tabindex='0']")
                if screen == "rentals":
                    assert app.get_by_text("Receipts", exact=True).count() == 1
                    assert app.locator('[data-demo-destination="payments"]').count() == 2
                    amount = app.locator('[aria-label="Monthly rent summary"]')
                    assert amount.evaluate("element => getComputedStyle(element).backgroundColor") == "rgb(47, 95, 224)"
                    scroll.evaluate("element => { element.scrollTop = element.scrollHeight; }")
                    page.wait_for_function("document.querySelector('[aria-label=\"Rental dashboard content\"]').scrollTop > 229")
                    page.wait_for_timeout(80)
                    status = app.locator("[aria-hidden='true']").first
                    assert status.evaluate("element => getComputedStyle(element).color") == "rgb(51, 51, 51)"
                elif screen == "payments":
                    assert app.get_by_text("Pending", exact=True).count() == 0
                    assert app.get_by_text("Paid", exact=True).count() == 6
                elif screen == "conversation":
                    assert app.get_by_text("Type a message...", exact=True).count() == 1
                    assert scroll.evaluate("element => element.scrollTop") == 0
                    # column-reverse opens at the latest message without JS scrolling.
                    newest = app.get_by_text("Thank you, see you on Thursday!", exact=True).bounding_box()
                    composer = app.locator('[aria-label="Message composer — visual only"]').bounding_box()
                    assert newest["y"] + newest["height"] <= composer["y"] + 1
                    scroll.evaluate("element => { element.scrollTop = -element.scrollHeight; }")
                    page.wait_for_timeout(80)
                    assert scroll.evaluate("element => element.scrollTop") < 0

                # No drift in a static screen while waiting.
                before = app.inner_text()
                page.wait_for_timeout(150)
                assert before == app.inner_text()
            assert all(abs(a - b) < .1 for geometry in geometries for a, b in zip(geometry, geometries[0]))
            page.evaluate("document.documentElement.classList.add('dark', 'apt-reduce-motion')")
            assert page.locator("[data-demo-screen]").evaluate("element => getComputedStyle(element).backgroundColor") == "rgb(245, 247, 251)"
            assert not remote, remote
            assert not data_requests, data_requests
            assert not errors, errors
            results.append({"width": width, "screens": 4, "remoteRequests": len(remote), "dataRequests": len(data_requests), "errors": errors})
            context.close()

        # Verify the initial phone dimensions remain reserved with delayed assets.
        context = browser.new_context(viewport={"width": 375, "height": 1000})
        page = context.new_page()
        pending = []
        page.route("**/*.woff2", lambda route: pending.append(route))
        page.route("**/*.ttf", lambda route: pending.append(route))
        page.route("**/landing/hero-living-room.png", lambda route: pending.append(route))
        page.goto(args.url, wait_until="domcontentloaded", timeout=180000)
        viewport = page.locator("[data-demo-viewport]")
        viewport.wait_for()
        before = viewport.bounding_box()
        for route in pending:
            route.continue_()
        page.wait_for_load_state("networkidle")
        page.evaluate("document.fonts.ready")
        after = viewport.bounding_box()
        assert before == after, (before, after)
        context.close()
        browser.close()

    print(json.dumps({"results": results, "reservedLayout": "passed", "screenshots": str(output)}, indent=2))


if __name__ == "__main__":
    main()
