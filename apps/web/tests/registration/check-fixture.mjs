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
async function reachPolicyEnd(page, dialog) {
  await page.waitForFunction(element => {
    const panel = element.querySelector('[data-registration-policy-scroll]');
    panel.scrollTop = panel.scrollHeight;
    return element.querySelector('[role="status"]')?.textContent.includes("You reached the end");
  }, await dialog.elementHandle());
}
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
    assert.equal(await privacy.isDisabled(), true); assert.equal(await terms.isDisabled(), true);
    const geometry = await form.locator(".registration-policy-checks").evaluate(element => {
      const controls = [...element.querySelectorAll('[data-slot="checkbox-control"]')].map(node => node.getBoundingClientRect());
      const labels = [...element.querySelectorAll('span[id$="-label"]')].map(node => node.getBoundingClientRect());
      return controls.map((control, index) => ({
        gap: labels[index].left - control.right,
        centerOffset: Math.abs(labels[index].top + labels[index].height / 2 - control.top - control.height / 2),
        rowOffset: controls[index].top - controls[0].top,
      }));
    });
    for (const row of geometry) {
      assert.ok(Math.abs(row.gap - 8) < 1, "checkbox-to-label gap stays at the original 8px");
      assert.ok(row.centerOffset <= 2, "checkbox and label stay vertically aligned");
    }
    assert.ok(Math.abs(geometry[1].rowOffset - 40) < 1, "hidden instructions do not add row spacing");
    const notice = form.getByRole("note");
    assert.equal(await notice.innerText(), "Open each policy and scroll to the end to enable its checkbox.");
    assert.ok(await notice.evaluate(element => element.tagName === "P" && getComputedStyle(element).fontSize === "12px" && getComputedStyle(element).borderTopWidth === "0px"), "instruction is compact text without a panel");
    const lockedPrivacy = form.getByRole("button", { name: "Review required before accepting the Privacy Policy", exact: true });
    await lockedPrivacy.focus();
    await page.keyboard.press("Enter");
    assert.ok((await form.getByRole("alert").innerText()).includes("Please open the Privacy Policy"));
    assert.ok(await form.getByRole("alert").evaluate(element => element.parentElement.querySelector('span[id$="-label"] > label').htmlFor.includes("privacy")), "warning appears directly under its policy row");
    assert.ok(await form.getByRole("alert").evaluate(element => Math.abs(element.querySelector("svg").getBoundingClientRect().left - element.parentElement.querySelector('[data-slot="checkbox-control"]').getBoundingClientRect().left) < 1), "warning icon aligns with the checkbox's left edge");
    assert.equal(await form.getByRole("button", { name: "Review policy", exact: true }).count(), 0);
    assert.equal(await privacy.isChecked(), false, "keyboard attempts warn without accepting");
    await form.getByRole("button", { name: "Review required before accepting the Terms and Conditions", exact: true }).click();
    assert.ok((await form.getByRole("alert").innerText()).includes("Please open the Terms and Conditions"));
    assert.equal(await terms.isChecked(), false);
    await form.locator("label").filter({ hasText: "I have read and agree to the" }).first().click({ force: true });
    assert.equal(await privacy.isChecked(), false, "the label cannot bypass the reading gate");
    assert.ok((await form.getByRole("alert").innerText()).includes("Please open the Privacy Policy"));
    if (name === "Email registration") await page.screenshot({ path: path.join(root, "policy-warning-desktop.png"), fullPage: true, animations: "disabled" });
    for (const [policy, count] of [["Privacy Policy", 13], ["Terms and Conditions", 22]]) {
      const trigger = form.getByRole("button", { name: policy, exact: true });
      await trigger.click();
      const dialog = page.getByRole("dialog", { name: policy, exact: true });
      await dialog.waitFor();
      const article = dialog.getByRole("article", { name: policy, exact: true });
      await article.waitFor();
      await page.waitForFunction(() => !document.querySelector("[data-entering]"));
      assert.equal(await dialog.getByRole("tab").count(), 0, "each document has its own dialog without tabs");
      assert.equal(await dialog.getByRole("article").count(), 1);
      const close = dialog.getByRole("button", { name: "Close", exact: true });
      const x = dialog.getByRole("button", { name: `Close ${policy}`, exact: true });
      await page.waitForFunction(element => element.disabled, await close.elementHandle());
      assert.equal(await x.isDisabled(), true);
      await close.click({ force: true });
      await x.click({ force: true });
      await page.keyboard.press("Escape");
      await page.mouse.click(2, 2);
      assert.equal(await dialog.isVisible(), true, "Close, X, Escape and backdrop cannot dismiss an unread document");
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
      const heading = dialog.getByRole("heading", { name: policy, exact: true });
      const before = await heading.boundingBox();
      const panel = dialog.getByRole("region", { name: `${policy} document`, exact: true });
      await panel.focus();
      await page.keyboard.press("Control+End");
      // content-visibility may refine section heights after a large jump.
      // Reaching the real loaded end, not an estimated scrollHeight, unlocks it.
      await reachPolicyEnd(page, dialog);
      assert.ok(await panel.evaluate(element => element.scrollTop > 0));
      assert.ok(Math.abs((await heading.boundingBox()).y - before.y) < 1);
      assert.equal(await dialog.getByRole("button", { name: "Close", exact: true }).isVisible(), true);
      assert.equal(await close.isDisabled(), false);
      assert.equal(await x.isDisabled(), false);
      for (let tab = 0; tab < 8; tab++) {
        await page.keyboard.press("Tab");
        assert.ok(await dialog.evaluate(element => element.contains(document.activeElement)));
      }
      if (policy === "Privacy Policy") await page.keyboard.press("Escape");
      else await page.mouse.click(2, 2);
      await dialog.waitFor({ state: "hidden" });
      await page.waitForFunction(element => document.activeElement === element, await trigger.elementHandle());
      assert.equal(await privacy.isChecked(), false); assert.equal(await terms.isChecked(), false);
      assert.equal(await button.isDisabled(), true);
      assert.equal(await form.evaluate(element => element.dataset.submissions ?? "0"), "0");
      assert.equal(await (policy === "Privacy Policy" ? privacy : terms).isDisabled(), false);
      if (policy === "Privacy Policy") assert.equal(await terms.isDisabled(), true, "reading Privacy never unlocks Terms");
    }
    assert.equal(await form.getByRole("alert").count(), 0, "the reviewed policy no longer needs a warning");
    assert.equal(await form.getByRole("note").count(), 0, "the shared notice hides once both documents are reviewed");
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
  for (const checkbox of await page.getByRole("checkbox").all()) {
    assert.equal(await checkbox.isChecked(), false);
    assert.equal(await checkbox.isDisabled(), true, "refresh resets reading completion");
  }
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
  await page.screenshot({ path: path.join(root, "small-screen.png"), fullPage: true });
  for (const dark of [false, true]) {
    await page.evaluate(value => document.documentElement.classList.toggle("dark", value), dark);
    await page.getByRole("form", { name: "Email registration", exact: true }).getByRole("button", { name: "Privacy Policy", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "Privacy Policy", exact: true });
    await dialog.getByRole("article", { name: "Privacy Policy", exact: true }).waitFor();
    await page.waitForFunction(() => !document.querySelector("[data-entering]"));
    const bounds = await dialog.boundingBox();
    assert.ok(bounds.x >= 0 && bounds.y >= 0 && bounds.x + bounds.width <= 390 && bounds.y + bounds.height <= 844);
    assert.ok(await dialog.evaluate(element => element.scrollWidth <= element.clientWidth));
    await page.screenshot({ path: path.join(root, `policy-modal-small-${dark ? "dark" : "light"}.png`), fullPage: true, animations: "disabled" });
    await reachPolicyEnd(page, dialog);
    await dialog.getByRole("button", { name: "Close Privacy Policy", exact: true }).click();
    await dialog.waitFor({ state: "hidden" });
    const narrowForm = page.getByRole("form", { name: "Email registration", exact: true });
    assert.equal(await narrowForm.getByRole("checkbox", { name: /Privacy Policy/ }).isDisabled(), false);
    assert.equal(await narrowForm.getByRole("checkbox", { name: /Privacy Policy/ }).isChecked(), false);
    assert.equal(await narrowForm.getByRole("checkbox", { name: /Terms and Conditions/ }).isDisabled(), true);
    assert.ok(await narrowForm.getByRole("note").evaluate(element => getComputedStyle(element).fontSize === "12px" && getComputedStyle(element).borderTopWidth === "0px"));
    await narrowForm.getByRole("button", { name: "Review required before accepting the Terms and Conditions", exact: true }).click();
    assert.ok((await narrowForm.getByRole("alert").innerText()).includes("Please open the Terms and Conditions"));
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
    await page.screenshot({ path: path.join(root, `policy-warning-small-${dark ? "dark" : "light"}.png`), fullPage: true, animations: "disabled" });
  }
  assert.equal(page.context().pages().length, initialPages);
  assert.deepEqual(errors, []);
  const loadingPage = await browser.newPage();
  let releaseDownload;
  const heldDownload = new Promise(resolve => { releaseDownload = resolve; });
  await loadingPage.route("**/RegistrationPolicyContent-*.js", async route => { await heldDownload; await route.abort(); });
  await loadingPage.goto(`http://127.0.0.1:${server.address().port}`);
  const loadingTrigger = loadingPage.getByRole("form", { name: "Email registration", exact: true }).getByRole("button", { name: "Privacy Policy", exact: true });
  await loadingTrigger.click();
  await loadingPage.getByText("Loading policy…", { exact: true }).waitFor();
  assert.equal(await loadingPage.getByRole("dialog").getByRole("button", { name: "Close", exact: true }).isDisabled(), false);
  await loadingPage.keyboard.press("Escape");
  await loadingPage.getByRole("dialog").waitFor({ state: "hidden" });
  await loadingTrigger.click();
  await loadingPage.getByRole("dialog").getByRole("button", { name: "Close", exact: true }).click();
  await loadingPage.getByRole("dialog").waitFor({ state: "hidden" });
  releaseDownload();
  await loadingPage.unrouteAll({ behavior: "wait" });
  await loadingPage.close();
  const failedPage = await browser.newPage();
  await failedPage.route("**/RegistrationPolicyContent-*.js", route => route.abort());
  await failedPage.goto(`http://127.0.0.1:${server.address().port}`);
  const failedForm = failedPage.getByRole("form", { name: "Email registration", exact: true });
  await failedForm.getByRole("button", { name: "Privacy Policy", exact: true }).click();
  await failedPage.getByRole("dialog").getByRole("alert").waitFor();
  assert.equal(await failedPage.getByRole("dialog").getByRole("button", { name: "Close", exact: true }).isDisabled(), false);
  assert.equal(await failedForm.locator('input[type="checkbox"]').first().isDisabled(), true, "failed content cannot unlock acceptance");
  await failedPage.getByRole("dialog").getByRole("button", { name: "Close", exact: true }).click();
  await failedPage.getByRole("dialog").waitFor({ state: "hidden" });
  await failedForm.getByRole("button", { name: "Privacy Policy", exact: true }).click();
  await failedPage.getByRole("dialog").getByRole("alert").waitFor();
  await failedPage.unroute("**/RegistrationPolicyContent-*.js");
  await failedPage.getByRole("dialog").getByRole("button", { name: "Retry loading policy", exact: true }).click();
  await failedPage.getByRole("dialog").getByRole("article", { name: "Privacy Policy", exact: true }).waitFor();
  const recoveredDialog = failedPage.getByRole("dialog");
  await failedPage.waitForFunction(element => element.disabled, await recoveredDialog.getByRole("button", { name: "Close", exact: true }).elementHandle());
  await failedPage.keyboard.press("Escape");
  assert.equal(await recoveredDialog.isVisible(), true, "successful retry restores the reading lock");
  await reachPolicyEnd(failedPage, recoveredDialog);
  await recoveredDialog.getByRole("button", { name: "Close", exact: true }).click();
  await recoveredDialog.waitFor({ state: "hidden" });
  assert.equal(await failedForm.getByRole("textbox", { name: "Draft name" }).inputValue(), "Unsaved draft");
  await failedForm.locator("label").filter({ hasText: "I have read and agree to the" }).first().click();
  assert.equal(await failedForm.getByRole("checkbox", { name: /Privacy Policy/ }).isChecked(), true);
  await failedPage.close();
  console.log("PASS: separate policy dialogs without tabs, independent read/close gates, blocked Close/X/Escape/backdrop, loading/error escape, retry safety, keyboard scrolling, focus, explicit acceptance and responsive themes.");
} finally {
  await browser?.close();
  await new Promise(resolve => server.close(resolve));
}
