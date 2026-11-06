"""Real Settings + HeroUI interactions; only database/profile/navigation transports are isolated."""
import os
import re
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

URL = os.environ.get("SETTINGS_FIXTURE_URL", "http://127.0.0.1:8785")
OUTPUT = Path(os.environ.get("SETTINGS_BROWSER_OUTPUT", "C:/Users/Aaron23/AppData/Local/Temp/opencode/apt-settings-preferences"))
OUTPUT.mkdir(parents=True, exist_ok=True)


def open_rental(page):
    page.get_by_role("button", name="Open settings", exact=True).click()
    expect(page.get_by_role("dialog", name="Settings", exact=True)).to_be_visible()
    page.get_by_role("button", name="Rental Preferences", exact=True).click()


def toggle(page, label):
    page.get_by_role("switch", name=label, exact=True).locator("xpath=ancestor::label[1]").click()


def choose_spots(page):
    page.get_by_role("button", name=re.compile(r"Parking spots needed$")).click()
    page.get_by_role("option", name="2", exact=True).click()


def choose_car(page):
    page.get_by_role("button", name=re.compile(r"Kinds of vehicles$")).click()
    page.get_by_role("option", name="Car", exact=True).click()
    page.keyboard.press("Escape")


with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    errors = []

    def fresh(width=1280, height=800):
        page = browser.new_page(viewport={"width": width, "height": height})
        page.on("pageerror", lambda error: errors.append(str(error)))
        page.goto(URL)
        page.wait_for_load_state("networkidle")
        return page

    page = fresh()
    # Baseline dismissal and real General tab are unaffected.
    page.get_by_role("button", name="Open settings").click()
    expect(page.get_by_role("heading", name="General", exact=True)).to_be_visible()
    expect(page.get_by_role("button", name=re.compile(r"Theme$"))).to_be_visible()
    page.get_by_role("button", name="Close settings").click()
    expect(page.get_by_role("dialog", name="Settings", exact=True)).to_have_count(0)
    expect(page.get_by_role("button", name="Open settings")).to_be_focused()
    open_rental(page)
    toggle(page, "Do you need a parking space?")
    choose_spots(page)
    choose_car(page)
    page.get_by_role("button", name="Save Changes", exact=True).click()
    expect(page.get_by_role("dialog", name="Settings", exact=True)).to_have_count(0)
    assert page.evaluate("settingsFixture.persisted.hasParking") is True
    assert page.evaluate("settingsFixture.persisted.noOfParkingSpots") == 2
    assert page.evaluate("settingsFixture.persisted.listOfVehicles") == ["Car"]
    assert page.evaluate("settingsFixture.refreshes") == 1
    assert page.evaluate("settingsFixture.notifications") == 1
    expect(page.get_by_role("button", name="Open settings")).to_be_focused()
    open_rental(page)
    expect(page.get_by_role("switch", name="Do you need a parking space?")).to_be_checked()
    expect(page.get_by_role("button", name=re.compile(r"Parking spots needed$"))).to_contain_text("2")
    expect(page.get_by_role("button", name=re.compile(r"Kinds of vehicles$"))).to_contain_text("Car")
    page.get_by_role("button", name="Close settings").click()
    expect(page.get_by_role("dialog", name="Settings", exact=True)).to_have_count(0)
    open_rental(page)
    page.keyboard.press("Escape")
    expect(page.get_by_role("dialog", name="Settings", exact=True)).to_have_count(0)
    open_rental(page)
    page.mouse.click(3, 3)
    expect(page.get_by_role("dialog", name="Settings", exact=True)).to_have_count(0)
    page.close()
    print("PASS confirmed save closes, saved Parking fields survive reopen, one refresh/invalidation, General/X/Escape/backdrop and focus restoration")

    for mode in ["error", "zero", "throw"]:
        page = fresh()
        page.evaluate(f'settingsFixture.mode = "{mode}"')
        open_rental(page)
        toggle(page, "Do you need a parking space?")
        page.get_by_role("button", name="Save Changes", exact=True).click()
        expect(page.locator("[data-settings-save-footer]").get_by_role("alert")).to_be_visible()
        expect(page.get_by_role("button", name="Save Changes", exact=True)).to_be_enabled()
        expect(page.get_by_role("switch", name="Do you need a parking space?")).to_be_checked()
        assert page.evaluate("settingsFixture.persisted.hasParking") is False
        assert page.evaluate("settingsFixture.refreshes") == 0
        page.get_by_role("button", name="Close settings").click()
        expect(page.get_by_role("alertdialog", name="Discard changes?", exact=True)).to_be_visible()
        page.get_by_role("button", name="Keep editing", exact=True).click()
        expect(page.get_by_role("dialog", name="Settings", exact=True)).to_be_visible()
        page.keyboard.press("Escape")
        expect(page.get_by_role("alertdialog", name="Discard changes?", exact=True)).to_be_visible()
        page.keyboard.press("Escape")
        expect(page.get_by_role("alertdialog", name="Discard changes?", exact=True)).to_have_count(0)
        expect(page.get_by_role("dialog", name="Settings", exact=True)).to_be_visible()
        page.get_by_role("button", name="Close settings").click()
        page.get_by_role("button", name="Discard changes", exact=True).click()
        expect(page.get_by_role("dialog", name="Settings", exact=True)).to_have_count(0)
        open_rental(page)
        expect(page.get_by_role("switch", name="Do you need a parking space?")).not_to_be_checked()
        page.get_by_role("button", name="Close settings").click()
        page.close()
    print("PASS errors, zero-row writes and thrown requests preserve drafts, release saving, show inline errors and retain working discard/X/Escape flows")

    page = fresh()
    page.evaluate('settingsFixture.mode = "pending"')
    open_rental(page)
    toggle(page, "Do you need a parking space?")
    page.get_by_role("button", name="Save Changes", exact=True).click()
    page.wait_for_function("settingsFixture.saves === 1 && typeof settingsFixture.release === 'function'")
    expect(page.locator("[data-settings-save-footer] button")).to_be_disabled()
    expect(page.get_by_role("button", name="Close settings")).to_be_disabled()
    page.keyboard.press("Escape")
    expect(page.get_by_role("dialog", name="Settings", exact=True)).to_be_visible()
    page.evaluate("settingsFixture.release()")
    expect(page.get_by_role("dialog", name="Settings", exact=True)).to_have_count(0)
    assert page.evaluate("settingsFixture.saves") == 1
    page.close()

    # Budget draft flushing is atomic with the submit, including an unblurred custom maximum.
    page = fresh()
    open_rental(page)
    toggle(page, "Do you need a parking space?")
    page.get_by_role("button", name=re.compile(r"Budget preset$")).click()
    page.get_by_role("option", name="Custom range", exact=True).click()
    page.get_by_role("textbox", name="Maximum monthly rent in pesos", exact=True).fill("22000")
    page.get_by_role("button", name="Save Changes", exact=True).click()
    expect(page.get_by_role("dialog", name="Settings", exact=True)).to_have_count(0)
    assert page.evaluate("settingsFixture.persisted.budgetMax") == 22000
    page.close()
    page = fresh()
    open_rental(page)
    toggle(page, "Do you need a parking space?")
    page.get_by_role("button", name=re.compile(r"Budget preset$")).click()
    page.get_by_role("option", name="Custom range", exact=True).click()
    page.get_by_role("textbox", name="Maximum monthly rent in pesos", exact=True).fill("invalid")
    page.get_by_role("button", name="Save Changes", exact=True).click()
    expect(page.locator("[data-settings-save-footer]").get_by_role("alert")).to_contain_text("valid budget amount")
    assert page.evaluate("settingsFixture.saves") == 0
    expect(page.get_by_role("button", name="Save Changes", exact=True)).to_be_enabled()
    page.close()
    print("PASS temporary pending lock, atomic custom-budget submit and visible validation without a network write")

    for width, height in [(1280, 800), (900, 600), (1024, 520), (390, 844)]:
        page = fresh(width, height)
        open_rental(page)
        header_top = page.get_by_role("heading", name="Settings", exact=True).bounding_box()["y"]
        toggle(page, "Do you need a parking space?")
        choose_spots(page)
        choose_car(page)
        toggle(page, "Do you have accessibility needs?")
        scroller = page.locator("[data-settings-preferences-scroll]")
        footer = page.locator("[data-settings-save-footer]")
        fields = scroller.bounding_box()
        save = footer.bounding_box()
        assert fields["y"] + fields["height"] <= save["y"] + 1, (fields, save)
        assert save["y"] + save["height"] <= height, save
        assert abs(page.get_by_role("heading", name="Settings", exact=True).bounding_box()["y"] - header_top) < 1
        # Every Home control stays outside the footer across all scroll positions.
        assert scroller.evaluate("""element => {
          const footer = document.querySelector('[data-settings-save-footer]').getBoundingClientRect();
          for (let top=0; top<=element.scrollHeight; top+=20) {
            element.scrollTop=top;
            const area=element.getBoundingClientRect();
            if (area.bottom>footer.top+1) return false;
          }
          return true;
        }""")
        page.get_by_role("button", name=re.compile(r"Parking spots needed$")).scroll_into_view_if_needed()
        page.screenshot(path=str(OUTPUT / f"settings-{width}x{height}.png"))
        page.get_by_role("button", name="Save Changes", exact=True).click()
        expect(page.get_by_role("dialog", name="Settings", exact=True)).to_have_count(0)
        page.close()
    assert not errors, errors
    print("PASS independent scrolling, non-overlapping footer and clickable Parking/Spots/Vehicles at desktop, short and narrow viewports; no runtime errors")
    browser.close()
