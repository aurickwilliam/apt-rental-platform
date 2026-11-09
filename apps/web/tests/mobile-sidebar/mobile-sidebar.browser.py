"""Real shared HeroUI mobile drawer; routing/auth/feed are local test doubles."""
import atexit
import functools
import http.server
import os
import threading
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

OUTPUT = Path(os.environ["SIDEBAR_BROWSER_OUTPUT"])


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, format, *args):
        pass


server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), functools.partial(QuietHandler, directory=str(OUTPUT)))
threading.Thread(target=server.serve_forever, daemon=True).start()
atexit.register(server.server_close)
atexit.register(server.shutdown)
ORIGIN = f"http://127.0.0.1:{server.server_port}"


def open_menu(page):
    page.get_by_role("button", name="Open navigation").click()
    dialog = page.get_by_role("dialog")
    expect(dialog).to_be_visible()
    return dialog


def assert_alignment(page, dialog):
    geometry = dialog.evaluate("""dialog => {
      const rect = el => { const r = el.getBoundingClientRect(); return {x:r.x, right:r.right, y:r.y, bottom:r.bottom, width:r.width, height:r.height}; };
      const rows = [...dialog.querySelectorAll('.mobile-sidebar-row')].map(row => {
        const icon = row.querySelector(':scope > svg');
        const text = [...row.childNodes].find(node => node.nodeType === Node.TEXT_NODE && node.textContent.trim());
        const range = document.createRange(); range.selectNodeContents(text);
        return { row: rect(row), icon: rect(icon), label: {x:range.getBoundingClientRect().x}, scroll: row.scrollWidth, client: row.clientWidth, align:getComputedStyle(row).justifyContent };
      });
      return {dialog:rect(dialog), rows, overflow:document.documentElement.scrollWidth > innerWidth};
    }""")
    assert not geometry["overflow"]
    rows = geometry["rows"]
    assert len(rows) >= 10
    for item in rows:
        assert item["align"] == "flex-start", item
        assert abs(item["icon"]["x"] - rows[0]["icon"]["x"]) < 1, "icons share one vertical axis"
        assert abs(item["label"]["x"] - rows[0]["label"]["x"]) < 1, "all labels share a start edge"
        assert abs(item["label"]["x"] - item["icon"]["right"] - 12) < 1, "uniform 12px icon/label gap"
        assert item["icon"]["width"] == 20, "icons never shrink"
        assert item["scroll"] <= item["client"] + 1, "long labels wrap inside the row"
        assert item["row"]["height"] >= 44
        assert item["row"]["right"] <= geometry["dialog"]["right"]
    assert abs(rows[-1]["row"]["bottom"] - geometry["dialog"]["bottom"] + 12) <= 1, "logout stays in the bottom footer"
    return geometry


with sync_playwright() as runtime:
    browser = runtime.chromium.launch(channel="msedge", headless=True)
    page = browser.new_page(viewport={"width": 393, "height": 900}, reduced_motion="reduce")
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    for portal in ["tenant", "landlord", "admin"]:
        for width in [320, 375, 393, 430]:
            page.set_viewport_size({"width": width, "height": 900})
            page.goto(f"{ORIGIN}/?portal={portal}")
            page.wait_for_load_state("networkidle")
            dialog = open_menu(page)
            assert_alignment(page, dialog)
            active = dialog.locator('[aria-current="page"]')
            assert "bg-primary/10" in active.get_attribute("class")
            assert active.evaluate("el => getComputedStyle(el).backgroundColor") != "rgba(0, 0, 0, 0)"
            expect(dialog.get_by_role("button", name="Favorites", exact=True)).to_have_count(1 if portal == "tenant" else 0)
            page.screenshot(path=str(OUTPUT / f"{portal}-{width}.png"))

            theme = dialog.locator('.mobile-sidebar-row').filter(has_text="Dark Mode")
            theme.scroll_into_view_if_needed()
            control = theme.locator(":scope > span")
            assert abs(control.bounding_box()["x"] + control.bounding_box()["width"] - theme.bounding_box()["x"] - theme.bounding_box()["width"] + 12) < 1
            theme.click()
            expect(theme.get_by_role("switch", name="Toggle dark mode")).to_be_checked()
            assert_alignment(page, dialog)
            page.screenshot(path=str(OUTPUT / f"{portal}-{width}-dark.png"))
            theme.click()
            expect(theme.get_by_role("switch", name="Toggle dark mode")).not_to_be_checked()

            # Existing real handlers: close, page navigation, overlays, sign-out.
            page.get_by_role("button", name="Close navigation").click()
            expect(dialog).not_to_be_visible()
            dialog = open_menu(page)
            active = dialog.locator('[aria-current="page"]')
            active.click()
            expect(page.locator("#fixture-actions")).to_have_text(f"/{portal}/{'browse' if portal == 'tenant' else 'dashboard'}")
            expect(dialog).not_to_be_visible()
            dialog = open_menu(page)
            dialog.get_by_role("button", name="Settings", exact=True).click()
            assert "settings=open" in page.url
            dialog = open_menu(page)
            dialog.get_by_role("button", name="Notifications").click()
            assert "notifications=open" in page.url
            dialog = open_menu(page)
            logout = dialog.get_by_role("button", name="Log Out")
            logout.focus()
            expect(logout).to_be_focused()
            logout.press("Enter")
            expect(page.locator("#fixture-actions")).to_have_text("Signed out")
            expect(dialog).not_to_be_visible()
        print(f"PASS {portal}: 320/375/393/430px alignment, active tint, theme, navigation, overlays and logout")

    page.set_viewport_size({"width": 320, "height": 700})
    page.goto(f"{ORIGIN}/?portal=tenant&long=1")
    page.wait_for_load_state("networkidle")
    dialog = open_menu(page)
    assert_alignment(page, dialog)
    long_row = dialog.get_by_role("button", name="AnExtremelyLongNavigationLabelWithoutSpacesForOverflowCoverage")
    assert long_row.bounding_box()["height"] > 44
    long_row.scroll_into_view_if_needed()
    page.screenshot(path=str(OUTPUT / "long-label-320.png"))
    page.keyboard.press("Escape")
    expect(dialog).not_to_be_visible()
    expect(page.get_by_role("button", name="Open navigation")).to_be_focused()
    print("PASS long labels wrap at 320px; Escape closes and restores focus")
    assert not errors, errors
    browser.close()
