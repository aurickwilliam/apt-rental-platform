"""Playwright component-fixture checks; no hosted auth/database access.

Run after build-fixture.mjs using webapp-testing/scripts/with_server.py.
FINANCE_BROWSER_URL defaults to http://127.0.0.1:4387.
"""
import os
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

    # Expenses tab: review card mirrors the shared copy; category bars open
    # the drill-down route for the applied scope.
    page.get_by_role("tab", name="Expenses", exact=True).click()
    expect(page.get_by_role("heading", name="Expenses reviewed", exact=True)).to_be_visible()
    bar = page.get_by_role("button", name="Maintenance & repairs, ₱ 14,500, 100 percent").first
    expect(bar).to_be_visible()
    expect(bar).to_contain_text("Previous comparable period:")
    bar.click()
    assert "category=maintenance" in page.url and "month=2026-10" in page.url
    assert "/landlord/analytics/category-expenses" in page.url
    expect(page.get_by_role("heading", name="Maintenance & repairs", exact=True)).to_be_visible()
    expect(page.get_by_role("heading", name="All properties", exact=True)).to_be_visible()
    expect(page.get_by_text("October 2026", exact=True)).to_be_visible()
    # Keyset pages: seeded page size is 2, so Load more trails the cursor.
    expect(page.get_by_text("Turnover repaint", exact=True)).to_be_visible()
    expect(page.get_by_text("Repaint gate", exact=True)).to_be_visible()
    expect(page.get_by_text("Kitchen sink repair")).to_have_count(0)
    page.get_by_role("button", name="Load more expenses", exact=True).click()
    expect(page.get_by_text("Kitchen sink repair", exact=True)).to_be_visible()
    # Cross-property rows name the property; scoped lists do not repeat it.
    expect(page.get_by_text("Bayview · Operating").first).to_be_visible()

    # Editor validation keeps the draft; save refreshes the visible list.
    page.get_by_role("button", name="Edit Kitchen sink repair, ₱ 2,500, paid 2026-10-05").click()
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
    page.get_by_role("button", name="Edit Kitchen sink repair, ₱ 2,650, paid 2026-10-05").click()
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
    editor.get_by_label("Date paid", exact=False).fill("2026-10-19")
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
    page.get_by_role("button", name="Edit Plumbing permit, ₱ 2,750, paid 2026-10-19").click()
    editor = page.get_by_role("dialog", name="Edit expense", exact=True)
    editor.get_by_label("Date paid", exact=False).fill("2026-09-28")
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
    page.get_by_role("button", name="Refresh expenses", exact=True).click()
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
    expect(page.get_by_role("heading", name="Budget suggestions")).to_be_visible()
    # The group hides the single over-limit plan: 4,200 spent of 13,000.
    spending_row = page.get_by_role(
        "button",
        name="Maintenance & repairs, 2 properties. Spent ₱ 4,200 of ₱ 13,000. Within budget. View properties",
    )
    expect(spending_row).to_be_visible()
    # A zero limit shows no percentage and an empty bar.
    zero_row = page.get_by_role(
        "button",
        name="Owner-paid utilities & dues, Garden Court. Spent ₱ 0 of ₱ 0. Within budget. View properties",
    )
    expect(zero_row).to_be_visible()
    expect(zero_row).to_contain_text("₱ 0 remaining")
    expect(zero_row).not_to_contain_text("used")
    # Reserves stay their own section and never mix with spending limits.
    reserve_row = page.get_by_role(
        "button",
        name="Emergency reserve, Bayview. Planned ₱ 1,500 this month. View properties",
    )
    expect(reserve_row).to_be_visible()

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
    expect(over_row).to_contain_text("₱ 1,200 over budget · 140% used")
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
    # A goal suggests a monthly amount without changing the plan yet.
    editor.get_by_label("Amount still needed / annual bill", exact=False).fill("12,000")
    editor.get_by_label("Months to spread this amount over", exact=False).fill("12")
    expect(editor.get_by_text("₱ 1,000 / month")).to_be_visible()
    editor.get_by_role("button", name="Save budget", exact=True).click()
    expect(editor).to_have_count(0)
    write = page.evaluate("financeTest.writes.at(-1)")
    assert write["target_amount"] == 12000 and write["months_remaining"] == 12
    assert write["amount"] == 3000
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

    # The saved goal becomes a suggestion in the Budget tab.
    page.get_by_role("link", name="Back to budgets").click()
    page.get_by_role("tab", name="Budget", exact=True).click()
    expect(page.get_by_text("Plan for maintenance & repairs")).to_be_visible()
    expect(page.get_by_text("₱ 1,000 / month").first).to_be_visible()
    expect(page.get_by_text("Bayview · Based on your entries")).to_be_visible()
    # Reviewing a suggestion opens the plan with that amount, and never saves
    # on its own.
    page.get_by_role("button", name="Review suggestion", exact=True).click()
    editor = page.get_by_role("dialog", name="Edit budget", exact=True)
    expect(editor.get_by_label("Monthly spending limit", exact=False)).to_have_value(
        "₱ 1,000"
    )
    editor.get_by_role("button", name="Save budget", exact=True).click()
    expect(editor).to_have_count(0)
    assert page.evaluate("financeTest.writes.at(-1).amount") == 1000
    page.get_by_role("tab", name="Budget", exact=True).click()
    expect(
        page.get_by_role(
            "button",
            name="Maintenance & repairs, 2 properties. Spent ₱ 4,200 of ₱ 11,000. Within budget. View properties",
        )
    ).to_be_visible()

    # Removing a plan takes two steps and disappears from the list.
    page.get_by_role(
        "button",
        name="Maintenance & repairs, 2 properties. Spent ₱ 4,200 of ₱ 11,000. Within budget. View properties",
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
        name="Emergency reserve, Bayview. Planned ₱ 1,500 this month. View properties",
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
    print("PASS: Overview filters, indicators, guidelines/focus, chart controls, ledger pagination/retry, reserve save, review, comparison, refresh retention, account loss, and 3 viewport × 2 theme layouts; expenses card, category bars, drill-down keyset pages, editor validation/save/delete, review invalidation on writes and date moves, list retry retention, and empty states; budget sections, group rows, category drill-down, locked identity fields, goal suggestions, review-suggestion, repeated upserts, plan removal, unknown category/kind, and plan empty states.")
