"""Production rental UI with synthetic, network-disabled transports only."""
import atexit
import functools
import http.server
import os
import threading
from pathlib import Path
from urllib.parse import quote
from playwright.sync_api import sync_playwright, expect

OUTPUT = Path(os.environ["RENTAL_BROWSER_OUTPUT"])


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, format, *args):
        pass

    def translate_path(self, path):
        # App routes such as /tenant/my-rental are virtual in Next and are not
        # files on disk; serve the fixture shell so a reload keeps working.
        resolved = super().translate_path(path)
        if not os.path.isfile(resolved):
            return str(OUTPUT / "index.html")
        return resolved


server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), functools.partial(QuietHandler, directory=str(OUTPUT)))
threading.Thread(target=server.serve_forever, daemon=True).start()
atexit.register(server.server_close)
atexit.register(server.shutdown)
ORIGIN = f"http://127.0.0.1:{server.server_port}"


def load(page, screen, extra=""):
    page.goto(f"{ORIGIN}/?screen={screen}{extra}")
    page.wait_for_load_state("networkidle")
    page.wait_for_function("window.fixture !== undefined")


def no_overflow(page):
    assert page.evaluate("document.documentElement.scrollWidth <= innerWidth"), page.evaluate("[...document.querySelectorAll('main *')].filter(el=>el.getBoundingClientRect().right>innerWidth+1).map(el=>[el.tagName,el.className]).slice(0,10)")


def settle(page):
    page.evaluate("async () => { await Promise.all(document.getAnimations().filter(a=>a.effect?.getTiming().iterations !== Infinity).map(a=>a.finished.catch(()=>{}))); window.scrollTo(0,0); }")


