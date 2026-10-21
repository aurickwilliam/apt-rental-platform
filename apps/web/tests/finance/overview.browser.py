"""Playwright component-fixture checks; no hosted auth/database access.

Run after build-fixture.mjs using webapp-testing/scripts/with_server.py.
FINANCE_BROWSER_URL defaults to http://127.0.0.1:4387.
"""
import os
import re
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

BASE = os.environ.get("FINANCE_BROWSER_URL", "http://127.0.0.1:4387")
OUT = Path(os.environ["FINANCE_BROWSER_OUTPUT"])


def fixture_navigate(page, url):
    """The fixture replaces Next navigation with history changes (the Link and
    router shims both pushState), so direct entries follow the same in-app
    pushed-history path instead of asking the static server for the route."""
    page.evaluate(
        "u => { history.pushState(null, '', u); dispatchEvent(new PopStateEvent('popstate')); }",
        url,
    )


def set_date(page, scope, iso):
    """Types an ISO date into the HeroUI date field's month, day and year
    segments (en-US order); typing advances through the segments."""
    year, month, day = iso.split("-")
    scope.get_by_role("spinbutton", name=re.compile(r"^month")).click()
    page.keyboard.type(month + day + year)


def property_trigger_for(page):
    return page.get_by_role("button", name=re.compile(r"Property$"))


