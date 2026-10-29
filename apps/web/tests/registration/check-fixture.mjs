// Run after build-fixture.mjs. Uses a temporary Playwright installation, not an
// application dependency. No .env, hosted data, email or OAuth calls are used.
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";

const root = process.argv[2];
if (!root || !process.env.REGISTRATION_PLAYWRIGHT_PATH) throw new Error("Supply fixture output directory and REGISTRATION_PLAYWRIGHT_PATH.");
const { chromium } = createRequire(import.meta.url)(process.env.REGISTRATION_PLAYWRIGHT_PATH);
const server = createServer(async (req, res) => {
  const pathname = new URL(req.url, "http://localhost").pathname;
  if (["/pap", "/tos"].includes(pathname)) {
    res.setHeader("content-type", "text/html"); res.end("<h1>Policy test destination</h1>"); return;
  }
  const file = pathname === "/" ? "index.html" : pathname.slice(1);
  if (path.basename(file) !== file) { res.writeHead(404); res.end(); return; }
  try {
    const body = await readFile(path.join(root, file));
    res.setHeader("content-type", file.endsWith(".js") ? "text/javascript" : file.endsWith(".css") ? "text/css" : "text/html");
    res.end(body);
  } catch { res.writeHead(404); res.end(); }
});
await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
let browser;
try {
  browser = await chromium.launch({ headless: true, ...(process.env.REGISTRATION_BROWSER_PATH ? { executablePath: process.env.REGISTRATION_BROWSER_PATH } : {}) });
  const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  await page.waitForLoadState("networkidle");
  for (const [name, buttonLabel] of [["Email registration", "Sign Up"], ["Google profile completion", "Complete Profile"]]) {
    const form = page.getByRole("form", { name, exact: true });
    const privacy = form.getByRole("checkbox", { name: /Privacy Policy/ });
    const terms = form.getByRole("checkbox", { name: /Terms and Conditions/ });
    const button = form.getByRole("button", { name: buttonLabel, exact: true });
    assert.equal(await button.isDisabled(), true);
    assert.equal(await privacy.isChecked(), false); assert.equal(await terms.isChecked(), false);
    await privacy.focus(); await page.keyboard.press("Space");
    assert.equal(await privacy.isChecked(), true); assert.equal(await button.isDisabled(), true);
    await form.locator('[data-slot="checkbox-control"]').nth(1).click();
    assert.equal(await terms.isChecked(), true); assert.equal(await button.isDisabled(), false);
    for (const [policy, route] of [[/Privacy Policy/, "/pap"], [/Terms and Conditions/, "/tos"]]) {
      const popupPromise = page.waitForEvent("popup");
      await form.getByRole("link", { name: policy }).click();
      const popup = await popupPromise;
      await popup.waitForLoadState();
      assert.equal(new URL(popup.url()).pathname, route);
      await popup.close();
      assert.equal(await privacy.isChecked(), true); assert.equal(await terms.isChecked(), true);
    }
    assert.equal(await form.getByRole("textbox", { name: "Draft name" }).inputValue(), "Unsaved draft");
    await form.locator('[data-slot="checkbox-control"]').nth(1).click();
    assert.equal(await button.isDisabled(), true);
    for (const control of await form.locator('[data-slot="checkbox-content"]').all()) {
      const bounds = await control.boundingBox();
      assert.ok(bounds.height >= 44 && bounds.width >= 44);
    }
  }
  await page.screenshot({ path: path.join(root, "desktop-light.png"), fullPage: true });
  await page.evaluate(() => document.documentElement.classList.add("dark"));
  await page.screenshot({ path: path.join(root, "desktop-dark.png"), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload(); await page.waitForLoadState("networkidle");
  for (const checkbox of await page.getByRole("checkbox").all()) assert.equal(await checkbox.isChecked(), false);
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
  await page.screenshot({ path: path.join(root, "small-screen.png"), fullPage: true });
  assert.deepEqual(errors, []);
  console.log("PASS: registration UI, keyboard, new-tab links, draft preservation, touch targets, refresh reset and responsive themes.");
} finally {
  await browser?.close();
  await new Promise(resolve => server.close(resolve));
}