with sync_playwright() as runtime:
    browser = runtime.chromium.launch(channel="msedge", headless=True)
    page = browser.new_page(viewport={"width": 393, "height": 900}, reduced_motion="reduce")
    errors = []
    def record_error(error):
        errors.append(str(error))
        print("BROWSER ERROR:", error)
    page.on("pageerror", record_error)
    # No fixture can contact Supabase or any nonlocal endpoint.
    page.route("**/*", lambda route: route.continue_() if route.request.url.startswith(ORIGIN) else route.abort())

    for width in [320, 375, 393, 430, 768, 1280, 1920]:
        page.set_viewport_size({"width": width, "height": 900})
        for screen in ["rental", "applications", "detail", "maintenance"]:
            load(page, screen, "&status=pending" if screen == "detail" else "")
            if screen == "rental":
                expect(page.get_by_role("heading", name="Need a repair?")).to_be_visible()
                action = page.get_by_role("link", name="Request maintenance", exact=True).first
                assert "tenancyId=00000000-0000-4000-8000-000000000020#new-request" in action.get_attribute("href")
                action.click()
                assert "#new-request" in page.evaluate("window.fixture.navigation.at(-1)")
            if screen == "applications":
                expect(page.locator("article")).to_have_count(5)
                for status in ["Pending", "Approved", "Rejected", "Cancelled", "Closed"]:
                    expect(page.locator("article").get_by_text(status, exact=True)).to_have_count(1)
                expect(page.get_by_role("link", name="View application")).to_have_count(5)
                history_length = page.evaluate("history.length")
                page.get_by_role("button", name="Filter and sort applications", exact=True).click()
                page.get_by_role("button", name="Pending", exact=True).click()
                expect(page.locator("article")).to_have_count(1)
                expect(page.get_by_role("button", name="Pending", exact=True)).to_have_attribute("aria-pressed", "true")
                assert "applicationStatus=pending" in page.url
                assert page.evaluate("history.length") == history_length
                page.get_by_role("button", name="Pending", exact=True).click()
                expect(page.locator("article")).to_have_count(5)
                assert "applicationStatus" not in page.url
                page.get_by_role("button", name="Newest first", exact=True).click()
                assert page.locator("article h3").first.inner_text().endswith("5")
                page.get_by_role("button", name="Oldest first", exact=True).click()
                assert page.locator("article h3").first.inner_text().endswith("1")
                assert "applicationSort=oldest" in page.url
                assert page.evaluate("history.length") == history_length
                page.get_by_role("button", name="Done", exact=True).click()
                boxes = [page.locator("article").nth(index).bounding_box() for index in range(2)]
                if width >= 1280:
                    assert abs(boxes[0]["y"] - boxes[1]["y"]) < 2
                    assert boxes[1]["x"] > boxes[0]["x"]
                else:
                    assert boxes[1]["y"] > boxes[0]["y"]
            if screen == "detail":
                expect(page.get_by_role("button", name="View apartment details")).to_be_visible()
                expect(page.get_by_role("button", name="Request a Visit", exact=True)).to_be_visible()
                expect(page.get_by_text("Awaiting landlord review", exact=True)).to_have_count(1)
                image = page.locator(".tenant-application-details img").first
                image_box = image.bounding_box()
                assert image_box and abs(image_box["width"] / image_box["height"] - 1.6) < 0.03
                for label in ["Personal Information", "Rental Preferences", "Submitted Documents", "Application Status"]:
                    trigger = page.get_by_role("button", name=label, exact=True)
                    trigger.click()
                    expect(trigger).to_have_attribute("aria-expanded", "true")
                expect(page.get_by_text("Your application is being reviewed by the landlord.", exact=False)).to_be_visible()
                cancel = page.locator(".tenant-application-cancel")
                assert "button--outline" in cancel.get_attribute("class")
            if screen == "maintenance":
                expect(page.get_by_role("textbox", name="Issue Title")).to_be_visible()
                expect(page.get_by_text("Sunrise Apartment with a Long Readable Name", exact=True).first).to_be_visible()
                expect(page.get_by_text("Landlord: Local Owner", exact=True)).to_be_visible()
                expect(page.get_by_role("heading", name="Your requests")).to_have_count(1)
                expect(page.get_by_text("The leaking pipe was replaced.")).to_have_count(1)
                expect(page.get_by_text("Submitted · awaiting landlord response")).to_have_count(1)
            no_overflow(page)
            settle(page)
            page.screenshot(path=str(OUTPUT / f"{screen}-{width}.png"))
        print(f"PASS {width}px: My Rental entry, application cards/filter/sort, detail accordions and maintenance")

    page.set_viewport_size({"width": 393, "height": 900})
    load(page, "rental", "&case=none")
    expect(page.get_by_role("heading", name="Need a repair?")).to_have_count(0)
    load(page, "applications", "&empty=1")
    expect(page.locator("article")).to_have_count(0)
    load(page, "maintenance", "&case=none")
    expect(page.get_by_role("textbox", name="Issue Title")).to_have_count(0)
    expect(page.get_by_text("No current active rental", exact=True)).to_be_visible()
    expect(page.get_by_text("The leaking pipe was replaced.")).to_have_count(1)
    load(page, "maintenance", "&case=none&empty=1")
    expect(page.get_by_role("heading", name="No maintenance requests yet")).to_be_visible()
    expect(page.get_by_role("link", name="Request maintenance", exact=True)).to_have_count(0)
    load(page, "maintenance", "&empty=1")
    expect(page.get_by_role("link", name="Request maintenance", exact=True)).to_have_count(1)

    load(page, "maintenance", "&case=multiple")
    expect(page.get_by_role("textbox", name="Issue Title")).to_have_count(0)
    page.locator('[data-slot="select-trigger"]').click()
    page.get_by_role("option", name="Second Apartment", exact=False).click()
    expect(page.get_by_role("textbox", name="Issue Title")).to_be_visible()
    page.get_by_role("textbox", name="Issue Title").fill("Leaking kitchen pipe")
    page.locator('[data-slot="combo-box-trigger"]').click()
    page.get_by_role("option").first.click()
    page.get_by_role("textbox", name="Issue Description").fill("Water leaks beneath the sink whenever the tap runs.")
    page.get_by_text("Medium", exact=True).click()
    page.get_by_role("button", name="Submit Request", exact=True).click()
    page.wait_for_function("window.fixture.submissions.length === 1")
    submitted = page.evaluate("window.fixture.submissions[0]")
    assert submitted["tenancyId"].endswith("21") and submitted["apartmentId"].endswith("11")
    expect(page.get_by_role("textbox", name="Issue Title")).to_have_value("")
    print("PASS no-tenancy eligibility, retained history, empty states and explicit multi-rental selection/submission")

    for status in ["pending", "approved", "rescheduled", "rejected", "cancelled"]:
        load(page, "detail", f"&status=pending&visit={status}")
        expect(page.get_by_role("heading", name="Visit Request Details")).to_be_visible()
        expect(page.get_by_role("button", name="Request a Visit", exact=True)).to_have_count(0)
        expect(page.get_by_role("button", name="Request Again", exact=True)).to_have_count(1 if status in ["rejected", "cancelled"] else 0)
    load(page, "detail", "&status=approved&visit=cancelled")
    expect(page.get_by_role("button", name="Request Again", exact=True)).to_have_count(0)

    # Filter and sort are URL state, so a reload (and Back) restores them; the
    # commit keeps unrelated params and never grows the history stack.
    load(page, "applications", "&notifications=open")
    page.get_by_role("button", name="Filter and sort applications").click()
    page.get_by_role("button", name="Pending", exact=True).click()
    page.get_by_role("button", name="Oldest first", exact=True).click()
    page.get_by_role("button", name="Done", exact=True).click()
    assert "notifications=open" in page.url
    assert "applicationStatus=pending" in page.url and "applicationSort=oldest" in page.url
    page.reload()
    page.wait_for_function("window.fixture !== undefined")
    expect(page.locator("article")).to_have_count(1)
    page.get_by_role("button", name="Filter and sort applications").click()
    expect(page.get_by_role("button", name="Pending", exact=True)).to_have_attribute("aria-pressed", "true")
    expect(page.get_by_role("button", name="Oldest first", exact=True)).to_have_attribute("aria-pressed", "true")
    page.get_by_role("button", name="Done", exact=True).click()

    # The card carries a validated, canonical return target for the filtered list.
    card_link = page.get_by_role("link", name="View application for Sunrise Apartment with a Long Readable Name 1", exact=True)
    detail_href = card_link.get_attribute("href")
    assert detail_href == ("/tenant/applications/application-0?apartmentId=00000000-0000-4000-8000-000000000010"
                           "&from=%2Ftenant%2Fmy-rental%3FapplicationStatus%3Dpending%26applicationSort%3Doldest")
    card_link.click()
    assert page.evaluate("window.fixture.navigation.at(-1)") == detail_href
    marker = page.evaluate("JSON.parse(sessionStorage.getItem('apt-application-return:v1'))")
    assert marker["applicationId"] == "application-0"
    assert marker["href"] == "/tenant/my-rental?applicationStatus=pending&applicationSort=oldest"

    # Back uses real browser history only when this tab just opened the detail
    # page from the list; a direct visit pushes a safe internal fallback.
    load(page, "detail", "&status=pending")
    page.get_by_role("button", name="Back", exact=True).click()
    assert page.evaluate("window.fixture.navigation.at(-1)") == "back"
    page.evaluate("sessionStorage.clear()")
    load(page, "detail", "&status=pending")
    page.get_by_role("button", name="Back", exact=True).click()
    assert page.evaluate("window.fixture.navigation.at(-1)") == "/tenant/my-rental"
    load(page, "detail", "&status=pending&from=" + quote("https://evil.test/tenant/my-rental", safe=""))
    page.get_by_role("button", name="Back", exact=True).click()
    assert page.evaluate("window.fixture.navigation.at(-1)") == "/tenant/my-rental"
    load(page, "detail", "&status=pending&from=" + quote("/tenant/my-rental?applicationSort=oldest&applicationStatus=pending", safe=""))
    page.get_by_role("button", name="Back", exact=True).click()
    assert page.evaluate("window.fixture.navigation.at(-1)") == "/tenant/my-rental?applicationStatus=pending&applicationSort=oldest"

    # A list marker restores its scroll position once and is then consumed.
    page.evaluate("sessionStorage.clear()")
    page.evaluate("sessionStorage.setItem('apt-application-return:v1', JSON.stringify({applicationId:'application-0', href:'/tenant/my-rental', at: Date.now(), scrollY: 400}))")
    load(page, "applications")
    page.wait_for_function("window.scrollY === 400")
    assert page.evaluate("sessionStorage.getItem('apt-application-return:v1')") is None
    page.evaluate("window.scrollTo(0, 0)")

    # Cards and the detail hero keep a readable missing-image fallback.
    load(page, "applications", "&noimages=1")
    expect(page.locator("article")).to_have_count(5)
    assert page.locator("article img").count() == 0
    assert page.locator("article").first.locator("svg").count() >= 2
    load(page, "detail", "&status=pending&noimages=1")
    expect(page.get_by_text("No image", exact=True)).to_be_visible()

    page.evaluate("sessionStorage.clear()")
    load(page, "detail", "&status=pending&apartmentId=unrelated")
    page.get_by_role("button", name="View apartment details", exact=True).click()
    assert page.evaluate("window.fixture.navigation.at(-1)") == "/browse/00000000-0000-4000-8000-000000000010"
    cancel = page.locator(".tenant-application-cancel")
    cancel.click()
    dialog = page.get_by_role("dialog", name="Cancel this application?")
    expect(dialog).to_be_visible()
    assert page.evaluate("window.fixture.cancellations") == 0
    dialog.get_by_role("button", name="Keep application", exact=True).click()
    expect(dialog).not_to_be_visible()
    cancel.click()
    dialog.get_by_role("button", name="Cancel application", exact=True).click()
    expect(dialog.get_by_role("button", name="Cancelling…", exact=True)).to_be_disabled()
    assert page.evaluate("window.fixture.cancellations") == 1
    page.keyboard.press("Escape")
    expect(dialog).to_be_visible()
    assert page.evaluate("window.fixture.navigation.at(-1)") != "/tenant/my-rental"
    page.evaluate("window.fixture.resolveCancellation(false)")
    expect(dialog.get_by_role("button", name="Cancel application", exact=True)).to_be_enabled()
    expect(dialog).to_be_visible()
    dialog.get_by_role("button", name="Cancel application", exact=True).focus()
    page.keyboard.press("Enter")
    assert page.evaluate("window.fixture.cancellations") == 2
    page.evaluate("window.fixture.resolveCancellation(true)")
    page.wait_for_function("window.fixture.navigation.at(-1) === '/tenant/my-rental'")
    print("PASS visit status/retry rules, trusted listing destination, cancel confirmation, failed retry and confirmed-only navigation")

    for width in [320, 393, 768, 1280]:
        page.set_viewport_size({"width": width, "height": 900})
        for screen in ["rental", "applications", "detail", "maintenance"]:
            load(page, screen, "&dark=1&status=pending")
            no_overflow(page)
            page.screenshot(path=str(OUTPUT / f"{screen}-{width}-dark.png"))
    assert not errors, errors
    print("PASS dark theme at 320/393/768/1280 and no runtime errors; all data writes remained in the synthetic fixture")
    browser.close()
