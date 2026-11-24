"""Real Settings modal/navigation and General controls; other tab bodies stubbed."""
import atexit
import functools
import http.server
import os
import threading
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

OUTPUT = Path(os.environ["SETTINGS_BROWSER_OUTPUT"])


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, format, *args):
        pass


server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), functools.partial(QuietHandler, directory=str(OUTPUT)))
threading.Thread(target=server.serve_forever, daemon=True).start()
atexit.register(server.server_close)
atexit.register(server.shutdown)
ORIGIN = f"http://127.0.0.1:{server.server_port}"
LABELS = ["General", "Rental Preferences", "Security", "Notifications", "Language & Region", "Help & Support"]


def settle_animations(page):
    page.evaluate("""async () => {
      await Promise.all(document.getAnimations().filter(a => a.effect?.getTiming().iterations !== Infinity).map(a => a.finished.catch(() => {})));
    }""")


def visible_in_strip(page):
    return page.evaluate("""() => {
      const nav = document.querySelector('.settings-category-nav').getBoundingClientRect();
      const active = document.querySelector('.settings-category-button[aria-current=page]').getBoundingClientRect();
      return active.left >= nav.left - 1 && active.right <= nav.right + 1;
    }""")


def general_geometry(page, width):
    data = page.evaluate("""() => {
      const rect = el => { const r=el.getBoundingClientRect(); return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,w:r.width,h:r.height}; };
      const rows = [...document.querySelectorAll('.settings-row-responsive')];
      return rows.map(row => ({row:rect(row), label:rect(row.children[1]), control:rect(row.lastElementChild),
        description: rect(row.children[1].lastElementChild), overflow:row.scrollWidth > row.clientWidth,
        wrapping:getComputedStyle(row.children[1].lastElementChild).whiteSpace}));
    }""")
    assert len(data) == 2
    theme, motion = data
    for row in data:
        assert not row["overflow"], row
        assert row["wrapping"] == "normal"
        assert row["control"]["right"] <= row["row"]["right"]
    if width < 640:
        assert theme["control"]["y"] >= theme["label"]["bottom"] + 11, "Theme control stacks below copy"
        assert abs(theme["control"]["x"] - theme["label"]["x"]) <= 1
        if width <= 393:
            assert theme["description"]["h"] > 20, "description wraps rather than truncating when space is limited"
    else:
        assert theme["control"]["x"] >= theme["label"]["right"]
    assert motion["control"]["x"] >= motion["label"]["right"]
    assert abs(motion["control"]["right"] - motion["row"]["right"] + 16) <= 1, "motion toggle remains right aligned"
    assert motion["row"]["y"] >= theme["row"]["bottom"], "rows do not overlap"


