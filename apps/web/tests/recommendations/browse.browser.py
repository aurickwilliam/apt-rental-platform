"""Production browsing UI with synthetic listings; no hosted reads or writes."""
import os
import atexit
import functools
import http.server
import threading
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

OUTPUT = Path(os.environ["BROWSE_BROWSER_OUTPUT"])
handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(OUTPUT))
server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), handler)
threading.Thread(target=server.serve_forever, daemon=True).start()
atexit.register(server.server_close)
atexit.register(server.shutdown)
ORIGIN = f"http://127.0.0.1:{server.server_port}"
LONG_NAME = "Apartment 0 — A very long apartment name that must not resize the card"


def no_preview_after_dwell(page):
    # Exceed the production 450ms hover intent to detect unwanted delayed opens.
    page.wait_for_timeout(650)
    expect(page.get_by_role("dialog")).to_have_count(0)


def check_bounds(page, dialog):
    rect = dialog.bounding_box()
    bounds = page.locator("[data-browse-preview-bounds]").bounding_box()
    viewport = page.viewport_size
    assert rect["x"] >= max(8, bounds["x"]) - 1
    assert rect["x"] + rect["width"] <= min(viewport["width"] - 8, bounds["x"] + bounds["width"]) + 1
    assert rect["y"] >= 7
    assert rect["y"] + rect["height"] <= viewport["height"] - 7


def check_default_cards(page):
    region = page.get_by_role("region", name="Recommended for You", exact=True)
    expect(region.get_by_text("Apartments selected based on your rental preferences.", exact=True)).to_be_visible()
    expect(page.get_by_role("button", name="Quick preview", exact=False)).to_have_count(0)
    expect(page.get_by_role("dialog")).to_have_count(0)
    cards = region.locator("[data-preview-card]")
    expect(cards).to_have_count(8)
    two = region.locator('[data-preview-card="apt-0"]')
    one = region.locator('[data-preview-card="apt-1"]')
    zero = region.locator('[data-preview-card="apt-2"]')
    expect(two.get_by_role("listitem")).to_have_text(["Bedroom match", "Pet-friendly"])
    expect(one.get_by_role("listitem")).to_have_text(["Pet-friendly"])
    expect(zero.get_by_role("listitem")).to_have_count(0)
    expect(zero.get_by_role("list")).to_have_count(0)
    boxes = [card.bounding_box() for card in [two, one, zero]]
    assert max(box["height"] for box in boxes) - min(box["height"] for box in boxes) <= 1
    title = two.locator("h3")
    expect(title).to_have_text(LONG_NAME)
    assert title.evaluate("element => element.scrollWidth > element.clientWidth"), "long title should truncate, never enlarge the card"
    long_location = one.locator('[data-slot="apartment-card-location"]')
    assert long_location.evaluate("element => element.scrollWidth > element.clientWidth")
    price_tops = []
    for index in range(8):
        card = cards.nth(index)
        box = card.bounding_box()
        price = card.locator('[data-slot="apartment-card-price"]').bounding_box()
        location = card.locator('[data-slot="apartment-card-location"]').bounding_box()
        price_tops.append(price["y"])
        assert box["y"] + box["height"] - price["y"] - price["height"] <= 12
        for chip in card.get_by_role("listitem").all():
            rect = chip.bounding_box()
            assert rect["x"] >= box["x"] and rect["x"] + rect["width"] <= box["x"] + box["width"]
            assert rect["y"] >= location["y"] + location["height"]
            assert price["y"] >= rect["y"] + rect["height"] + 8
            assert rect["y"] + rect["height"] <= box["y"] + box["height"]
    assert max(price_tops) - min(price_tops) <= 1, "all price rows must align"
    ordinary = page.get_by_role("region", name="Verified apartments", exact=True)
    expect(ordinary.get_by_role("list", name="Matches your preferences")).to_have_count(0)
    expect(ordinary.locator('[data-slot="apartment-card-recommendations"]')).to_have_count(0)
    assert page.evaluate("document.documentElement.scrollWidth <= innerWidth")
    assert page.locator("button button, [role=button] button, a button").count() == 0
    return region


