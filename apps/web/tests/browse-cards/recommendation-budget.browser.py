"""Browser evidence for the production recommendation loader + actual card rendering.
The Supabase transport is in-memory; this is not a hosted-account verification.
"""
import os
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

URL = os.environ.get("BROWSE_FIXTURE_URL", "http://127.0.0.1:8784")
OUTPUT = Path(os.environ.get("BROWSE_BROWSER_OUTPUT", "C:/Users/Aaron23/AppData/Local/Temp/opencode/apt-recommendation-budget"))
OUTPUT.mkdir(parents=True, exist_ok=True)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1280, "height": 900})
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.goto(URL)
    page.wait_for_load_state("networkidle")
    recommended = page.get_by_role("region", name="Recommended for You", exact=True)
    expect(recommended.locator("[data-preview-card]")).to_have_count(3)
    names = recommended.locator("[data-preview-card]").get_by_role("heading", level=3).all_text_contents()
    assert names == ["Navotas home 5000", "Navotas home 7500", "Navotas home 14999"], names
    for name in ["Navotas home 15000", "Navotas home 22000", "Navotas home 45000", "Navotas home 65000", "Caloocan home"]:
        expect(recommended.get_by_role("heading", name=name, exact=True)).to_have_count(0)
    for card in recommended.locator("[data-preview-card]").all():
        expect(card.get_by_text("Within budget", exact=True)).to_be_visible()
    city = page.get_by_role("region", name="Apartments in Navotas", exact=True)
    expect(city.get_by_role("heading", name="Navotas home 65000", exact=True)).to_have_count(1)
    expect(city.get_by_role("list", name="Matches your rental preferences")).to_have_count(0)
    page.screenshot(path=str(OUTPUT / "strict-budget.png"))

    page.get_by_role("button", name="Save wider budget").click()
    expect(recommended.locator("[data-preview-card]")).to_have_count(5)
    page.reload()
    page.wait_for_load_state("networkidle")
    expect(recommended.locator("[data-preview-card]")).to_have_count(5)
    expect(recommended.get_by_role("heading", name="Navotas home 22000", exact=True)).to_have_count(1)
    expect(recommended.get_by_role("heading", name="Navotas home 65000", exact=True)).to_have_count(0)
    assert page.evaluate("JSON.parse(document.getElementById('saved-preferences').textContent).budgetMax") == 29999

    page.goto(URL + "?empty=1")
    page.wait_for_load_state("networkidle")
    expect(page.get_by_role("region", name="Apartments in Navotas", exact=True)).to_be_visible()
    expect(recommended).to_have_count(0)
    expect(page.get_by_role("list", name="Matches your rental preferences")).to_have_count(0)
    assert not errors, errors
    print("PASS production web loader + rendered cards: exact budget/city eligibility, fewer results, generic fallback separation, truthful chips, saved-profile change/reload; no runtime errors")
    browser.close()