def wait_for_modal(page):
    """Wait until the open dialog is fully painted; HeroUI fades it in, and a
    capture taken mid-fade shows a washed-out dialog."""
    page.wait_for_function(
        """() => {
            const dialog = document.querySelector('[role=dialog]');
            if (!dialog) return false;
            for (let node = dialog; node; node = node.parentElement) {
                if (parseFloat(getComputedStyle(node).opacity) < 0.99) return false;
            }
            return true;
        }"""
    )

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
    expect(page.get_by_role("heading", name="Profit & Planning", exact=True)).to_be_visible()
    expect(page.get_by_role("heading", name="Collected rent", exact=True)).to_be_visible()
    expect(page.get_by_role("button", name="Review budgets over their limits")).to_be_visible()
    summary = page.get_by_role("region", name="Earnings summary")
    expect(summary).to_contain_text("₱ 50,000")
    # Layout: Add expense is the rightmost header action, the scope controls sit
    # left of the tabs, and the earnings summary shares the Income trends width
    # while Needs attention heads the right column.
    box = lambda locator: locator.bounding_box()
    guidelines_box = box(page.get_by_role("button", name="Guidelines", exact=True))
    add_box = box(page.get_by_role("button", name="Add expense", exact=True))
    assert add_box["x"] > guidelines_box["x"]
    assert add_box["x"] + add_box["width"] > guidelines_box["x"] + guidelines_box["width"]
    assert box(property_trigger_for(page))["x"] < box(page.get_by_role("tablist", name="Finance report tabs"))["x"]
    trends = page.get_by_role("heading", name="Income trends").locator("xpath=ancestor::*[contains(@class,'finance-card')][1]")
    assert abs(box(summary)["width"] - box(trends)["width"]) <= 1
    attention = page.get_by_role("heading", name="Needs attention").locator("xpath=ancestor::*[contains(@class,'finance-card')][1]")
    assert box(attention)["x"] > box(summary)["x"] + box(summary)["width"]
    assert abs(box(attention)["y"] - box(summary)["y"]) <= 1
    expect(page.get_by_label("4 open items")).to_be_visible()
    expect(summary).to_contain_text("Not calculated")
    expect(page.get_by_text("₱ 70,000", exact=True)).to_be_visible()
    # Cash receipts deliberately differ from billing-period collections.
    page.get_by_role("button", name="View breakdown & calculation").click()
    breakdown = page.get_by_role("dialog", name="Breakdown & calculation")
    expect(breakdown).to_contain_text("Recorded operating expenses")
    expect(breakdown).to_contain_text("Planned reserves (not spent)")
    expect(summary).not_to_contain_text("Recorded operating expenses")
    breakdown.get_by_role("link", name="How these figures are calculated").click()
    guidelines = page.get_by_role("dialog", name="Profit & planning guidelines")
    expect(guidelines).to_contain_text("test funds")
    expect(guidelines).to_contain_text("not tax, accounting, legal or investment advice")
    guidelines.get_by_role("button", name="Close profit & planning guidelines").click()
    expect(page.get_by_role("dialog")).to_have_count(0)
    # The breakdown closes from its X, returning focus to its button.
    page.get_by_role("button", name="View breakdown & calculation").click()
    page.get_by_role("button", name="Close breakdown & calculation").click()
    expect(page.get_by_role("button", name="View breakdown & calculation")).to_be_focused()

    def property_trigger():
        # The select's accessible name is its value followed by its label.
        return page.get_by_role("button", name=re.compile(r"Property$"))

    def month_trigger():
        return page.get_by_role("button", name=re.compile(r"^Report month:"))

    def choose_property(name):
        property_trigger().click()
        page.get_by_role("option", name=name, exact=True).click()

    def open_months():
        month_trigger().click()
        return page.get_by_role("dialog", name="Choose report month", exact=True)

    # The header Guidelines button opens the same dialog and takes focus back.
    page.get_by_role("button", name="Guidelines", exact=True).click()
    header_guidelines = page.get_by_role("dialog", name="Profit & planning guidelines")
    expect(header_guidelines).to_be_visible()
    header_guidelines.get_by_role("button", name="Close profit & planning guidelines").click()
    expect(page.get_by_role("button", name="Guidelines", exact=True)).to_be_focused()

    # Scope controls apply at once and live in the URL, beside other params.
    property_trigger().click()
    expect(page.get_by_role("option", name="Garden Court", exact=True)).to_be_visible()
    page.get_by_role("option", name="Bayview", exact=True).click()
    expect(property_trigger()).to_contain_text("Bayview")
    expect(summary).to_contain_text("₱ 9,000")
    assert "notifications=open" in page.url and "settings=security" in page.url
    open_months().get_by_role("button", name="Month: September 2026", exact=False).click()
    expect(month_trigger()).to_have_attribute("aria-label", "Report month: September 2026")
    expect(summary).to_contain_text("September 2026")
    page.go_back()
    expect(month_trigger()).to_have_attribute("aria-label", "Report month: October 2026")
    page.go_back()
    expect(property_trigger()).to_contain_text("All properties")
    expect(summary).to_contain_text("₱ 50,000")

    # Failed indicators must not block choosing a month.
    page.evaluate("financeTest.indicatorFail = true")
    months = open_months()
    expect(months.get_by_role("button", name="Retry rent indicators")).to_be_visible()
    expect(months.get_by_role("button", name="Month: September 2026, rent data unavailable")).to_be_enabled()
    page.evaluate("financeTest.indicatorFail = false")
    months.get_by_role("button", name="Retry rent indicators").click()
    expect(months.get_by_role("button", name="Month: October 2026, rent collected")).to_be_visible()
    months.get_by_role("button", name="Previous year").click()
    months.get_by_role("button", name="Previous year").click()
    expect(months.get_by_role("button", name="Month: October 2024, outside report range")).to_be_disabled()
    expect(months.get_by_role("button", name="Month: November 2024", exact=False)).to_be_enabled()
    # Disabling the year stepper drops its focus; Escape needs focus inside.
    months.get_by_role("button", name="Month: November 2024", exact=False).focus()
    page.keyboard.press("Escape")
    expect(months).to_have_count(0)

    # Trend controls: six-month default, keyboard month selection, one series retained.
    expect(page.get_by_role("button", name="6M", exact=True)).to_have_attribute("aria-pressed", "true")
    page.get_by_role("button", name="Toggle collected").click()
    page.get_by_role("button", name="Toggle expenses").click()
    expect(page.get_by_role("button", name="Toggle expenses")).to_have_attribute("aria-pressed", "true")
    expect(page.get_by_role("button", name="Toggle net", exact=True)).to_be_disabled()
    page.get_by_role("button", name="3M", exact=True).click()
    # The chart is the month picker: arrow keys move the selection, a click on
    # a bar selects that month, and the month row below the chart is gone.
    expect(page.get_by_role("button", name="Inspect August 2026")).to_have_count(0)
    chart = page.get_by_role("group", name="Income chart", exact=False)
    expect(chart).to_have_css("cursor", "pointer")
    chart.focus()
    page.keyboard.press("ArrowLeft")
    page.keyboard.press("ArrowLeft")
    details = page.get_by_role("region", name="Selected month details")
    expect(details).to_contain_text("August 2026")
    page.keyboard.press("End")
    expect(details).to_contain_text("October 2026")
    box_ = chart.bounding_box()
    page.mouse.click(box_["x"] + box_["width"] * 0.55, box_["y"] + box_["height"] * 0.5)
    expect(details).not_to_contain_text("October 2026")
    page.keyboard.press("Home")
    page.keyboard.press("ArrowRight")
    expect(details).to_contain_text("September 2026")
    page.keyboard.press("ArrowLeft")
    expect(details).to_contain_text("August 2026")
    page.get_by_role("button", name="View expenses for this month").click()
    assert "month=2026-08" in page.url and "tab=expenses" in page.url
    page.get_by_role("tab", name="Overview", exact=True).click()
    open_months().get_by_role("button", name="Month: October 2026", exact=False).click()
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
    page.get_by_role("button", name="Plan an emergency reserve").click()
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

    # The Refresh button swaps the report for placeholders until it settles.
    page.evaluate("financeTest.delay = 400")
    page.get_by_role("button", name="Refresh", exact=True).click()
    expect(page.get_by_role("status", name="Loading finance report")).to_be_visible()
    expect(summary).to_contain_text("₱ 50,000")
    expect(page.get_by_role("status", name="Loading finance report")).to_have_count(0)
    page.evaluate("financeTest.delay = 30")

    # Refresh failures retain same-scope content and retry clears the notice.
    # The budget toast also carries an alert role, so the banner is matched
    # first and its retry button marks a cleared state.
    page.evaluate("financeTest.reportFail = true")
    page.get_by_role("button", name="Refresh", exact=True).click()
    expect(page.get_by_role("alert").first).to_contain_text("previous figures remain visible")
    expect(summary).to_contain_text("₱ 50,000")
    page.evaluate("financeTest.reportFail = false")
    page.get_by_role("button", name="Retry report").click()
    expect(page.get_by_role("button", name="Retry report")).to_have_count(0)

    # A failed new scope must never display old-scope amounts under new labels.
    page.evaluate("financeTest.reportFail = true")
    choose_property("Bayview")
    expect(page.get_by_role("heading", name="Couldn’t load your finances")).to_be_visible()
    expect(summary).to_have_count(0)
    page.evaluate("financeTest.reportFail = false")
    page.get_by_role("button", name="Try again", exact=True).click()
    expect(summary).to_contain_text("₱ 9,000")
    choose_property("All properties")
    expect(summary).to_contain_text("₱ 50,000")

    # The property table sorts by column and a row focuses the whole report.
    performance = page.get_by_role("grid", name="Property performance")
    expect(performance.get_by_role("row")).to_have_count(4)
    performance.get_by_role("columnheader", name="Expenses").click()
    expect(performance.get_by_role("row").nth(1)).to_contain_text("River Place")
    performance.get_by_role("columnheader", name="Expenses").click()
    expect(performance.get_by_role("row").nth(1)).to_contain_text("Bayview")
    performance.get_by_role("row", name="Bayview", exact=False).click()
    expect(property_trigger()).to_contain_text("Bayview")
    expect(summary).to_contain_text("₱ 9,000")
    choose_property("All properties")
    expect(summary).to_contain_text("₱ 50,000")

    page.get_by_role("button", name="View all 4 properties").click()
    expect(page.get_by_role("heading", name="Property performance", exact=True).first).to_be_visible()
    full_table = page.get_by_role("grid", name="Property performance")
    full_table.get_by_role("columnheader", name="Net income").click()
    expect(full_table.get_by_role("row", name="Bayview", exact=False)).to_contain_text("Not reviewed")
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
    expect(
        page.get_by_role("grid", name="Property performance").get_by_role("row", name="Bayview", exact=False)
    ).to_contain_text("−₱ 1,000")

    # Expenses tab: review card mirrors the shared copy; category bars open
    # the drill-down route for the applied scope.
    page.get_by_role("tab", name="Expenses", exact=True).click()
    expect(page.get_by_role("heading", name="Expenses reviewed", exact=True)).to_be_visible()
    # The month's transactions sit beside the category bars, paged by keyset.
    transactions = page.get_by_role("grid", name="Expense transactions")
    expect(transactions).to_contain_text("Turnover repaint")
    expect(transactions).to_contain_text("Garden Court · Improvement / replacement")
    expect(transactions).not_to_contain_text("Kitchen sink repair")
    page.get_by_role("button", name="Load more expenses", exact=True).click()
    expect(transactions).to_contain_text("Kitchen sink repair")
    with page.expect_download() as download:
        page.get_by_role("button", name="Export CSV").click()
    assert download.value.suggested_filename == "expenses-2026-10-all-properties.csv"
    csv = Path(download.value.path()).read_text(encoding="utf-8-sig")
    assert csv.splitlines()[0] == "Paid,Property,Category,Treatment,Description,Amount"
    assert "Kitchen sink repair" in csv and "4000.00" in csv
    # The category filter narrows the list on the server and empties cleanly.
    page.evaluate("financeTest.delay = 600")
    page.get_by_role("button", name=re.compile(r"Category$")).click()
    page.get_by_role("option", name="Insurance", exact=True).click()
    # While the filter loads, the table keeps its header and shows skeleton rows.
    loading_table = page.get_by_role("grid", name="Loading expenses")
    expect(loading_table).to_be_visible()
    expect(loading_table.get_by_role("columnheader", name="Description")).to_be_visible()
    expect(loading_table).not_to_contain_text("Turnover repaint")
    page.evaluate("financeTest.delay = 30")
    expect(page.get_by_role("heading", name="No expenses in this category")).to_be_visible()
    expect(page.get_by_role("button", name="Export CSV")).to_be_disabled()
    page.get_by_role("button", name=re.compile(r"Category$")).click()
    page.get_by_role("option", name="All categories", exact=True).click()
    expect(page.get_by_role("grid", name="Expense transactions")).to_contain_text("Turnover repaint")
    # A row opens the same drawer as the drill-down; Cancel keeps the row.
    page.get_by_role("row", name="Turnover repaint", exact=False).click()
    row_editor = page.get_by_role("dialog", name="Edit expense", exact=True)
    expect(row_editor).to_be_visible()
    row_editor.get_by_role("button", name="Cancel", exact=True).click()
    expect(row_editor).to_have_count(0)
    bar = page.get_by_role("button", name="Maintenance & repairs, ₱ 14,500, 100 percent").first
    expect(bar).to_be_visible()
    expect(bar).to_contain_text("Previous comparable period:")
    bar.click()
    assert "category=maintenance" in page.url and "month=2026-10" in page.url
    assert "/landlord/analytics/category-expenses" in page.url
    expect(page.get_by_role("heading", name="Maintenance & repairs", exact=True)).to_be_visible()
    expect(property_trigger()).to_contain_text("All properties")
    expect(month_trigger()).to_have_attribute("aria-label", "Report month: October 2026")
    # The page is a table beside category summary cards, not stacked cards.
    expect(page.get_by_role("grid", name="Expense transactions")).to_be_visible()
    total = page.get_by_role("region", name="Category total")
    expect(total).to_contain_text("₱ 14,500")
    expect(total).to_contain_text("Previous comparable period")
    expect(page.get_by_role("heading", name="Other categories")).to_have_count(0)
    page.evaluate("financeTest.extraCategory = true")
    page.get_by_role("button", name="Refresh", exact=True).click()
    others = page.get_by_role("heading", name="Other categories").locator("xpath=ancestor::*[contains(@class,'finance-card')][1]")
    expect(others).to_contain_text("Turnover & refurbishment")
    expect(others).to_contain_text("₱ 3,000")
    others.get_by_role("link", name="Turnover & refurbishment", exact=False).click()
    assert "category=turnover" in page.url
    expect(page.get_by_role("heading", name="Turnover & refurbishment", exact=True)).to_be_visible()
    page.evaluate("financeTest.extraCategory = false")
    page.go_back()
    page.get_by_role("button", name="Refresh", exact=True).click()
    expect(page.get_by_role("heading", name="Other categories")).to_have_count(0)
    # Keyset pages: seeded page size is 2, so Load more trails the cursor.
    expect(page.get_by_text("Turnover repaint", exact=True)).to_be_visible()
    expect(page.get_by_text("Repaint gate", exact=True)).to_be_visible()
    expect(page.get_by_text("Kitchen sink repair")).to_have_count(0)
    page.get_by_role("button", name="Load more expenses", exact=True).click()
    expect(page.get_by_text("Kitchen sink repair", exact=True)).to_be_visible()
    # Cross-property rows name the property; scoped lists do not repeat it.
    expect(page.get_by_text("Bayview · Operating").first).to_be_visible()

    # Editor validation keeps the draft; save refreshes the visible list.
    page.get_by_role("row", name="Kitchen sink repair", exact=False).click()
    editor = page.get_by_role("dialog", name="Edit expense", exact=True)
    expect(editor.get_by_role("button", name="Property")).to_be_disabled()
    editor.get_by_label("Amount (₱)", exact=False).fill("0")
    editor.get_by_role("button", name="Save expense", exact=True).click()
    expect(editor.get_by_text("Enter a positive amount with at most two decimals.")).to_be_visible()
    # Clearing a controlled input with an empty fill can be swallowed by
    # React's value tracker, so the field is emptied with real key events.
    description = editor.get_by_label("Description", exact=False)
    description.click()
    description.press("ControlOrMeta+a")
    description.press("Backspace")
    expect(description).to_have_value("")
    editor.get_by_role("button", name="Save expense", exact=True).click()
    expect(editor.get_by_text("Describe this expense.")).to_be_visible()
    page.evaluate("financeTest.expenseFail = true")
    editor.get_by_label("Description", exact=False).fill("Kitchen sink repair")
    editor.get_by_label("Amount (₱)", exact=False).fill("2,650")
    editor.get_by_role("button", name="Save expense", exact=True).click()
    expect(editor.get_by_role("alert")).to_be_visible()
    page.evaluate("financeTest.expenseFail = false")
    editor.get_by_role("button", name="Save expense", exact=True).click()
    expect(editor).to_have_count(0)
    assert page.evaluate("financeTest.writes.at(-1).editing") is True
    assert page.evaluate("financeTest.writes.at(-1).amount") == 2650
    expect(page.get_by_text("Expense saved")).to_be_visible()
    # A save refreshes the list through its own handle — the fresh page one
    # starts the keyset again, so the edited trailing row returns via Load more.
    page.get_by_role("button", name="Load more expenses", exact=True).click()
    expect(page.get_by_text("Kitchen sink repair", exact=True)).to_be_visible()
    expect(page.get_by_text("₱ 2,650", exact=True).first).to_be_visible()

    # Two-step delete reopens the reviewed month: income goes back to Not
    # calculated and the review action reappears after deletion.
    page.get_by_role("row", name="Kitchen sink repair", exact=False).click()
    editor = page.get_by_role("dialog", name="Edit expense", exact=True)
    editor.get_by_role("button", name="Delete expense", exact=True).click()
    expect(editor.get_by_text("Delete this expense?")).to_be_visible()
    editor.get_by_role("button", name="Confirm delete", exact=True).click()
    expect(editor).to_have_count(0)
    expect(page.get_by_text("Kitchen sink repair")).to_have_count(0)
    page.get_by_role("link", name="Back to report").click()
    page.get_by_role("tab", name="Overview", exact=True).click()
    expect(summary).to_contain_text("Not calculated")
    page.get_by_role("button", name="Review expenses to calculate income").click()
    page.get_by_role("button", name="Mark expenses reviewed").click()
    page.get_by_role("dialog", name="Confirm expenses are complete").get_by_role("button", name="Confirm", exact=True).click()
    expect(page.get_by_role("dialog", name="Confirm expenses are complete")).to_have_count(0)

    # A created expense then moved to September reopens both months and the
    # row lands only in the destination month.
    assert page.evaluate("financeTest.reviewedMonths.includes(\'2026-10\')") is True
    page.get_by_role("button", name="Add expense", exact=True).click()
    editor = page.get_by_role("dialog", name="Add expense", exact=True)
    editor.get_by_label("Amount (₱)", exact=False).fill("2,750")
    # The calendar popover picks a day into the field; the field stays typeable.
    editor.get_by_role("button", name="Calendar").click()
    page.get_by_role("gridcell").filter(has_text=re.compile(r"^14$")).first.click()
    expect(editor.get_by_role("spinbutton", name=re.compile(r"^day"))).to_have_text("14")
    set_date(page, editor, "2026-10-19")
    editor.get_by_role("button", name="Save expense", exact=True).click()
    expect(editor.get_by_text("Describe this expense.")).to_be_visible()
    editor.get_by_placeholder("e.g. Kitchen sink repair").fill("Plumbing permit")
    editor.get_by_role("button", name="Save expense", exact=True).click()
    expect(editor).to_have_count(0)
    write = page.evaluate("financeTest.writes.at(-1)")
    assert write["spent_on"] == "2026-10-19" and write["category"] == "maintenance"
    page.get_by_role("tab", name="Expenses", exact=True).click()
    page.get_by_role("button", name="Maintenance & repairs, ₱ 14,500, 100 percent").first.click()
    expect(page.get_by_text("Plumbing permit", exact=True)).to_be_visible()
    page.get_by_role("row", name="Plumbing permit", exact=False).click()
    editor = page.get_by_role("dialog", name="Edit expense", exact=True)
    set_date(page, editor, "2026-09-28")
    editor.get_by_role("button", name="Save expense", exact=True).click()
    expect(editor).to_have_count(0)
    assert page.evaluate("financeTest.writes.at(-1).spent_on") == "2026-09-28"
    expect(page.get_by_text("Plumbing permit")).to_have_count(0)
    assert page.evaluate("financeTest.reviewedMonths.includes(\'2026-10\')") is False
    assert page.evaluate("financeTest.reviewedMonths.includes(\'2026-09\')") is False
    page.get_by_role("link", name="Back to report").click()
    page.get_by_role("tab", name="Overview", exact=True).click()
    expect(summary).to_contain_text("Not calculated")
    # The moved row is selectable in its destination month.
    fixture_navigate(page, "/landlord/analytics/category-expenses?month=2026-09&category=maintenance")
    expect(page.get_by_text("Plumbing permit", exact=True)).to_be_visible()
    expect(page.get_by_text("September tiling", exact=True)).to_be_visible()

    # List failure can retry while shown rows keep their place; the trail
    # exhausts when the keyset page is complete.
    page.evaluate("financeTest.expenseFail = true")
    page.get_by_role("button", name="Refresh", exact=True).click()
    expect(page.get_by_role("button", name="Retry", exact=True)).to_be_visible()
    expect(page.get_by_text("September tiling", exact=True)).to_be_visible()
    page.evaluate("financeTest.expenseFail = false")
    page.get_by_role("button", name="Retry", exact=True).click()
    expect(page.get_by_text("September tiling", exact=True)).to_be_visible()
    page.get_by_role("button", name="Load more expenses", exact=True).click()
    expect(page.get_by_role("button", name="Load more expenses")).to_have_count(0)

    # A category with no rows shows the empty state under its category title.
    fixture_navigate(page, "/landlord/analytics/category-expenses?month=2026-10&category=insurance")
    expect(page.get_by_role("heading", name="Insurance", exact=True)).to_be_visible()
    expect(page.get_by_role("heading", name="No expenses in this category")).to_be_visible()
    expect(page.get_by_text("Nothing recorded in October 2026")).to_be_visible()

    # Bars follow the report: an expense-less month shows the shared empty card.
    page.evaluate("financeTest.noExpenses = true")
    fixture_navigate(page, "/landlord/analytics?month=2026-10")
    page.get_by_role("tab", name="Expenses", exact=True).click()
    expect(page.get_by_role("heading", name="No expenses recorded")).to_be_visible()
    page.evaluate("financeTest.noExpenses = false")
    page.get_by_role("button", name="Refresh", exact=True).click()
    expect(page.get_by_role("heading", name="Where expenses go")).to_be_visible()
    page.get_by_role("tab", name="Overview", exact=True).click()

    # Budget tab: spending limits against actual spending, planned reserves
    # kept apart, and transparent suggestions.
    page.get_by_role("tab", name="Budget", exact=True).click()
    expect(page.get_by_role("heading", name="Budget versus actual")).to_be_visible()
    expect(page.get_by_role("heading", name="Planned reserves")).to_be_visible()
    # The header action follows the tab and opens the plan drawer.
    page.get_by_role("button", name="Add budget", exact=True).click()
    new_plan = page.get_by_role("dialog", name="Plan a budget", exact=True)
    expect(new_plan).to_be_visible()
    new_plan.get_by_role("button", name="Cancel", exact=True).click()
    expect(new_plan).to_have_count(0)
    expect(page.get_by_role("button", name="Add budget", exact=True)).to_be_focused()
    # The right column is Budget versus actual as one tinted card per category
    # (no table, no Needs attention, no suggestions card); reserves stay on the left.
    # Each Add says what it creates: a spending limit or a reserve.
    page.get_by_role("button", name="Add spending limit").click()
    spending_plan = page.get_by_role("dialog", name="Plan a budget", exact=True)
    expect(spending_plan.get_by_role("button", name="Spending budget Plan type", exact=False)).to_be_visible()
    spending_plan.get_by_role("button", name="Cancel", exact=True).click()
    page.get_by_role("button", name="Add reserve").click()
    reserve_plan = page.get_by_role("dialog", name="Plan a budget", exact=True)
    expect(reserve_plan.get_by_role("button", name="Emergency reserve Category", exact=True)).to_be_visible()
    reserve_plan.get_by_role("button", name="Cancel", exact=True).click()
    expect(page.get_by_role("heading", name="Needs attention")).to_have_count(0)
    expect(page.get_by_role("heading", name="Budget suggestions")).to_have_count(0)
    expect(page.get_by_role("button", name="Set a goal")).to_have_count(0)
    expect(page.get_by_role("grid", name="Spending limits")).to_have_count(0)
    # The group hides the single over-limit plan: 4,200 spent of 13,000.
    spending_row = page.get_by_role(
        "button",
        name="Maintenance & repairs, 2 properties. Spent ₱ 4,200 of ₱ 13,000. Within budget. View properties",
    )
    expect(spending_row).to_be_visible()
    expect(spending_row).to_contain_text("32% used")
    expect(spending_row).to_contain_text("₱ 8,800 remaining")
    assert spending_row.get_attribute("data-finance-category") == "maintenance"
    # A zero limit shows no percentage and an empty bar.
    zero_row = page.get_by_role(
        "button",
        name="Owner-paid utilities & dues, Garden Court. Spent ₱ 0 of ₱ 0. Within budget. View properties",
    )
    expect(zero_row).to_contain_text("₱ 0 remaining")
    expect(zero_row).not_to_contain_text("% used")
    # Reserves stay their own tinted cards and never mix with spending limits.
    reserve_row = page.get_by_role(
        "button",
        name="Emergency reserve. For 1 property this month. Planned ₱ 1,500. View properties",
    )
    expect(reserve_row).to_be_visible()
    expect(reserve_row).to_contain_text("For 1 property this month")
    expect(reserve_row).not_to_contain_text("planned this month")
    assert reserve_row.get_attribute("data-finance-category") == "emergency"
    expect(page.get_by_role("grid", name="Planned reserves")).to_have_count(0)
    spending_row = page.get_by_role(
        "button",
        name="Maintenance & repairs, 2 properties. Spent ₱ 4,200 of ₱ 13,000. Within budget. View properties",
    )

    # The category drill-down lists each property's own limit and spending.
    spending_row.click()
    assert "/landlord/analytics/budget-category" in page.url
    assert "category=maintenance" in page.url and "kind=expense" in page.url
    expect(page.get_by_role("heading", name="Maintenance & repairs", exact=True)).to_be_visible()
    expect(page.get_by_text("Spending limits · October 2026")).to_be_visible()
    over_row = page.get_by_role(
        "button",
        name="Bayview, spent this month. Spent ₱ 4,200 of ₱ 3,000. Over budget. Edit budget",
    )
    expect(over_row).to_be_visible()
    expect(over_row).to_contain_text("₱ 1,200 over budget")
    expect(over_row).to_contain_text("140% used")
    expect(
        page.get_by_role(
            "button",
            name="Canal House, spent this month. Spent ₱ 0 of ₱ 10,000. Within budget. Edit budget",
        )
    ).to_be_visible()

    # Editing locks the plan's identity fields.
    over_row.click()
    editor = page.get_by_role("dialog", name="Edit budget", exact=True)
    expect(editor.get_by_role("button", name="Property")).to_be_disabled()
    expect(editor.get_by_role("button", name="Plan type")).to_be_disabled()
    expect(editor.get_by_role("button", name="Category")).to_be_disabled()
    expect(editor.get_by_text("Property, plan type, category and month are locked")).to_be_visible()
    # "Calculate from a goal" opens its own modal over the drawer; its edits are
    # a draft that closing discards, and only "Use suggested amount" applies.
    goal_button = editor.get_by_role("button", name="Calculate from a goal")
    goal_button.click()
    goal_modal = page.get_by_role("dialog", name="Calculate from a goal", exact=True)
    expect(goal_modal.get_by_role("button", name="Use suggested amount")).to_be_disabled()
    goal_modal.get_by_label("Amount still needed or annual bill", exact=False).fill("12,000")
    goal_modal.get_by_label("Months to spread this amount over", exact=False).fill("0")
    expect(goal_modal.get_by_text("Enter a whole number from 1 to 600.")).to_be_visible()
    expect(goal_modal.get_by_role("button", name="Use suggested amount")).to_be_disabled()
    goal_modal.get_by_label("Months to spread this amount over", exact=False).fill("12")
    expect(goal_modal.get_by_text("Suggested: ₱ 1,000 / month")).to_be_visible()
    page.keyboard.press("Escape")
    expect(goal_modal).to_have_count(0)
    expect(editor.get_by_text("Goal:")).to_have_count(0)
    expect(editor.get_by_label("Monthly spending limit", exact=False)).to_have_value("₱ 3,000")
    goal_button.click()
    goal_modal = page.get_by_role("dialog", name="Calculate from a goal", exact=True)
    expect(goal_modal.get_by_label("Amount still needed or annual bill", exact=False)).to_have_value("")
    goal_modal.get_by_label("Amount still needed or annual bill", exact=False).fill("12,000")
    goal_modal.get_by_label("Months to spread this amount over", exact=False).fill("12")
    goal_modal.get_by_role("button", name="Use suggested amount").click()
    expect(goal_modal).to_have_count(0)
    expect(editor.get_by_text("Goal: ₱ 12,000 over 12 months")).to_be_visible()
    expect(editor.get_by_label("Monthly spending limit", exact=False)).to_have_value("₱ 1,000")
    editor.get_by_role("button", name="Save budget", exact=True).click()
    expect(editor).to_have_count(0)
    write = page.evaluate("financeTest.writes.at(-1)")
    assert write["target_amount"] == 12000 and write["months_remaining"] == 12
    assert write["amount"] == 1000
    # Saving the same plan again updates it instead of adding a second row.
    page.get_by_role(
        "button",
        name="Bayview, spent this month. Spent ₱ 4,200 of ₱ 3,000. Over budget. Edit budget",
    ).click()
    editor = page.get_by_role("dialog", name="Edit budget", exact=True)
    editor.get_by_label("Monthly spending limit", exact=False).fill("3,500")
    editor.get_by_role("button", name="Save budget", exact=True).click()
    expect(editor).to_have_count(0)
    assert (
        page.evaluate(
            "financeTest.budgets.filter((row) => row.id === 'budget-a').length"
        )
        == 1
    )
    assert (
        page.evaluate("financeTest.budgets.find((row) => row.id === 'budget-a').amount")
        == 3500
    )
    assert page.evaluate("financeTest.writes.at(-1).amount") == 3500

    page.get_by_role("link", name="Back to budgets").click()
    page.get_by_role("tab", name="Budget", exact=True).click()
    expect(
        page.get_by_role("button", name="Maintenance & repairs, 2 properties", exact=False)
    ).to_contain_text("₱ 13,500")

    # Removing a plan takes two steps and disappears from the list.
    page.get_by_role(
        "button",
        name="Maintenance & repairs, 2 properties. Spent ₱ 4,200 of ₱ 13,500. Within budget. View properties",
    ).click()
    page.get_by_role(
        "button",
        name="Canal House, spent this month. Spent ₱ 0 of ₱ 10,000. Within budget. Edit budget",
    ).click()
    editor = page.get_by_role("dialog", name="Edit budget", exact=True)
    editor.get_by_role("button", name="Remove budget", exact=True).click()
    expect(editor.get_by_text("Remove this plan?")).to_be_visible()
    editor.get_by_role("button", name="Confirm remove budget", exact=True).click()
    expect(editor).to_have_count(0)
    expect(
        page.get_by_role(
            "button",
            name="Canal House, spent this month. Spent ₱ 0 of ₱ 10,000. Within budget. Edit budget",
        )
    ).to_have_count(0)

    # A reserve plan keeps its own drill-down and its planned amount.
    page.get_by_role("link", name="Back to budgets").click()
    page.get_by_role("tab", name="Budget", exact=True).click()
    page.get_by_role(
        "button",
        name="Emergency reserve. For 1 property this month. Planned ₱ 1,500. View properties",
    ).click()
    assert "kind=reserve" in page.url
    expect(page.get_by_text("Planned reserves · October 2026")).to_be_visible()
    expect(
        page.get_by_role(
            "button",
            name="Bayview, planned ₱ 1,500 this month. Edit budget",
        )
    ).to_be_visible()
    page.get_by_role("link", name="Back to budgets").click()

    # An unknown category reads as a missing category, and an unknown kind
    # falls back to spending limits.
    fixture_navigate(page, "/landlord/analytics/budget-category?month=2026-10&category=junk&kind=expense")
    expect(page.get_by_role("heading", name="Budget category not found")).to_be_visible()
    fixture_navigate(page, "/landlord/analytics/budget-category?month=2026-10&category=maintenance&kind=junk")
    expect(page.get_by_text("Spending limits · October 2026")).to_be_visible()

    # A month without plans shows both empty states.
    page.evaluate("financeTest.noPlans = true")
    fixture_navigate(page, "/landlord/analytics?month=2026-10")
    page.get_by_role("tab", name="Budget", exact=True).click()
    expect(page.get_by_role("heading", name="No spending limits yet")).to_be_visible()
    expect(page.get_by_role("heading", name="No reserve goals yet")).to_be_visible()
    page.evaluate("financeTest.noPlans = false")
    page.get_by_role("button", name="Refresh", exact=True).click()
    expect(page.get_by_role("heading", name="Budget versus actual")).to_be_visible()
    page.get_by_role("tab", name="Overview", exact=True).click()

    # Below the desktop breakpoint the columns stack with Needs attention first.
    page.set_viewport_size({"width": 390, "height": 900})
    assert box(attention)["y"] < box(summary)["y"]
    page.set_viewport_size({"width": 1280, "height": 900})
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

    # Read cache on: the Expenses list is prefetched with the report, and a
    # revisited tab or scope paints from cache while the network is still slow.
    page.evaluate("financeTest.cache.enable()")
    # Enabling empties the cache, so visit another month first; October then
    # loads for real, caches its report and prefetches its first expenses page.
    fixture_navigate(page, "/landlord/analytics?month=2026-08")
    expect(month_trigger()).to_have_attribute("aria-label", "Report month: August 2026")
    page.wait_for_function("financeTest.pendingReads === 0")
    fixture_navigate(page, "/landlord/analytics?month=2026-10")
    expect(summary).to_contain_text("October 2026 · month to date")
    page.wait_for_function("financeTest.pendingReads === 0")
    page.wait_for_timeout(200)
    page.evaluate("financeTest.delay = 900")
    page.get_by_role("tab", name="Expenses", exact=True).click()
    expect(page.get_by_role("grid", name="Expense transactions")).to_contain_text("Turnover repaint", timeout=500)
    page.get_by_role("tab", name="Overview", exact=True).click()
    page.get_by_role("tab", name="Expenses", exact=True).click()
    expect(page.get_by_role("grid", name="Expense transactions")).to_contain_text("Turnover repaint", timeout=500)
    page.get_by_role("tab", name="Overview", exact=True).click()
    # A different month loads (slowly) behind its skeleton ...
    open_months().get_by_role("button", name="Month: September 2026", exact=False).click()
    expect(page.get_by_role("status", name="Loading finance report")).to_be_visible()
    expect(month_trigger()).to_have_attribute("aria-label", "Report month: September 2026")
    page.wait_for_function("financeTest.pendingReads === 0")
    # ... and coming back to October paints at once from the cache.
    open_months().get_by_role("button", name="Month: October 2026", exact=False).click()
    expect(summary).to_contain_text("October 2026 · month to date", timeout=500)
    expect(page.get_by_role("status", name="Loading finance report")).to_have_count(0)
    page.wait_for_function("financeTest.pendingReads === 0")
    # A write clears what was cached, so the next read is fresh: saving an
    # expense reopens the review and the summary falls back to Not calculated.
    page.evaluate("financeTest.delay = 30")
    page.get_by_role("tab", name="Expenses", exact=True).click()
    page.get_by_role("button", name="Add expense", exact=True).click()
    cache_editor = page.get_by_role("dialog", name="Add expense", exact=True)
    cache_editor.get_by_label("Amount (₱)", exact=False).fill("100")
    cache_editor.get_by_placeholder("e.g. Kitchen sink repair").fill("Cache check")
    cache_editor.get_by_role("button", name="Save expense", exact=True).click()
    expect(cache_editor).to_have_count(0)
    expect(summary).to_contain_text("Not calculated")
    page.evaluate("financeTest.cache.disable()")
    page.get_by_role("tab", name="Overview", exact=True).click()

    # A missing finance table or RPC shows the support message, never dummy data.
    page.evaluate("financeTest.reportMissing = true")
    page.get_by_role("button", name="Refresh", exact=True).click()
    expect(
        page.get_by_text("Finance tracking needs the latest database update")
    ).to_be_visible()
    page.evaluate("financeTest.reportMissing = false")
    page.get_by_role("button", name="Retry report").click()
    expect(page.get_by_role("button", name="Retry report")).to_have_count(0)

    # The new surfaces get the same viewport and theme sweep as the report, and
    # their controls stay clickable, so the notification bell cannot cover them.
    for width in (390, 768, 1280):
        page.set_viewport_size({"width": width, "height": 900})
        for dark in (False, True):
            theme = "dark" if dark else "light"
            page.evaluate(
                "dark => document.documentElement.classList.toggle('dark', dark)",
                dark,
            )
            fixture_navigate(page, "/landlord/analytics/category-expenses?month=2026-10&category=maintenance")
            expect(
                page.get_by_role("heading", name="Maintenance & repairs", exact=True)
            ).to_be_visible()
            # Wait for the rows, so the capture shows the loaded surface.
            expect(page.get_by_text("Turnover repaint", exact=True)).to_be_visible()
            page.get_by_role("button", name="Refresh", exact=True).click()
            page.screenshot(path=str(OUT / f"expense-drilldown-{width}-{theme}.png"), full_page=True, animations="disabled")
            assert page.evaluate("document.documentElement.scrollWidth <= innerWidth"), f"Horizontal overflow on the expense drill-down at {width}"
            fixture_navigate(page, "/landlord/analytics/budget-category?month=2026-10&category=maintenance&kind=expense")
            expect(
                page.get_by_role("heading", name="Maintenance & repairs", exact=True)
            ).to_be_visible()
            expect(
                page.get_by_role("button", name="Edit budget", exact=False).first
            ).to_be_visible()
            page.get_by_role("button", name="Refresh", exact=True).click()
            page.screenshot(path=str(OUT / f"budget-drilldown-{width}-{theme}.png"), full_page=True, animations="disabled")
            assert page.evaluate("document.documentElement.scrollWidth <= innerWidth"), f"Horizontal overflow on the budget drill-down at {width}"
            # The plan editor opens from a row and stays usable at every width.
            page.get_by_role("button", name="Edit budget", exact=False).first.click()
            plan_editor = page.get_by_role("dialog", name="Edit budget", exact=True)
            expect(plan_editor).to_be_visible()
            wait_for_modal(page)
            page.screenshot(path=str(OUT / f"plan-editor-{width}-{theme}.png"), full_page=True, animations="disabled")
            assert page.evaluate("document.documentElement.scrollWidth <= innerWidth"), f"Horizontal overflow in the plan editor at {width}"
            plan_editor.get_by_role("button", name="Cancel", exact=True).click()
            # The expense editor opens from a transaction row.
            fixture_navigate(page, "/landlord/analytics/category-expenses?month=2026-10&category=maintenance")
            page.get_by_role("row", name="Turnover repaint", exact=False).first.click()
            expense_editor = page.get_by_role("dialog", name="Edit expense", exact=True)
            expect(expense_editor).to_be_visible()
            wait_for_modal(page)
            page.screenshot(path=str(OUT / f"expense-editor-{width}-{theme}.png"), full_page=True, animations="disabled")
            assert page.evaluate("document.documentElement.scrollWidth <= innerWidth"), f"Horizontal overflow in the expense editor at {width}"
            expense_editor.get_by_role("button", name="Cancel", exact=True).click()

    # A slow load shows the report's own loading state, and the placeholder
    # follows the selected tab.
    page.evaluate("financeTest.delay = 400")
    fixture_navigate(page, "/landlord/analytics?month=2026-10&tab=budget")
    expect(page.get_by_role("status", name="Loading finance report")).to_be_visible()
    page.evaluate("financeTest.delay = 30")
    expect(page.get_by_role("heading", name="Budget versus actual")).to_be_visible()

    # One editor at a time; closing it returns focus to the row that opened it;
    # an invalid submit focuses the first invalid field; a pending save keeps
    # the editor open and refuses dismissal.
    fixture_navigate(page, "/landlord/analytics/budget-category?month=2026-10&category=maintenance&kind=expense")
    row = page.get_by_role("button", name="Edit budget", exact=False).first
    row.click()
    expect(page.get_by_role("dialog")).to_have_count(1)
    editor = page.get_by_role("dialog", name="Edit budget", exact=True)
    editor.get_by_label("Monthly spending limit", exact=False).fill("")
    editor.get_by_role("button", name="Save budget", exact=True).click()
    expect(
        editor.get_by_text("Enter zero or a positive amount")
    ).to_be_visible()
    page.wait_for_function(
        "() => document.activeElement?.getAttribute('placeholder') === '₱ 0'"
    )
    page.evaluate("financeTest.delay = 500")
    editor.get_by_label("Monthly spending limit", exact=False).fill("2,000")
    editor.get_by_role("button", name="Save budget", exact=True).click()
    page.keyboard.press("Escape")
    expect(editor).to_be_visible()
    page.evaluate("financeTest.delay = 30")
    expect(editor).to_have_count(0)
    page.wait_for_function(
        "() => (document.activeElement?.textContent ?? '').includes('Bayview')"
    )

    # Account and role matrix: figures follow the account, and roles decide
    # access without leaking anything.
    page.set_viewport_size({"width": 1280, "height": 1000})
    fixture_navigate(page, "/landlord/analytics?month=2026-10")
    page.get_by_role("tab", name="Overview", exact=True).click()
    expect(summary).to_contain_text("₱ 50,000")
    page.evaluate("financeTest.identity = {user: {id: 'auth-b'}, profile: {id: 'owner-b', roles: ['landlord']}, loading: false}; dispatchEvent(new Event('fixture-identity'))")
    expect(summary).to_contain_text("₱ 12,000")
    expect(summary).not_to_contain_text("₱ 50,000")
    # A mixed admin/landlord profile keeps landlord access.
    page.evaluate("financeTest.identity = {user: {id: 'auth-b'}, profile: {id: 'owner-b', roles: ['admin', 'landlord']}, loading: false}; dispatchEvent(new Event('fixture-identity'))")
    expect(summary).to_contain_text("₱ 12,000")
    # Admin-only and tenant-only profiles have no finance access at all.
    page.evaluate("financeTest.identity = {user: {id: 'auth-b'}, profile: {id: 'owner-b', roles: ['admin']}, loading: false}; dispatchEvent(new Event('fixture-identity'))")
    expect(page.get_by_text("Switch to your landlord portal")).to_be_visible()
    expect(page.get_by_role("region", name="Earnings summary")).to_have_count(0)
    page.evaluate("financeTest.identity = {user: {id: 'auth-b'}, profile: {id: 'owner-b', roles: ['tenant']}, loading: false}; dispatchEvent(new Event('fixture-identity'))")
    expect(page.get_by_text("Switch to your landlord portal")).to_be_visible()
    expect(page.get_by_role("region", name="Earnings summary")).to_have_count(0)
    # Signed out: no figures, no editor.
    page.evaluate("financeTest.identity = {user: null, profile: null, loading: false}; dispatchEvent(new Event('fixture-identity'))")
    expect(page.get_by_text("Switch to your landlord portal")).to_be_visible()
    expect(page.get_by_role("dialog")).to_have_count(0)
    # The original account keeps its own figures.
    page.evaluate("financeTest.identity = {user: {id: 'auth-a'}, profile: {id: 'owner-a', roles: ['landlord']}, loading: false}; dispatchEvent(new Event('fixture-identity'))")
    expect(summary).to_contain_text("₱ 50,000")

    page.evaluate("financeTest.noActivity = financeTest.noBillable = financeTest.noPlans = true")
    page.get_by_role("button", name="Refresh", exact=True).click()
    expect(page.get_by_role("heading", name="No income activity yet")).to_be_visible()
    expect(page.get_by_role("heading", name="No billable tenancies this month")).to_be_visible()
    expect(page.get_by_role("heading", name="No plan for this month yet")).to_be_visible()
    expect(page.get_by_role("button", name="Overdue segment:", exact=False)).to_have_count(0)
    page.evaluate("financeTest.noProperties = true")
    page.get_by_role("button", name="Refresh", exact=True).click()
    expect(page.get_by_role("link", name="Create a property")).to_be_visible()
    expect(property_trigger()).to_be_disabled()
    expect(month_trigger()).to_be_disabled()
    expect(page.get_by_role("button", name="Add expense", exact=True)).to_be_disabled()
    page.evaluate("financeTest.noProperties = financeTest.noActivity = financeTest.noBillable = financeTest.noPlans = false")
    page.get_by_role("button", name="Refresh", exact=True).click()
    expect(summary).to_be_visible()
    # Account switch while a request is pending cannot resurrect former rows/modal.
    page.evaluate("financeTest.delay = 300")
    page.get_by_role("button", name="Refresh", exact=True).click()
    page.get_by_role("button", name="Guidelines", exact=True).click()
    page.evaluate("financeTest.identity = {user: null, profile: null, loading: false}; dispatchEvent(new Event('fixture-identity'))")
    expect(page.get_by_role("heading", name="Finances unavailable")).to_be_visible()
    expect(page.get_by_role("dialog")).to_have_count(0)
    expect(page.get_by_role("region", name="Earnings summary")).to_have_count(0)
    page.wait_for_function("financeTest.pendingReads === 0")
    expect(page.get_by_role("region", name="Earnings summary")).to_have_count(0)
    assert not failures, failures
    browser.close()
    print("PASS: Overview two-column layout, inline property and month controls, header actions, indicators, guidelines/focus, chart controls, ledger pagination/retry, reserve save, review, comparison, refresh retention, account loss, and 3 viewport × 2 theme layouts; expenses card, transactions table with category filter, CSV export and row drawer, category bars, drill-down keyset pages, editor validation/save/delete, review invalidation on writes and date moves, list retry retention, and empty states; budget tables with expandable rows, the Add budget header action, category drill-down, locked identity fields, goal suggestions, review-suggestion, repeated upserts, plan removal, unknown category/kind, and plan empty states; hardening: missing-RPC support message, tab-aware loading state, focus paths, blocked dismissal while saving, the drill-down and editor viewport × theme sweep, and the account and role matrix.")
