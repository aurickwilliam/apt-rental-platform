"""Tenant Browse search toolbar at real mobile/tablet/desktop widths.

Renders the production SearchContainer (and BrowseShell geometry) with a
synthetic shell. Filter and Ava are same-shape stand-ins; the map entry and the
in-pill magnifier are the real controls. No account, Supabase connection or
production writes.
"""
import os
import re
import atexit
import functools
import http.server
import threading
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

OUTPUT = Path(os.environ["BROWSE_BROWSER_OUTPUT"])


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, format, *args):
        pass


handler = functools.partial(QuietHandler, directory=str(OUTPUT))
server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), handler)
threading.Thread(target=server.serve_forever, daemon=True).start()
atexit.register(server.server_close)
atexit.register(server.shutdown)
ORIGIN = f"http://127.0.0.1:{server.server_port}"
LONG_PLACEHOLDER = "Search by apartment name, city, or barangay..."
SHORT_PLACEHOLDER = "Search by apartment name..."
LONG_QUERY = "A very long apartment search query that must scroll inside the field"


def rect(locator):
    box = locator.bounding_box()
    assert box, "control has no layout box"
    return box


def overlaps(a, b):
    return (
        a["x"] < b["x"] + b["width"] - 0.5
        and a["x"] + a["width"] > b["x"] + 0.5
        and a["y"] < b["y"] + b["height"] - 0.5
        and a["y"] + a["height"] > b["y"] + 0.5
    )


def placeholders(page):
    input_box = page.get_by_role("textbox", name="Search by apartment name, city, or barangay")
    return input_box, page.get_by_text(SHORT_PLACEHOLDER, exact=True)


def assert_no_overflow(page):
    assert page.evaluate("document.documentElement.scrollWidth <= innerWidth"), "page scrolls horizontally"
    assert page.evaluate("document.body.scrollWidth <= innerWidth"), "body scrolls horizontally"


def assert_controls(page, width, two_rows):
    input_box, short_hint = placeholders(page)
    group = page.locator('[data-slot="input-group"]').first
    fill = page.get_by_role("button", name="Open filters")
    map_button = page.get_by_role("button", name="Search on the map")
    ava = page.get_by_role("button", name="Ask Ava, the APT Virtual Assistant")

    for control in (input_box, group, fill, map_button, ava):
        expect(control).to_be_visible()
    assert_no_overflow(page)

    group_box = rect(group)
    fill_box = rect(fill)
    map_box = rect(map_button)
    ava_box = rect(ava)
    input_rect = rect(input_box)

    # The field lives inside its pill; text can never reach the action buttons.
    assert input_rect["x"] >= group_box["x"] - 0.5
    assert input_rect["x"] + input_rect["width"] <= group_box["x"] + group_box["width"] + 0.5
    assert not overlaps(group_box, fill_box)
    assert not overlaps(group_box, map_box)
    assert not overlaps(group_box, ava_box)
    assert not overlaps(fill_box, map_box)
    assert not overlaps(map_box, ava_box)

    # Every button keeps its icon-sized target and stays wholly on screen.
    for box in (fill_box, map_box, ava_box):
        expected_size = 44 if width < 768 else 40  # Existing HeroUI responsive sizing.
        assert box["width"] == expected_size and box["height"] == expected_size, f"changed touch target at {width}px: {box}"
        assert box["x"] >= 0 and box["x"] + box["width"] <= width
    assert group_box["x"] >= 0 and group_box["x"] + group_box["width"] <= width
    for button in (fill, map_button, ava):
        box, icon = rect(button), rect(button.locator("svg"))
        assert abs(box["x"] + box["width"] / 2 - icon["x"] - icon["width"] / 2) <= 1
        assert abs(box["y"] + box["height"] / 2 - icon["y"] - icon["height"] / 2) <= 1
    gap = 4 if not two_rows and width < 640 else 8
    assert abs(map_box["x"] - fill_box["x"] - fill_box["width"] - gap) <= 1
    assert abs(ava_box["x"] - map_box["x"] - map_box["width"] - gap) <= 1
    if not two_rows:
        assert abs(fill_box["x"] - group_box["x"] - group_box["width"] - gap) <= 1
    if width < 640:
        hero = group.locator("../../..").bounding_box()
        assert abs(hero["height"] - (126 if two_rows else 76)) <= 1, "hero height should follow the controls, without empty space"

    if two_rows:
        # Phone: the pill owns the first row; the actions sit below it.
        assert group_box["y"] + group_box["height"] <= fill_box["y"] + 0.5, "actions must not share the phone row"
        assert abs((ava_box["x"] + ava_box["width"]) - (group_box["x"] + group_box["width"])) <= 1, "actions align to the pill's end"
        assert abs(fill_box["y"] - map_box["y"]) <= 1 and abs(map_box["y"] - ava_box["y"]) <= 1
    else:
        # Tablet/desktop: one row, pill before the actions.
        centre = group_box["y"] + group_box["height"] / 2
        for box in (fill_box, map_box, ava_box):
            assert abs(box["y"] + box["height"] / 2 - centre) <= 2, "actions share the pill's row"
        assert fill_box["x"] >= group_box["x"] + group_box["width"] - 0.5

    # Placeholder presentation: one input, short overlay only below sm.
    native = input_box.get_attribute("placeholder")
    assert native == LONG_PLACEHOLDER
    native_colour = page.evaluate(
        "element => getComputedStyle(element, '::placeholder').color",
        input_box.element_handle(),
    )
    if width < 640:
        expect(short_hint).to_be_visible()
        assert native_colour == "rgba(0, 0, 0, 0)", f"native placeholder still painted below sm: {native_colour}"
        assert rect(short_hint)["x"] >= group_box["x"]
        assert rect(short_hint)["x"] + rect(short_hint)["width"] <= group_box["x"] + group_box["width"] + 0.5
        minimum = 150 if two_rows else 154
        assert input_rect["width"] >= minimum, f"phone field too narrow for meaningful input at {width}px"
        assert short_hint.evaluate("el => { const style = getComputedStyle(el); return style.textOverflow === 'ellipsis' && style.overflowX === 'hidden' && style.whiteSpace === 'nowrap'; }"), "extended hint must shorten safely to the available width"
    else:
        expect(short_hint).to_be_hidden()
        assert native_colour != "rgba(0, 0, 0, 0)", "desktop placeholder must keep its full text"
    return input_box, group


