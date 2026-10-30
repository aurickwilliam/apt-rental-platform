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
  const policyRequests = [];
  page.on("request", request => { if (request.url().includes("RegistrationPolicyContent-")) policyRequests.push(request.url()); });
  page.on("pageerror", error => errors.push(error.message));
  const initialPages = page.context().pages().length;
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  await page.waitForLoadState("networkidle");
  assert.equal(policyRequests.length, 0, "policy prose must not be requested before user intent");
  const firstTrigger = page.getByRole("form", { name: "Email registration", exact: true }).getByRole("button", { name: "Privacy Policy", exact: true });
  const preloaded = page.waitForResponse(response => response.url().includes("RegistrationPolicyContent-") && response.ok());
  await firstTrigger.hover();
  await preloaded;
  await firstTrigger.focus();
  assert.equal(await page.getByRole("dialog").count(), 0, "preloading must not open the dialog");
  for (const [name, buttonLabel] of [["Email registration", "Sign Up"], ["Google profile completion", "Complete Profile"]]) {
    const form = page.getByRole("form", { name, exact: true });
    const privacy = form.getByRole("checkbox", { name: /Privacy Policy/ });
    const terms = form.getByRole("checkbox", { name: /Terms and Conditions/ });
    const button = form.getByRole("button", { name: buttonLabel, exact: true });
    assert.equal(await button.isDisabled(), true);
    assert.equal(await privacy.isChecked(), false); assert.equal(await terms.isChecked(), false);
    for (const [policy, count] of [["Privacy Policy", 13], ["Terms and Conditions", 22]]) {
      const trigger = form.getByRole("button", { name: policy, exact: true });
      await trigger.click();
      const dialog = page.getByRole("dialog", { name: "Policies", exact: true });
      await dialog.waitFor();
      const article = dialog.getByRole("article", { name: policy, exact: true });
      await article.waitFor();
      await page.waitForFunction(() => !document.querySelector("[data-entering]"));
      assert.equal(await dialog.getByRole("tab", { name: policy, exact: true }).getAttribute("aria-selected"), "true");
      assert.equal(await article.locator("[data-legal-section]").count(), count);
      assert.ok((await article.innerText()).includes("Last updated:"));
      assert.ok((await article.innerText()).includes("Version"));
      assert.equal(await article.locator(".registration-policy-meta").getAttribute("role"), "note");
      assert.ok((await article.locator(".registration-policy-meta").getAttribute("class")).split(" ").includes("alert"));
      if (name === "Email registration" && policy === "Privacy Policy") {
        await page.screenshot({ path: path.join(root, "policy-modal-desktop-light.png"), fullPage: true, animations: "disabled" });
        await page.evaluate(() => document.documentElement.classList.add("dark"));
        await page.screenshot({ path: path.join(root, "policy-modal-desktop-dark.png"), fullPage: true, animations: "disabled" });
        await page.evaluate(() => document.documentElement.classList.remove("dark"));
      }
      const heading = dialog.getByRole("heading", { name: "Policies", exact: true });
      const before = await heading.boundingBox();
      const panel = dialog.getByRole("tabpanel");
      await article.evaluate(element => { element.dataset.retainedPolicy = "yes"; });
      await panel.evaluate(element => { element.scrollTop = element.scrollHeight; });
      assert.ok(await panel.evaluate(element => element.scrollTop > 0));
      assert.ok(Math.abs((await heading.boundingBox()).y - before.y) < 1);
      assert.equal(await dialog.getByRole("button", { name: "Close", exact: true }).isVisible(), true);
      const other = policy === "Privacy Policy" ? "Terms and Conditions" : "Privacy Policy";
      await dialog.getByRole("tab", { name: other, exact: true }).click();
      await dialog.getByRole("article", { name: other, exact: true }).waitFor();
      await dialog.getByRole("tab", { name: other, exact: true }).focus();
      await page.keyboard.press(other === "Privacy Policy" ? "ArrowRight" : "ArrowLeft");
      await dialog.getByRole("article", { name: policy, exact: true }).waitFor();
      assert.equal(await article.getAttribute("data-retained-policy"), "yes", "returning to a tab must reuse its DOM");
      assert.ok(await panel.evaluate(element => element.scrollTop > 0), "tab switching preserves scroll position");
      assert.equal(await dialog.getByRole("tabpanel").count(), 1, "inactive policy must stay out of the accessibility tree");
      for (let tab = 0; tab < 8; tab++) {
        await page.keyboard.press("Tab");
        assert.ok(await dialog.evaluate(element => element.contains(document.activeElement)));
      }
      await page.keyboard.press("Escape");
      await dialog.waitFor({ state: "hidden" });
      await page.waitForFunction(element => document.activeElement === element, await trigger.elementHandle());
      assert.equal(await privacy.isChecked(), false); assert.equal(await terms.isChecked(), false);
      assert.equal(await button.isDisabled(), true);
      assert.equal(await form.evaluate(element => element.dataset.submissions ?? "0"), "0");
    }
    await privacy.focus(); await page.keyboard.press("Space");
    assert.equal(await privacy.isChecked(), true); assert.equal(await button.isDisabled(), true);
    await form.locator('[data-slot="checkbox-control"]').nth(1).click();
    assert.equal(await terms.isChecked(), true); assert.equal(await button.isDisabled(), false);
    await form.getByRole("button", { name: "Terms and Conditions", exact: true }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Close", exact: true }).click();
    await page.getByRole("dialog").waitFor({ state: "hidden" });
    assert.equal(await privacy.isChecked(), true); assert.equal(await terms.isChecked(), true);
    assert.equal(await form.getByRole("textbox", { name: "Draft name" }).inputValue(), "Unsaved draft");
    await form.locator('[data-slot="checkbox-control"]').nth(1).click();
    assert.equal(await button.isDisabled(), true);
    for (const control of await form.locator('[data-slot="checkbox-content"]').all()) {
      const bounds = await control.boundingBox();
      assert.ok(bounds.height >= 44 && bounds.width >= 44);
    }
  }
  assert.equal(policyRequests.length, 1, "hover, focus, both forms and repeated opens share one policy download");
  await page.screenshot({ path: path.join(root, "desktop-light.png"), fullPage: true });
  await page.evaluate(() => document.documentElement.classList.add("dark"));
  await page.screenshot({ path: path.join(root, "desktop-dark.png"), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload(); await page.waitForLoadState("networkidle");
  for (const checkbox of await page.getByRole("checkbox").all()) assert.equal(await checkbox.isChecked(), false);
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
  await page.screenshot({ path: path.join(root, "small-screen.png"), fullPage: true });
  for (const dark of [false, true]) {
    await page.evaluate(value => document.documentElement.classList.toggle("dark", value), dark);
    await page.getByRole("form", { name: "Email registration", exact: true }).getByRole("button", { name: "Privacy Policy", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "Policies", exact: true });
    await dialog.getByRole("article", { name: "Privacy Policy", exact: true }).waitFor();
    await page.waitForFunction(() => !document.querySelector("[data-entering]"));
    const bounds = await dialog.boundingBox();
    assert.ok(bounds.x >= 0 && bounds.y >= 0 && bounds.x + bounds.width <= 390 && bounds.y + bounds.height <= 844);
    assert.ok(await dialog.evaluate(element => element.scrollWidth <= element.clientWidth));
    await page.screenshot({ path: path.join(root, `policy-modal-small-${dark ? "dark" : "light"}.png`), fullPage: true, animations: "disabled" });
    await dialog.getByRole("button", { name: "Close policies", exact: true }).click();
    await dialog.waitFor({ state: "hidden" });
  }
  assert.equal(page.context().pages().length, initialPages);
  assert.deepEqual(errors, []);
  const failedPage = await browser.newPage();
  await failedPage.route("**/RegistrationPolicyContent-*.js", route => route.abort());
  await failedPage.goto(`http://127.0.0.1:${server.address().port}`);
  const failedForm = failedPage.getByRole("form", { name: "Email registration", exact: true });
  await failedForm.getByRole("button", { name: "Privacy Policy", exact: true }).click();
  await failedPage.getByRole("dialog").getByRole("alert").waitFor();
  await failedPage.unroute("**/RegistrationPolicyContent-*.js");
  await failedPage.getByRole("dialog").getByRole("button", { name: "Retry loading policy", exact: true }).click();
  await failedPage.getByRole("dialog").getByRole("article", { name: "Privacy Policy", exact: true }).waitFor();
  const recoveredArticle = failedPage.getByRole("dialog").getByRole("article", { name: "Privacy Policy", exact: true });
  await recoveredArticle.evaluate(element => { element.dataset.retainedPolicy = "recovered"; });
  await failedPage.getByRole("tab", { name: "Terms and Conditions", exact: true }).click();
  await failedPage.getByRole("article", { name: "Terms and Conditions", exact: true }).waitFor();
  await failedPage.getByRole("tab", { name: "Privacy Policy", exact: true }).click();
  assert.equal(await recoveredArticle.getAttribute("data-retained-policy"), "recovered", "cold/retried content must also retain its DOM");
  await failedPage.getByRole("dialog").getByRole("button", { name: "Close", exact: true }).click();
  await failedPage.getByRole("dialog").waitFor({ state: "hidden" });
  assert.equal(await failedForm.getByRole("textbox", { name: "Draft name" }).inputValue(), "Unsaved draft");
  assert.equal(await failedForm.getByRole("checkbox", { name: /Privacy Policy/ }).isChecked(), false);
  await failedForm.locator("label").filter({ hasText: "I have read and agree to the" }).first().click();
  assert.equal(await failedForm.getByRole("checkbox", { name: /Privacy Policy/ }).isChecked(), true);
  await failedPage.close();
  console.log("PASS: policy modal tabs/full content, scrolling, focus trap/return, Escape/Close, no new tabs/submits/acceptance, draft preservation and responsive themes.");
} finally {
  await browser?.close();
  await new Promise(resolve => server.close(resolve));
}
