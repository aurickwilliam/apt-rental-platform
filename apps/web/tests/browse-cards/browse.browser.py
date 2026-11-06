"""Real Chromium pointer/keyboard/touch checks against production components and CSS."""
import os
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

URL = os.environ.get("BROWSE_FIXTURE_URL", "http://127.0.0.1:8769")
OUTPUT = Path(os.environ.get("BROWSE_BROWSER_OUTPUT", "C:/Users/Aaron23/AppData/Local/Temp/opencode/apt-browse-cards"))
OUTPUT.mkdir(parents=True, exist_ok=True)


def body_point(page, index=0):
    box = page.locator("[data-preview-card]").nth(index).bounding_box()
    return box["x"] + box["width"] / 2, box["y"] + 100


def open_preview(page, index=0):
    page.mouse.move(*body_point(page, index))
    expect(page.get_by_role("dialog", name="Quick preview", exact=False)).to_be_visible(timeout=2000)
    page.wait_for_timeout(260)
    return page.get_by_role("dialog", name="Quick preview", exact=False)


with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1280, "height": 900})
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.goto(URL)
    page.wait_for_load_state("networkidle")
    assert not errors, errors
    expect(page.locator("[data-preview-card]")).to_have_count(6)
    cards = page.locator("[data-preview-card]")
    for label in ["Preferred city", "Within budget", "+2 more"]:
        expect(cards.first.get_by_role("list", name="Matches your rental preferences")).to_contain_text(label)
    expect(cards.nth(1).get_by_text("Parking available", exact=True)).to_be_visible()
    city_section = page.get_by_role("region", name="Apartments in Caloocan", exact=True)
    expect(city_section.get_by_role("list", name="Matches your rental preferences")).to_have_count(0)
    page.screenshot(path=str(OUTPUT / "desktop.png"), full_page=True)

    # Quick pass/early leave never opens. Navigation works during the dwell.
    page.mouse.move(*body_point(page))
    page.wait_for_timeout(120)
    page.mouse.move(10, 10)
    page.wait_for_timeout(500)
    expect(page.locator(".apt-hover-preview")).to_have_count(0)
    page.mouse.move(*body_point(page))
    page.mouse.click(*body_point(page))
    assert page.evaluate("browseFixture.navigation.at(-1)") == "/tenant/browse/one"
    page.mouse.move(10, 10)
    page.wait_for_timeout(500)
    expect(page.locator(".apt-hover-preview")).to_have_count(0)

    # Heart entry, dwell and click remain independent, including a cancelled body dwell.
    heart = cards.first.get_by_role("button", name="Save to favorites")
    page.mouse.move(*body_point(page))
    page.wait_for_timeout(200)
    heart.hover()
    page.wait_for_timeout(650)
    expect(page.locator(".apt-hover-preview")).to_have_count(0)
    before = page.evaluate("browseFixture.navigation.length")
    heart.click()
    expect(cards.first.get_by_role("button", name="Remove from favorites")).to_be_visible()
    assert page.evaluate("browseFixture.navigation.length") == before

    # Sustained body hover opens after the delay, with matching chips and restrained motion.
    page.mouse.move(*body_point(page))
    page.wait_for_timeout(250)
    expect(page.locator(".apt-hover-preview")).to_have_count(0)
    preview = open_preview(page)
    expect(preview.get_by_role("note", name="Rental preference match summary")).to_contain_text("Matches 4 of your preferences")
    expect(preview.get_by_role("note", name="Rental preference match summary")).to_contain_text("City · Budget · Bedrooms · Amenities")
    expect(preview.get_by_role("button", name="Close quick preview")).to_have_count(0)
    expect(preview.get_by_text("/ month", exact=True)).to_be_visible()
    assert preview.locator("h4").evaluate("e => getComputedStyle(e).fontSize") == "18px"
    assert preview.evaluate("e => getComputedStyle(e).animationDuration") == "0.24s"
    page.screenshot(path=str(OUTPUT / "expanded.png"))
    # Pointer movement within preview keeps it open (source-to-preview grace).
    box = preview.bounding_box()
    page.mouse.move(box["x"] + box["width"] / 2, box["y"] + 220, steps=4)
    page.wait_for_timeout(500)
    expect(preview).to_be_visible()
    # Move into the real source heart even when covered; hit testing must hand it back.
    source_heart = cards.first.get_by_role("button", name="Remove from favorites")
    box = source_heart.bounding_box()
    page.mouse.move(box["x"] + box["width"] / 2, box["y"] + box["height"] / 2, steps=3)
    expect(page.locator(".apt-hover-preview")).to_have_count(0)
    page.mouse.click(box["x"] + box["width"] / 2, box["y"] + box["height"] / 2)
    expect(cards.first.get_by_role("button", name="Save to favorites")).to_be_visible()
    assert page.evaluate("browseFixture.navigation.length") == before

    preview = open_preview(page)
    bounds = page.locator("[data-browse-preview-bounds]").bounding_box()
    box = preview.bounding_box()
    assert box["x"] >= bounds["x"] - 1
    assert box["x"] + box["width"] <= bounds["x"] + bounds["width"] + 1
    page.mouse.move(10, 10)
    page.wait_for_timeout(180)
    closing = page.locator('.apt-hover-preview[data-closing="true"]')
    assert closing.evaluate("e => getComputedStyle(e).pointerEvents") == "none"
    page.wait_for_timeout(180)
    expect(page.locator(".apt-hover-preview")).to_have_count(0)
    preview = open_preview(page)
    page.keyboard.press("Escape")
    expect(page.locator(".apt-hover-preview")).to_have_count(0)
    preview = open_preview(page)
    preview.get_by_role("button", name="View details", exact=False).click()
    assert page.evaluate("browseFixture.navigation.at(-1)") == "/tenant/browse/one"
    expect(page.locator(".apt-hover-preview")).to_have_count(0)
    page.mouse.move(10, 10)

    # Crossing to another apartment retires the old overlay before the new dwell ends.
    open_preview(page)
    page.mouse.move(*body_point(page, 2))
    page.wait_for_timeout(100)
    expect(page.locator(".apt-hover-preview")).to_have_count(0)
    page.wait_for_timeout(450)
    expect(page.get_by_role("dialog", name="Quick preview of Spacious", exact=False)).to_be_visible()
    long_preview = page.get_by_role("dialog", name="Quick preview of Spacious", exact=False)
    expect(long_preview.get_by_text("₱ 1,250,000", exact=True)).to_be_visible()
    expect(long_preview.get_by_text("/ month", exact=True)).to_be_visible()
    assert long_preview.locator("h4").evaluate("e => e.getBoundingClientRect().height") <= 49
    page.keyboard.press("Escape")
    expect(page.locator(".apt-hover-preview")).to_have_count(0)
    open_preview(page)
    page.mouse.wheel(0, 80)
    expect(page.locator(".apt-hover-preview")).to_have_count(0)
    page.evaluate("scrollTo(0, 0)")
    page.mouse.move(10, 10)
    page.wait_for_timeout(150)

    # Real native buttons preserve keyboard navigation without nested interactive controls.
    navigation = cards.first.get_by_role("button", name="View Kaunlaran", exact=False)
    navigation.focus()
    before = page.evaluate("browseFixture.navigation.length")
    page.keyboard.press("Enter")
    assert page.evaluate("browseFixture.navigation.length") == before + 1
    cards.first.get_by_role("button", name="Save to favorites").focus()
    page.keyboard.press("Space")
    expect(cards.first.get_by_role("button", name="Remove from favorites")).to_be_visible()
    assert page.evaluate("browseFixture.navigation.length") == before + 1
    assert page.locator("button button, [role=button] button").count() == 0

    # The exact same matching apartment in a city section has no chips or preview summary.
    city_section.locator("[data-preview-card]").first.scroll_into_view_if_needed()
    page.mouse.move(10, 10)
    preview = open_preview(page, 3)
    expect(preview.get_by_role("note", name="Rental preference match summary")).to_have_count(0)
    expect(preview.get_by_role("list", name="Matches your rental preferences")).to_have_count(0)
    preview.get_by_role("button", name="View details", exact=False).click()
    assert page.evaluate("browseFixture.navigation.at(-1)") == "/tenant/browse/one"
    page.evaluate("scrollTo(0, 0)")
    page.mouse.move(10, 10)

    # The general/search/filter grid has no chips, even though the saved preferences match.
    page.get_by_role("button", name="Switch layout").click()
    expect(page.get_by_role("list", name="Matches your rental preferences")).to_have_count(0)
    preview = open_preview(page)
    expect(preview.get_by_role("note", name="Rental preference match summary")).to_have_count(0)
    page.keyboard.press("Escape")
    page.mouse.move(10, 10)
    page.get_by_role("button", name="Switch layout").click()
    page.get_by_role("button", name="Change saved preferences").click()
    expect(cards.first.get_by_role("list", name="Matches your rental preferences")).to_have_count(0)
    expect(cards.nth(1).get_by_text("Preferred city", exact=True)).to_be_visible()
    page.get_by_role("button", name="Sign out").click()
    expect(page.get_by_role("list", name="Matches your rental preferences")).to_have_count(0)
    preview = open_preview(page)
    expect(preview.get_by_role("note", name="Rental preference match summary")).to_have_count(0)
    page.keyboard.press("Escape")
    print("PASS Recommended-only compact chips/summary, matching city/grid exclusions, pending/immediate navigation, Favorite handoff, closing, keyboard, profile/account updates")

    reduced = browser.new_page(viewport={"width": 1000, "height": 800}, reduced_motion="reduce")
    reduced.goto(URL)
    reduced.wait_for_load_state("networkidle")
    preview = open_preview(reduced)
    assert preview.evaluate("e => getComputedStyle(e).animationName") == "none"
    reduced.close()
    short = browser.new_page(viewport={"width": 640, "height": 360})
    short.goto(URL)
    short.wait_for_load_state("networkidle")
    short_preview = open_preview(short)
    short_box = short_preview.bounding_box()
    assert short_box["x"] >= 0 and short_box["x"] + short_box["width"] <= 640
    assert short_box["y"] >= 0 and short_box["y"] + short_box["height"] <= 353
    scroller = short_preview.locator(".card").first
    scroller.evaluate("e => { e.scrollTop = e.scrollHeight; }")
    short.wait_for_timeout(100)
    expect(short_preview).to_be_visible()
    expect(short_preview.get_by_role("note", name="Rental preference match summary")).to_be_visible()
    short.screenshot(path=str(OUTPUT / "short-viewport.png"))
    short.close()
    touch = browser.new_context(viewport={"width": 390, "height": 844}, is_mobile=True, has_touch=True)
    mobile = touch.new_page()
    mobile.goto(URL)
    mobile.wait_for_load_state("networkidle")
    mobile.locator("[data-preview-card]").first.get_by_role("button", name="Save to favorites").tap()
    assert mobile.evaluate("browseFixture.navigation.length") == 0
    mobile.wait_for_timeout(600)
    expect(mobile.locator(".apt-hover-preview")).to_have_count(0)
    mobile.locator("[data-preview-card]").first.get_by_role("button", name="View Kaunlaran", exact=False).tap()
    assert mobile.evaluate("browseFixture.navigation.at(-1)") == "/tenant/browse/one"
    mobile.screenshot(path=str(OUTPUT / "touch.png"))
    touch.close()
    assert not errors, errors
    print("PASS short-viewport scrolling, reduced motion and touch: no touch expansion, independent Favorite and immediate navigation; no browser runtime errors")
    browser.close()