def check_state(page, width, two_rows):
    input_box, group = assert_controls(page, width, two_rows)

    # Long typed query: the field scrolls internally and the toolbar stays put.
    input_box.fill(LONG_QUERY)
    assert_no_overflow(page)
    assert page.evaluate("element => element.scrollWidth >= element.clientWidth", input_box.element_handle())
    assert input_box.input_value() == LONG_QUERY
    input_box.press("End")
    assert input_box.evaluate("el => el.selectionStart === el.value.length && el.scrollLeft > 0"), "caret scrolls into view at query end"
    # The native input keeps over 118px of editable text even with the suffix;
    # the empty compact field keeps at least 154px (checked above).
    assert rect(input_box)["width"] >= (118 if not two_rows and width < 640 else 150), f"clear button must leave a useful typing area at {width}px: {rect(input_box)}"
    clear = page.get_by_role("button", name="Clear search")
    expect(clear).to_be_visible()
    assert rect(clear)["x"] + rect(clear)["width"] <= rect(group)["x"] + rect(group)["width"] + 0.5
    assert_controls_after_typing(page, width)
    clear.click()
    assert input_box.input_value() == ""
    if width < 640:
        expect(page.get_by_text(SHORT_PLACEHOLDER, exact=True)).to_be_visible()
    else:
        expect(page.get_by_text(SHORT_PLACEHOLDER, exact=True)).to_be_hidden()

    # Caret and focus ring stay usable; Enter still submits the committed term.
    input_box.click()
    assert page.evaluate("document.activeElement === document.querySelector('[data-slot=input-group-input]')")
    shadow = page.evaluate("element => getComputedStyle(element).boxShadow", group.element_handle())
    assert shadow != "none", "focused pill must show its ring"
    for term in ["Sunrise", "Malabon", "Longos"]:
        input_box.fill(term)
        input_box.press("Enter")
        expect(page.locator("#fixture-actions")).to_have_text(re.compile(rf"^Search /tenant/browse\?.*search={term}$"))
    input_box.press("Escape")
    if width < 640:
        # A shorter visual viewport must not lose the draft or focused caret.
        input_box.focus()
        original = page.viewport_size
        page.set_viewport_size({"width": width, "height": 420})
        expect(input_box).to_have_value("Longos")
        expect(input_box).to_be_focused()
        assert_controls_after_typing(page, width)
        page.set_viewport_size(original)

    # Visual and keyboard order must agree, with no focus-trapping wrappers.
    page.get_by_role("button", name="Clear search").focus()
    for label in ["Open filters", "Search on the map", "Ask Ava, the APT Virtual Assistant"]:
        page.keyboard.press("Tab")
        expect(page.get_by_role("button", name=label)).to_be_focused()

    # The three entries still act on press without moving the layout.
    page.get_by_role("button", name="Open filters").click()
    expect(page.locator("#fixture-actions")).to_have_text("Filter")
    page.get_by_role("button", name="Search on the map").click()
    expect(page.locator("#fixture-actions")).to_have_text(re.compile(r"^Navigate /tenant/browse/map(?:\?.*)?$"))
    page.get_by_role("button", name="Ask Ava, the APT Virtual Assistant").click()
    expect(page.locator("#fixture-actions")).to_have_text("Ava")
    assert_no_overflow(page)


