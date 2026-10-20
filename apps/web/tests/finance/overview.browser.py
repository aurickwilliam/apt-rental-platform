"""Playwright component-fixture checks; no hosted auth/database access.

Run after build-fixture.mjs using webapp-testing/scripts/with_server.py.
FINANCE_BROWSER_URL defaults to http://127.0.0.1:4387.
"""
import os
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

BASE = os.environ.get("FINANCE_BROWSER_URL", "http://127.0.0.1:4387")
OUT = Path(os.environ["FINANCE_BROWSER_OUTPUT"])

with sync_playwright() as playwright:
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context(viewport={"width": 1280, "height": 1000})
    # Abort every external request. These checks cannot read/write hosted data.
    context.route("**/*", lambda route: route.continue_() if route.request.url.startswith(BASE) else route.abort())
    page = context.new_page()
    failures = []
    page.on("pageerror", lambda error: failures.append(str(error)))
    page.goto(BASE + "/?notifications=open&settings=security")
    page.wait_for_load_state("networkidle")
    page.screenshot(path=str(OUT / "overview-desktop.png"), full_page=True)
    expect(page.get_by_role("heading", name="Profit & planning", exact=True)).to_be_visible()
    expect(page.get_by_role("heading", name="Collected rent", exact=True)).to_be_visible()
    expect(page.get_by_role("button", name="Review budgets over their limits")).to_be_visible()
    summary = page.get_by_role("region", name="Earnings summary")
    expect(summary).to_contain_text("₱ 50,000")
    expect(summary).to_contain_text("Not calculated")
    expect(page.get_by_text("₱ 70,000", exact=True)).to_be_visible()
    # Cash receipts deliberately differ from billing-period collections.
    page.get_by_role("button", name="View breakdown & calculation").click()
    page.get_by_role("button", name="How these figures are calculated").click()
    guidelines = page.get_by_role("dialog", name="Profit & planning guidelines")
    expect(guidelines).to_contain_text("test funds")
    expect(guidelines).to_contain_text("not tax, accounting, legal or investment advice")
    guidelines.get_by_role("button", name="Got it").click()
    expect(page.get_by_role("button", name="How these figures are calculated")).to_be_focused()
    page.get_by_role("button", name="Hide breakdown").click()

    def filters():
        page.get_by_role("button", name="Filters", exact=False).first.click()
        return page.get_by_role("dialog", name="Filters", exact=True)

    dialog = filters()
    dialog.get_by_role("searchbox").fill("GARDEN")
    expect(dialog.get_by_role("button", name="Property: Garden Court")).to_be_visible()
    expect(dialog.get_by_role("button", name="Property: Bayview")).to_have_count(0)
    dialog.get_by_role("button", name="Property: Garden Court").click()
    dialog.get_by_role("tab", name="Month", exact=True).click()
    dialog.get_by_role("button", name="Month: September 2026", exact=False).click()
    expect(page.get_by_role("heading", name="All properties", exact=True)).to_be_visible()
    dialog.get_by_role("button", name="Cancel", exact=True).click()
    dialog = filters()
    expect(dialog.get_by_role("searchbox")).to_have_value("")
    expect(dialog.get_by_role("button", name="Property: All properties")).to_have_attribute("aria-pressed", "true")
    dialog.get_by_role("button", name="Property: Bayview").click()
    dialog.get_by_role("tab", name="Month", exact=True).click()
    dialog.get_by_role("button", name="Month: September 2026", exact=False).click()
    dialog.get_by_role("button", name="Apply filters").click()
    expect(page.get_by_role("heading", name="Bayview", exact=True)).to_be_visible()
    expect(summary).to_contain_text("September 2026")
    assert "notifications=open" in page.url and "settings=security" in page.url
    expect(summary).to_contain_text("₱ 9,000")
    page.go_back()
    expect(page.get_by_role("heading", name="All properties", exact=True)).to_be_visible()
    expect(summary).to_contain_text("₱ 50,000")

    # Failed indicators must not block choosing a month; Reset is draft-only.
    page.evaluate("financeTest.indicatorFail = true")
    dialog = filters()
    dialog.get_by_role("tab", name="Month", exact=True).click()
    expect(dialog.get_by_role("button", name="Retry rent indicators")).to_be_visible()
    expect(dialog.get_by_role("button", name="Month: September 2026, rent data unavailable")).to_be_enabled()
    page.evaluate("financeTest.indicatorFail = false")
    dialog.get_by_role("button", name="Retry rent indicators").click()
    expect(dialog.get_by_role("button", name="Month: October 2026, rent collected")).to_be_visible()
    dialog.get_by_role("button", name="Previous year").click()
    dialog.get_by_role("button", name="Previous year").click()
    expect(dialog.get_by_role("button", name="Month: October 2024, outside report range")).to_be_disabled()
    expect(dialog.get_by_role("button", name="Month: November 2024", exact=False)).to_be_enabled()
    dialog.get_by_role("button", name="Reset", exact=True).click()
    page.keyboard.press("Escape")
    expect(dialog).to_have_count(0)

    # Trend controls: six-month default, keyboard month selection, one series retained.
    expect(page.get_by_role("button", name="6M", exact=True)).to_have_attribute("aria-pressed", "true")
    page.get_by_role("button", name="Toggle collected").click()
    page.get_by_role("button", name="Toggle expenses").click()
    expect(page.get_by_role("button", name="Toggle expenses")).to_have_attribute("aria-pressed", "true")
    expect(page.get_by_role("button", name="Toggle net", exact=True)).to_be_disabled()
    page.get_by_role("button", name="3M", exact=True).click()
    month = page.get_by_role("button", name="Inspect August 2026")
    month.focus()
    page.keyboard.press("Enter")
    expect(page.get_by_role("region", name="Selected month details")).to_contain_text("August 2026")
    page.get_by_role("button", name="View expenses for this month").click()
    assert "month=2026-08" in page.url and "tab=expenses" in page.url
    page.get_by_role("tab", name="Overview", exact=True).click()
    dialog = filters()
    dialog.get_by_role("button", name="Reset", exact=True).click()
    dialog.get_by_role("button", name="Apply filters", exact=True).click()
    expect(summary).to_contain_text("October 2026")

    # Status tabs, correct amounts, paging errors retain rows and can retry.
    page.get_by_role("button", name="View overdue,", exact=False).click()
    ledger = page.get_by_role("dialog", name="Rent collections", exact=True)
    expect(ledger.get_by_role("grid")).to_be_visible()
    expect(ledger.get_by_role("grid")).to_contain_text("₱ 6,000")
    expect(ledger.get_by_role("grid")).to_contain_text("8–30 days late")
    page.evaluate("financeTest.ledgerFail = true")
    ledger.get_by_role("button", name="Load more", exact=True).click()
    expect(ledger.get_by_role("alert")).to_contain_text("Your loaded rows are still here")
    expect(ledger.get_by_role("grid")).to_contain_text("Tenant 0")
    page.evaluate("financeTest.ledgerFail = false")
    ledger.get_by_role("button", name="Load more", exact=True).click()
    expect(ledger.get_by_role("grid")).to_contain_text("Tenant 30")
    ledger.get_by_role("tab", name="Collected", exact=True).click()
    expect(ledger.get_by_role("grid")).to_contain_text("₱ 4,000")
    assert "/landlord/properties/" in ledger.get_by_role("link", name="Open property & tenancy", exact=False).first.get_attribute("href")
    page.set_viewport_size({"width": 390, "height": 900})
    expect(ledger.locator("article").first).to_be_visible()
    page.screenshot(path=str(OUT / "ledger-mobile.png"), full_page=True, animations="disabled")
    ledger.get_by_role("button", name="Close", exact=True).click()
    page.set_viewport_size({"width": 1280, "height": 1000})

    # Reserve action is preset and only writes on valid Save; errors keep draft.
    page.get_by_role("button", name="Plan an emergency reserve", exact=True).click()
    reserve = page.get_by_role("dialog", name="Plan a budget", exact=True)
    expect(reserve.get_by_role("button", name="Emergency reserve Category", exact=True)).to_be_visible()
    reserve.get_by_role("button", name="Save budget", exact=True).click()
    expect(reserve).to_contain_text("Enter zero or a positive amount")
    reserve.get_by_label("Planned allocation this month", exact=False).fill("1,500")
    page.evaluate("financeTest.budgetFail = true")
    reserve.get_by_role("button", name="Save budget", exact=True).click()
    expect(reserve.get_by_role("alert")).to_be_visible()
    page.evaluate("financeTest.budgetFail = false")
    reserve.get_by_role("button", name="Save budget", exact=True).click()
    expect(reserve).to_have_count(0)
    assert page.evaluate("financeTest.writes.at(-1).kind") == "reserve"
    assert page.evaluate("financeTest.writes.at(-1).category") == "emergency"
    assert page.evaluate("financeTest.writes.at(-1).target_amount") is None

    # Refresh failures retain same-scope content and retry clears the notice.
    page.evaluate("financeTest.reportFail = true")
    page.get_by_role("button", name="Refresh", exact=True).click()
    expect(page.get_by_role("alert")).to_contain_text("previous figures remain visible")
    expect(summary).to_contain_text("₱ 50,000")
    page.evaluate("financeTest.reportFail = false")
    page.get_by_role("button", name="Retry report").click()
    expect(page.get_by_role("alert")).to_have_count(0)

    # A failed new scope must never display old-scope amounts under new labels.
    dialog = filters()
    dialog.get_by_role("button", name="Property: Bayview").click()
    page.evaluate("financeTest.reportFail = true")
    dialog.get_by_role("button", name="Apply filters", exact=True).click()
    expect(page.get_by_role("heading", name="Couldn’t load your finances")).to_be_visible()
    expect(summary).to_have_count(0)
    page.evaluate("financeTest.reportFail = false")
    page.get_by_role("button", name="Try again", exact=True).click()
    expect(summary).to_contain_text("₱ 9,000")
    dialog = filters()
    dialog.get_by_role("button", name="Reset", exact=True).click()
    dialog.get_by_role("button", name="Apply filters", exact=True).click()
    expect(summary).to_contain_text("₱ 50,000")

    page.get_by_role("button", name="View all 4 properties").click()
    expect(page.get_by_role("heading", name="Property performance", exact=True).first).to_be_visible()
    page.get_by_role("button", name="Net income", exact=True).click()
    expect(page.get_by_role("button", name="Bayview, net, expenses not reviewed. Filter this property.")).to_be_visible()
    page.get_by_role("link", name="Back to report").click()

    # Review failure retains dialog; success enables net charts and negative labels.
    page.get_by_role("button", name="Review expenses to calculate income").click()
    page.get_by_role("button", name="Mark expenses reviewed").click()
    review = page.get_by_role("dialog", name="Confirm expenses are complete")
    expect(review).to_contain_text("all my properties")
    page.evaluate("financeTest.reviewFail = true")
    review.get_by_role("button", name="Confirm", exact=True).click()
    expect(review.get_by_role("alert")).to_be_visible()
    page.evaluate("financeTest.reviewFail = false")
    review.get_by_role("button", name="Confirm", exact=True).click()
    expect(review).to_have_count(0)
    page.get_by_role("tab", name="Overview", exact=True).click()
    expect(page.get_by_role("heading", name="Net operating income", exact=True)).to_be_visible()
    expect(page.get_by_role("button", name="Toggle net", exact=True)).to_be_enabled()
    page.get_by_role("button", name="Toggle net", exact=True).click()
    page.get_by_role("button", name="Net income", exact=True).click()
    expect(page.get_by_role("button", name="Bayview, net, −₱ 1,000. Filter this property.")).to_be_visible()

    for width in (390, 768, 1280):
        page.set_viewport_size({"width": width, "height": 900})
        # Exercise the chart controls at each width (not only desktop). Bringing
        # them into view also lets ResizeObserver layout settle before capture.
        page.get_by_role("button", name="6M", exact=True).click()
        expect(page.get_by_role("button", name="6M", exact=True)).to_be_visible()
        expect(page.get_by_role("button", name="Toggle collected")).to_be_visible()
        for dark in (False, True):
            page.evaluate("dark => document.documentElement.classList.toggle('dark', dark)", dark)
            page.screenshot(path=str(OUT / f"overview-{width}-{'dark' if dark else 'light'}.png"), full_page=True, animations="disabled")
            assert page.evaluate("document.documentElement.scrollWidth <= innerWidth"), f"Horizontal overflow at {width}"
    page.evaluate("financeTest.noActivity = financeTest.noBillable = financeTest.noPlans = true")
    page.get_by_role("button", name="Refresh", exact=True).click()
    expect(page.get_by_role("heading", name="No income activity yet")).to_be_visible()
    expect(page.get_by_role("heading", name="No billable tenancies this month")).to_be_visible()
    expect(page.get_by_role("heading", name="No plan for this month yet")).to_be_visible()
    expect(page.get_by_role("button", name="Overdue segment:", exact=False)).to_have_count(0)
    page.evaluate("financeTest.noProperties = true")
    page.get_by_role("button", name="Refresh", exact=True).click()
    expect(page.get_by_role("link", name="Create a property")).to_be_visible()
    expect(page.get_by_role("button", name="Filters", exact=False)).to_be_disabled()
    page.evaluate("financeTest.noProperties = financeTest.noActivity = financeTest.noBillable = financeTest.noPlans = false")
    page.get_by_role("button", name="Refresh", exact=True).click()
    expect(summary).to_be_visible()
    # Account switch while a request is pending cannot resurrect former rows/modal.
    page.evaluate("financeTest.delay = 300")
    page.get_by_role("button", name="Refresh", exact=True).click()
    page.get_by_role("button", name="Planning guidelines", exact=True).click()
    page.evaluate("financeTest.identity = {user: null, profile: null, loading: false}; dispatchEvent(new Event('fixture-identity'))")
    expect(page.get_by_role("heading", name="Finances unavailable")).to_be_visible()
    expect(page.get_by_role("dialog")).to_have_count(0)
    expect(page.get_by_role("region", name="Earnings summary")).to_have_count(0)
    page.wait_for_function("financeTest.pendingReads === 0")
    expect(page.get_by_role("region", name="Earnings summary")).to_have_count(0)
    assert not failures, failures
    browser.close()
    print("PASS: Overview filters, indicators, guidelines/focus, chart controls, ledger pagination/retry, reserve save, review, comparison, refresh retention, account loss, and 3 viewport × 2 theme layouts.")
