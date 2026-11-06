"""Production ranking/loader rendering with observed public listing fields and supplied saved preferences.
Does not authenticate as, or inspect, the user's private account.
"""
import os
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

URL = os.environ.get("BROWSE_FIXTURE_URL", "http://127.0.0.1:8786")
OUTPUT = Path(os.environ.get("BROWSE_BROWSER_OUTPUT", "C:/Users/Aaron23/AppData/Local/Temp/opencode/apt-ranking"))
OUTPUT.mkdir(parents=True, exist_ok=True)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1280, "height": 900})
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.goto(URL)
    page.wait_for_load_state("networkidle")
    recommended = page.get_by_role("region", name="Recommended for You", exact=True)
    expect(recommended.locator("[data-preview-card]")).to_have_count(4)
    observed = ["Lower Bicutan Affordable 2BR", "San Roque Garden View 1BR", "Tangos Cozy 2BR", "Bagumbayan Norte Sea View Studio"]

    def names():
        return recommended.locator("[data-preview-card]").get_by_role("heading", level=3).all_text_contents()

    assert names() == observed, names()
    assert page.evaluate("JSON.parse(document.getElementById('saved-preferences').textContent).budgetMin") == 15000
    assert page.evaluate("JSON.parse(document.getElementById('saved-preferences').textContent).budgetMax") == 29999
    for card in recommended.locator("[data-preview-card]").all():
        expect(card.get_by_text("Within budget", exact=True)).to_be_visible()
    city = page.get_by_role("region", name="Apartments in Navotas", exact=True)
    expect(city.get_by_role("list", name="Matches your rental preferences")).to_have_count(0)
    page.screenshot(path=str(OUTPUT / "observed-ranking.png"))
    page.reload()
    page.wait_for_load_state("networkidle")
    expect(recommended.locator("[data-preview-card]")).to_have_count(4)
    assert names() == observed
    page.get_by_role("button", name="Save narrower budget").click()
    expect(recommended.locator("[data-preview-card]")).to_have_count(2)
    assert names() == ["San Roque Garden View 1BR", "Tangos Cozy 2BR"]
    page.reload()
    page.wait_for_load_state("networkidle")
    expect(recommended.locator("[data-preview-card]")).to_have_count(2)
    assert names() == ["San Roque Garden View 1BR", "Tangos Cozy 2BR"]

    page.goto(URL + "?equivalent=1")
    page.wait_for_load_state("networkidle")
    expect(recommended.locator("[data-preview-card]")).to_have_count(4)
    assert names() == ["Lower Bicutan Affordable 2BR", "Bagumbayan Norte Sea View Studio", "San Roque Garden View 1BR", "Tangos Cozy 2BR"]
    page.screenshot(path=str(OUTPUT / "equivalent-ranking.png"))
    assert not errors, errors
    print("PASS observed listing order 15000 -> 18000 -> 22000 -> 16000; equivalent matches 15000 -> 16000 -> 18000 -> 22000; stable reloads, saved-range changes, truthful chip context and production loader ordering")
    browser.close()