def assert_controls_after_typing(page, width):
    group = page.locator('[data-slot="input-group"]').first
    fill = page.get_by_role("button", name="Open filters")
    map_button = page.get_by_role("button", name="Search on the map")
    ava = page.get_by_role("button", name="Ask Ava, the APT Virtual Assistant")
    group_box = rect(group)
    for other in (fill, map_button, ava):
        assert not overlaps(group_box, rect(other))
        expect(other).to_be_in_viewport()
    assert_no_overflow(page)


with sync_playwright() as p:
    browser = p.chromium.launch(channel="msedge", headless=True)
    errors = []
    page = browser.new_page(viewport={"width": 393, "height": 844}, reduced_motion="reduce")
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.goto(ORIGIN)
    page.wait_for_load_state("networkidle")

    for width in [320, 360, 375, 391, 392, 393, 430]:
        page.set_viewport_size({"width": width, "height": 844})
        page.goto(ORIGIN)
        page.wait_for_load_state("networkidle")
        check_state(page, width, two_rows=width < 392)
        # Save the empty, unfocused toolbar for visual review.
        page.goto(ORIGIN)
        page.wait_for_load_state("networkidle")
        page.screenshot(path=str(OUTPUT / f"search-toolbar-{width}.png"))
    print("PASS 320/360/375/391 px fallback; 392/393/430 px compact row: short hint, long query, keyboard order and actions")

    for width in [640, 768, 1024, 1440]:
        page.set_viewport_size({"width": width, "height": 900})
        page.goto(ORIGIN)
        page.wait_for_load_state("networkidle")
        check_state(page, width, two_rows=False)
        page.goto(ORIGIN)
        page.wait_for_load_state("networkidle")
        page.screenshot(path=str(OUTPUT / f"search-toolbar-{width}.png"))
    print("PASS 640/768/1024/1440 px: single-row toolbar and full desktop placeholder preserved")

    # A wide viewport with a constrained toolbar must still use the fallback.
    page.set_viewport_size({"width": 430, "height": 844})
    page.goto(ORIGIN)
    page.wait_for_load_state("networkidle")
    page.locator("main").evaluate("el => el.style.width = '375px'")
    assert_controls(page, 430, two_rows=True)
    print("PASS fallback follows actual container width, not just viewport width")

    # Dark theme keeps the same geometry and a readable hint.
    page.set_viewport_size({"width": 393, "height": 844})
    page.goto(ORIGIN)
    page.wait_for_load_state("networkidle")
    light_colour = page.evaluate(
        "element => getComputedStyle(element).color",
        page.get_by_text(SHORT_PLACEHOLDER, exact=True).element_handle(),
    )
    page.goto(ORIGIN + "/?dark=1")
    page.wait_for_load_state("networkidle")
    assert page.evaluate("document.documentElement.classList.contains('dark')")
    check_state(page, 393, two_rows=False)
    assert_no_overflow(page)
    page.goto(ORIGIN + "/?dark=1")
    page.wait_for_load_state("networkidle")
    dark_colour = page.evaluate(
        "element => getComputedStyle(element).color",
        page.get_by_text(SHORT_PLACEHOLDER, exact=True).element_handle(),
    )
    assert dark_colour != light_colour, "dark hint should use the dark muted token"
    page.screenshot(path=str(OUTPUT / "search-toolbar-393-dark.png"))
    for width in [320, 375, 430, 768, 1440]:
        page.set_viewport_size({"width": width, "height": 844})
        page.goto(ORIGIN + "/?dark=1")
        page.wait_for_load_state("networkidle")
        check_state(page, width, two_rows=width < 392)
    print("PASS light and dark themes keep the mobile toolbar readable and overflow-free")

    assert errors == [], errors
    browser.close()
