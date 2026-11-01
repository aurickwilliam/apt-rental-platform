import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { maliciousVerificationReturns } from "../../lib/test-support/verification-security-cases.mjs";

const { chromium } = createRequire(import.meta.url)(process.env.VERIFICATION_PLAYWRIGHT_PATH || "playwright");
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
  const page = await browser.newPage();
  const errors = [];
  const externalRequests = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.route("**/*", route => {
    if (route.request().url().startsWith(`${origin}/`)) return route.continue();
    externalRequests.push(route.request().url());
    return route.abort();
  });
  const token = "a".repeat(43);
  for (const value of [null, "", ...maliciousVerificationReturns]) {
    const params = new URLSearchParams({ token });
    if (value !== null) params.set("returnTo", value);
    await page.goto(`${origin}/verify/mobile?${params}`);
    await page.getByRole("heading", { name: "Verify your identity", exact: true }).waitFor();
    const diagnostic = page.locator('[data-testid="requested-return-destination"]');
    assert.equal(await diagnostic.textContent(), value ?? "");
    assert.equal(await diagnostic.locator("*").count(), 0, "query strings must remain text, never executable elements");
    assert.equal(await page.getByRole("link", { name: "Return to apartment", exact: true }).count(), 0, JSON.stringify(value));
    assert.equal(await page.evaluate(() => window.__pr309xss), undefined);
    assert.equal(new URL(page.url()).origin, origin);
  }
  console.log(`PASS ${maliciousVerificationReturns.length + 2} invalid/missing return values: no link, HTML interpretation, script execution or external navigation`);

  for (const source of ["/browse/apartment-1", "/tenant/browse/apartment-1", "/tenant/browse/apartment-1/apply"]) {
    const expected = source.replace(/\/apply$/, "");
    await page.goto(`${origin}/verify/mobile?${new URLSearchParams({ token, returnTo: source })}`);
    const link = page.getByRole("link", { name: "Return to apartment", exact: true });
    await link.waitFor();
    assert.equal(await link.getAttribute("href"), expected);
    await link.click();
    await page.waitForURL(url => url.pathname === expected && url.origin === origin);
  }
  console.log("PASS valid public/tenant listing returns still navigate; apply returns reduce to listing details");

  // The profile is a second real sink of the shared destination validator.
  const profileParams = new URLSearchParams({ openVerification: "true", returnTo: "javascript:window.__pr309xss=1" });
  await page.goto(`${origin}/tenant/profile?${profileParams}`);
  await page.getByRole("dialog").getByRole("button", { name: "Generate QR code", exact: true }).waitFor();
  assert.equal(await page.getByRole("link", { name: "Return to apartment", exact: true }).count(), 0);
  await page.getByRole("button", { name: "Close verification", exact: true }).click();
  await page.goto(`${origin}/hydration?${new URLSearchParams({ returnTo: maliciousVerificationReturns.at(-1) })}`);
  await page.getByRole("heading", { name: "Verify your identity", exact: true }).waitFor();
  assert.deepEqual(await page.evaluate(() => window.fixtureHydrationErrors || []), []);
  assert.equal(await page.evaluate(() => window.__pr309xss), undefined);
  assert.deepEqual(externalRequests, []);
  assert.deepEqual(errors, []);
  console.log("PASS profile destination rejection and real server-markup hydration without browser HTML insertion");
} finally {
  await browser?.close();
  await new Promise(resolve => server.close(resolve));
}
