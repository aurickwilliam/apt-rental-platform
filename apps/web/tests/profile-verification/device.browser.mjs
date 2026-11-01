import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";

const { chromium, devices } = createRequire(import.meta.url)(process.env.VERIFICATION_PLAYWRIGHT_PATH || "playwright");
const output = process.env.VERIFICATION_BROWSER_OUTPUT;
if (!output) throw new Error("Set VERIFICATION_BROWSER_OUTPUT.");
const server = createServer(async (req, res) => {
  const pathname = new URL(req.url, "http://localhost").pathname;
  const file = ["/fixture.js", "/styles.css"].includes(pathname) ? pathname.slice(1) : "index.html";
  try {
    res.setHeader("Content-Type", file.endsWith(".js") ? "text/javascript" : file.endsWith(".css") ? "text/css" : "text/html");
    res.end(await readFile(path.join(output, file)));
  } catch { res.writeHead(404).end(); }
});
await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
let browser;
try {
  browser = await chromium.launch({ channel: process.env.VERIFICATION_BROWSER_CHANNEL || "msedge", headless: true });
  for (const [name, device, android] of [["Android", devices["Pixel 7"], true], ["iPhone", devices["iPhone 13"], false], ["iPad", devices["iPad Pro 11"], false]]) {
    const context = await browser.newContext(device);
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.route("**/*", route => route.request().url().startsWith(`${origin}/`) ? route.continue() : route.abort());
    const apartment = "/tenant/browse/apartment-1";
    const intent = `/tenant/profile?openVerification=true&returnTo=${encodeURIComponent(apartment)}`;

    await page.goto(`${origin}/hydration`);
    await page.getByRole("button", { name: "Continue verification", exact: true }).waitFor();
    assert.match(await page.evaluate(() => window.fixtureServerHTML), /Loading verification/);
    assert.doesNotMatch(await page.evaluate(() => window.fixtureServerHTML), /Generate QR|Verify with this phone/);
    assert.deepEqual(await page.evaluate(() => window.fixtureHydrationErrors || []), []);
    assert.equal(await page.getByRole("button", { name: "Verify here", exact: true }).count(), 0);

    await page.goto(`${origin}${apartment}`);
    await page.getByRole("button", { name: "Apply Now", exact: true }).click();
    await page.getByRole("link", { name: "Verify account", exact: true }).click();
    const dialog = page.getByRole("dialog");
    const start = dialog.getByRole("button", { name: "Continue verification", exact: true });
    await start.waitFor();
    assert.equal(await dialog.count(), 1);
    assert.equal(await dialog.evaluate(el => !!el.closest("[inert]")), false);
    assert.equal(await dialog.evaluate(el => el.contains(document.activeElement)), true);
    for (let tab = 0; tab < 6; tab++) {
      await page.keyboard.press("Tab");
      assert.equal(await dialog.evaluate(el => el.contains(document.activeElement)), true, "focus stays inside the dialog");
    }
    assert.equal(await dialog.getByRole("button", { name: "Generate QR code", exact: true }).count(), 0);
    assert.equal(await dialog.getByRole("button", { name: "Verify here", exact: true }).count(), 0);
    assert.equal(await dialog.getByText("Prefer using desktop?", { exact: true }).count(), 0);
    assert.equal(await dialog.getByRole("link", { name: "Get Android app", exact: true }).count(), android ? 1 : 0);
    if (android) assert.equal(await dialog.getByRole("link", { name: "Get Android app", exact: true }).getAttribute("href"), "https://apt.test/app.apk");
    assert.equal(await page.evaluate(() => window.fixtureSessions || 0), 0, "phones must not pre-create a QR session");
    await page.locator('[data-slot="modal-backdrop"]').evaluate(async el => {
      await Promise.all(el.getAnimations({ subtree: true }).map(animation => animation.finished.catch(() => {})));
    });
    await page.screenshot({ path: path.join(output, `methods-${name}.png`), fullPage: true });
    await page.keyboard.press("Escape");
    await dialog.waitFor({ state: "hidden" });
    await page.getByRole("button", { name: "Apply for Verification", exact: true }).click();
    await start.click();
    await page.waitForURL(url => url.pathname === "/verify/mobile");
    assert.equal(new URL(page.url()).searchParams.get("token"), "a".repeat(43));
    assert.equal(new URL(page.url()).searchParams.get("returnTo"), apartment);
    await page.getByRole("button", { name: "Continue", exact: true }).waitFor();
    assert.equal(await page.evaluate(() => window.fixtureSessions), 1);
    assert.deepEqual(await page.evaluate(() => window.fixtureClaims), ["a".repeat(43)]);
    assert.equal(await page.getByRole("link", { name: "Return to apartment", exact: true }).getAttribute("href"), apartment);
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    await page.getByRole("heading", { name: "Select your ID type", exact: true }).waitFor();
    await page.getByText("Passport", { exact: true }).click();
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    await page.getByRole("button", { name: "Enable camera", exact: true }).waitFor();
    await page.goBack();
    await page.getByRole("heading", { name: "Profile", exact: true }).waitFor();
    assert.equal(await dialog.count(), 0);
    assert.equal(new URL(page.url()).searchParams.has("openVerification"), false);

    for (const status of ["verified", "pending"]) {
      await page.evaluate(value => sessionStorage.setItem("fixtureStatus", value), status);
      await page.goto(`${origin}${intent}`);
      await page.waitForFunction(() => !new URL(location.href).searchParams.has("openVerification"));
      assert.equal(await dialog.count(), 0);
      assert.equal(await page.evaluate(() => window.fixtureSessions || 0), 0);
    }
    await page.evaluate(() => sessionStorage.setItem("fixtureStatus", "rejected"));
    await page.goto(`${origin}${intent}`);
    await dialog.getByRole("button", { name: "Continue verification", exact: true }).waitFor();
    assert.equal(await dialog.getByRole("button", { name: "Generate QR code", exact: true }).count(), 0);
    assert.deepEqual(errors, []);
    console.log(`PASS ${name}: methods, hydration, first-open focus/Escape, one-click session → claim → camera entry, returnTo, Back and statuses`);
    await context.close();
  }
} finally {
  await browser?.close();
  await new Promise(resolve => server.close(resolve));
}