with sync_playwright() as p:
    browser = p.chromium.launch(channel="msedge", headless=True)
    errors = []
    page = browser.new_page(viewport={"width": 1280, "height": 900}, reduced_motion="reduce")
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.goto(ORIGIN)
    page.wait_for_load_state("networkidle")
    for width in [1440, 1280, 1024, 768, 430, 393, 375, 320]:
        page.set_viewport_size({"width": width, "height": 900})
        page.mouse.move(0, 0)
        region = check_default_cards(page)
        page.screenshot(path=str(OUTPUT / f"default-recommendations-{width}.png"))
    print("PASS desktop/tablet/mobile default chips, zero/one/two equal-height cards, long names and generic isolation")

    # Empty, invalid and failed states never fake matches or fall back to cards.
    for state, title, action in [
        ("empty", "No apartments match your preferences yet.", "Update preferences"),
        ("invalid", "Review your rental preferences", "Update preferences"),
        ("error", "Recommendations couldn't load", "Try again"),
    ]:
        page.goto(ORIGIN + f"/?state={state}")
        page.wait_for_load_state("networkidle")
        state_region = page.get_by_role("region", name="Recommended for You", exact=True)
        expect(state_region.get_by_text(title, exact=True)).to_be_visible()
        expect(state_region.get_by_role("button", name=action, exact=True)).to_be_visible()
        expect(state_region.locator("[data-preview-card]")).to_have_count(0)
        expect(state_region.get_by_role("link", name="Browse all apartments")).to_have_attribute("href", "/tenant/browse?sort=recent")
    print("PASS empty, invalid and failed recommendation states stay distinct with truthful actions")

    page.set_viewport_size({"width": 1280, "height": 900})
    page.goto(ORIGIN)
    page.wait_for_load_state("networkidle")
    region = page.get_by_role("region", name="Recommended for You", exact=True)
    card = region.locator('[data-preview-card="apt-0"]')
    favorite = card.get_by_role("button", name="Save to favorites")
    # Fresh first interaction: entering any part of the heart hit area cannot
    # start the card preview timer. No prior hover/second-open workaround.
    favorite.hover()
    no_preview_after_dwell(page)
    hit = card.locator("[data-apartment-favorite]").bounding_box()
    page.mouse.move(hit["x"] + 2, hit["y"] + 2)
    no_preview_after_dwell(page)
    page.mouse.move(0, 0)
    navigation = card.get_by_role("button", name=f"View {LONG_NAME}", exact=True)
    navigation.focus()
    navigation.press("Enter")
    expect(page.locator("#fixture-actions")).to_have_text("Navigate /tenant/browse/apt-0")
    navigation.press("Space")
    expect(page.locator("#fixture-actions")).to_have_text("Navigate /tenant/browse/apt-0")
    navigation.press("Tab")
    favorite = card.get_by_role("button", name="Save to favorites")
    expect(favorite).to_be_focused()
    no_preview_after_dwell(page)
    favorite.press("Enter")
    expect(page.locator("#fixture-actions")).to_have_text("Favorite apt-0")
    remove = card.get_by_role("button", name="Remove from favorites")
    expect(remove).to_be_focused()
    remove.press("Space")
    expect(favorite).to_be_visible()
    no_preview_after_dwell(page)

    # Cancel a pending normal-card dwell when the pointer moves onto Favorite.
    hit = card.locator("[data-apartment-favorite]").bounding_box()
    card.hover(position={"x": 80, "y": 100})
    page.mouse.move(hit["x"] + hit["width"] / 2, hit["y"] + hit["height"] / 2)
    no_preview_after_dwell(page)

    # The original loading state remains intact, with no delayed expansion.
    page.evaluate("window.fixtureHoldFavorites = true")
    favorite.click()
    expect(favorite.locator('[data-slot="spinner-icon"]')).to_be_visible()
    no_preview_after_dwell(page)
    page.evaluate("window.fixtureHoldFavorites = false; window.fixtureResolveFavorite()")
    expect(remove).to_be_visible()

    before = card.bounding_box()
    card.hover(position={"x": 80, "y": 100})
    dialog = page.get_by_role("dialog", name=f"Quick preview of {LONG_NAME}", exact=True)
    expect(dialog).to_be_visible()
    assert card.bounding_box() == before
    check_bounds(page, dialog)
    expect(dialog.get_by_role("list", name="Matches your preferences")).to_have_count(0)
    page.screenshot(path=str(OUTPUT / "desktop-hover-preview.png"))
    # Even if the open overlay covers the source heart, moving onto its actual
    # screen location hands interaction back to that independent control.
    hit = card.locator("[data-apartment-favorite]").bounding_box()
    page.mouse.move(hit["x"] + hit["width"] / 2, hit["y"] + hit["height"] / 2)
    no_preview_after_dwell(page)
    remove.click()
    expect(favorite).to_be_visible()
    no_preview_after_dwell(page)
    card.hover(position={"x": 80, "y": 100})
    expect(dialog).to_be_visible()
    adjacent_favorite = region.locator('[data-preview-card="apt-3"]').get_by_role("button", name="Save to favorites")
    adjacent_favorite.click()
    expect(page.locator("#fixture-actions")).to_have_text("Favorite apt-3")
    page.mouse.move(0, 0)
    expect(dialog).not_to_be_visible()
    no_preview_after_dwell(page)
    card.hover()
    expect(dialog).to_be_visible()
    page.keyboard.press("Escape")
    expect(dialog).not_to_be_visible()
    page.mouse.move(0, 0)

    # Changes reconcile directly on the default card, not on a stale hover snapshot.
    page.get_by_role("button", name="Change saved budget").click()
    expect(card.get_by_role("listitem")).to_have_text(["Within budget", "Bedroom match"])
    expect(region.locator('[data-preview-card="apt-1"]').get_by_role("listitem")).to_have_text(["Within budget", "Pet-friendly"])
    page.get_by_role("button", name="Change saved budget").click()

    # Off-screen carousel cards can be reached; their previews stay inside the content.
    last = region.locator('[data-preview-card="apt-2"]')
    last.scroll_into_view_if_needed()
    last.hover(position={"x": 100, "y": 100})
    last_dialog = page.get_by_role("dialog", name="Quick preview of Apartment 2", exact=True)
    expect(last_dialog).to_be_visible()
    check_bounds(page, last_dialog)
    last_dialog.get_by_role("button", name="Close quick preview").click()
    expect(last_dialog).not_to_be_visible()

    # Animated short-screen previews scroll internally and leave actions reachable.
    page.set_viewport_size({"width": 1024, "height": 260})
    page.emulate_media(reduced_motion="no-preference")
    card.scroll_into_view_if_needed()
    card.hover(position={"x": 100, "y": 100})
    expect(dialog).to_be_visible()
    dialog.evaluate("async element => { await Promise.all(element.getAnimations().map(animation => animation.finished)); }")
    check_bounds(page, dialog)
    dialog.hover()
    dialog.evaluate("element => { element.scrollTop = element.scrollHeight; }")
    expect(dialog.get_by_role("button", name=f"View details of {LONG_NAME}")).to_be_in_viewport()
    expect(dialog).to_be_visible()
    page.keyboard.press("Escape")
    print("PASS keyboard navigation/favorites, desktop hover without duplicate chips, sidebar/right/bottom bounds and scrolling")

    page.set_viewport_size({"width": 1280, "height": 900})
    page.goto(ORIGIN + "/?grid=1")
    page.wait_for_load_state("networkidle")
    expect(page.get_by_role("list", name="Matches your preferences")).to_have_count(0)
    expect(page.locator('[data-slot="apartment-card-recommendations"]')).to_have_count(0)
    grid_card = page.locator('[data-preview-card="apt-0"]')
    grid_card.get_by_role("button", name="Save to favorites").hover()
    no_preview_after_dwell(page)
    grid_card.hover(position={"x": 80, "y": 100})
    expect(dialog).to_be_visible()
    dialog.get_by_role("button", name=f"View details of {LONG_NAME}").click()
    expect(page.locator("#fixture-actions")).to_have_text("Navigate /browse/apt-0")
    page.mouse.move(0, 0)
    expect(dialog).not_to_be_visible()
    search = page.get_by_role("textbox", name="Search by apartment name, city, or barangay")
    for term in ["Apartment", "Malabon", "Longos"]:
        search.fill(term)
        search.press("Enter")
        expect(page.locator("#fixture-actions")).to_contain_text("search=" + term)

    mobile = browser.new_context(viewport={"width": 390, "height": 844}, is_mobile=True, has_touch=True, reduced_motion="reduce")
    phone = mobile.new_page()
    phone.on("pageerror", lambda error: errors.append(str(error)))
    phone.goto(ORIGIN)
    phone.wait_for_load_state("networkidle")
    region = check_default_cards(phone)
    phone.screenshot(path=str(OUTPUT / "mobile-default-recommendations.png"))
    card = region.locator('[data-preview-card="apt-0"]')
    card.get_by_role("button", name="Save to favorites").tap()
    expect(phone.locator("#fixture-actions")).to_have_text("Favorite apt-0")
    no_preview_after_dwell(phone)
    card.get_by_role("button", name="Remove from favorites").tap()
    expect(card.get_by_role("button", name="Save to favorites")).to_be_visible()
    no_preview_after_dwell(phone)
    card.get_by_role("button", name=f"View {LONG_NAME}", exact=True).tap()
    expect(phone.locator("#fixture-actions")).to_have_text("Navigate /tenant/browse/apt-0")
    # A real touch swipe scrolls the carousel rather than activating navigation.
    track = card.locator("..")
    bounds = track.bounding_box()
    x, y = bounds["x"] + bounds["width"] - 24, bounds["y"] + 80
    cdp = mobile.new_cdp_session(phone)
    cdp.send("Input.dispatchTouchEvent", {"type": "touchStart", "touchPoints": [{"x": x, "y": y}]})
    for distance in [40, 90, 140, 190, 240]:
        cdp.send("Input.dispatchTouchEvent", {"type": "touchMove", "touchPoints": [{"x": x - distance, "y": y}]})
    cdp.send("Input.dispatchTouchEvent", {"type": "touchEnd", "touchPoints": []})
    phone.wait_for_function("element => element.scrollLeft > 0", arg=track.element_handle())
    expect(phone.locator("#fixture-actions")).to_have_text("Navigate /tenant/browse/apt-0")
    region.locator("[data-preview-card]").last.scroll_into_view_if_needed()
    expect(region.locator("[data-preview-card]").last).to_be_in_viewport()
    expect(phone.get_by_role("dialog")).to_have_count(0)
    assert phone.evaluate("document.documentElement.scrollWidth <= innerWidth")
    for width in [320, 375, 393, 430]:
        phone.set_viewport_size({"width": width, "height": 844})
        phone.goto(ORIGIN)
        phone.wait_for_load_state("networkidle")
        check_default_cards(phone)
        phone.screenshot(path=str(OUTPUT / f"touch-default-recommendations-{width}.png"))
    assert errors == [], errors
    print("PASS View Details, ordinary grid/search preservation, touch favorites/navigation, mobile chip placement and carousel overflow")
    mobile.close()
    browser.close()