with sync_playwright() as runtime:
    browser = runtime.chromium.launch(channel="msedge", headless=True)
    page = browser.new_page(viewport={"width": 393, "height": 844}, reduced_motion="reduce")
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    for width in [320, 375, 393, 430, 640, 768, 1440]:
        page.set_viewport_size({"width": width, "height": 844})
        page.goto(ORIGIN)
        page.wait_for_load_state("networkidle")
        page.evaluate("localStorage.clear()")
        page.reload()
        page.wait_for_load_state("networkidle")
        page.get_by_role("button", name="Open settings").click()
        dialog = page.get_by_role("dialog", name="Settings", exact=True)
        expect(dialog).to_be_visible()
        nav = page.get_by_role("navigation", name="Settings sections")
        buttons = nav.locator("button")
        assert buttons.all_text_contents() == LABELS
        settle_animations(page)
        active = nav.locator('[aria-current="page"]')
        assert active.evaluate("el => getComputedStyle(el).backgroundColor") != "rgba(0, 0, 0, 0)", "active category keeps its blue surface"
        assert page.evaluate("document.documentElement.scrollWidth <= innerWidth")
        assert dialog.evaluate("el => el.scrollWidth <= el.clientWidth"), dialog.evaluate("el => [el, ...el.querySelectorAll('*')].filter(n => n.scrollWidth > n.clientWidth + 1 || n.className?.includes?.('modal__body')).map(n => [n.tagName,n.className,n.clientWidth,n.scrollWidth,getComputedStyle(n).display,getComputedStyle(n).minWidth,getComputedStyle(n).padding,getComputedStyle(n).margin]).slice(0,15)")
        general_geometry(page, width)

        if width < 768:
            assert nav.evaluate("el => el.scrollWidth > el.clientWidth")
            assert nav.evaluate("el => getComputedStyle(el).scrollbarWidth") == "thin"
            assert abs(buttons.first.bounding_box()["x"] - nav.bounding_box()["x"] - 12) <= 1
            for label in reversed(LABELS):
                # Programmatic activation avoids Playwright auto-scrolling;
                # production selection must reveal the button itself.
                button = nav.get_by_role("button", name=label, exact=True)
                button.evaluate("el => el.click()")
                expect(button).to_have_attribute("aria-current", "page")
                page.wait_for_function("""() => { const nav=document.querySelector('.settings-category-nav').getBoundingClientRect(); const active=document.querySelector('.settings-category-button[aria-current=page]').getBoundingClientRect(); return active.left >= nav.left - 1 && active.right <= nav.right + 1; }""")
                assert visible_in_strip(page)
        else:
            assert abs(nav.bounding_box()["width"] - 208) <= 1
            axes = buttons.evaluate_all("""els => els.map(el => ({icon:el.querySelector('svg').getBoundingClientRect().x,label:el.querySelector('span').getBoundingClientRect().x,align:getComputedStyle(el).justifyContent}))""")
            assert all(abs(row["icon"] - axes[0]["icon"]) <= 1 and abs(row["label"] - axes[0]["label"]) <= 1 and row["align"] == "flex-start" for row in axes)

        nav.get_by_role("button", name="General", exact=True).click()
        # Native button keyboard order remains intact and focused categories
        # stay reachable; Enter selects the focused category.
        nav.get_by_role("button", name="General", exact=True).focus()
        page.keyboard.press("Tab")
        expect(nav.get_by_role("button", name="Rental Preferences")).to_be_focused()
        page.keyboard.press("Enter")
        expect(nav.get_by_role("button", name="Rental Preferences")).to_have_attribute("aria-current", "page")
        nav.get_by_role("button", name="General", exact=True).click()
        select = dialog.locator('[data-slot="select-trigger"]')
        select.click()
        page.get_by_role("option", name="Dark", exact=True).click()
        expect(page.locator("html")).to_have_class("dark")
        general_geometry(page, width)
        motion = dialog.get_by_role("switch", name="Reduce motion")
        dialog.locator('[data-slot="switch"]').click()
        expect(motion).to_be_checked()
        assert page.evaluate("localStorage.getItem('apt-reduce-motion')") == "true"
        settle_animations(page)
        page.screenshot(path=str(OUTPUT / f"settings-{width}-dark.png"))
        motion.focus()
        page.keyboard.press("Space")
        expect(motion).not_to_be_checked()
        select.click()
        page.get_by_role("option", name="Light", exact=True).click()
        settle_animations(page)
        page.screenshot(path=str(OUTPUT / f"settings-{width}.png"))
        page.get_by_role("button", name="Close settings").click()
        expect(dialog).not_to_be_visible()
        page.get_by_role("button", name="Open settings").click()
        page.keyboard.press("Escape")
        expect(dialog).not_to_be_visible()
        expect(page.get_by_role("button", name="Open settings")).to_be_focused()
        print(f"PASS {width}px: navigation, selected visibility, General layout, theme, motion, keyboard and dismissal")

    page.set_viewport_size({"width": 320, "height": 844})
    page.goto(ORIGIN + "/?rental=1")
    page.wait_for_load_state("networkidle")
    page.get_by_role("button", name="Open settings").click()
    expect(page.get_by_role("navigation").get_by_role("button", name="Rental Preferences")).to_have_attribute("aria-current", "page")
    page.wait_for_function("document.querySelector('.settings-category-nav').scrollLeft > 0")
    assert visible_in_strip(page)
    print("PASS initial Rental Preferences intent is brought into view at 320px")
    assert not errors, errors
    browser.close()
