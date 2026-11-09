import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";

const { chromium } = createRequire(import.meta.url)(process.env.VERIFICATION_PLAYWRIGHT_PATH || "playwright");
const output = process.env.VERIFICATION_BROWSER_OUTPUT;
if (!output) throw new Error("Set VERIFICATION_BROWSER_OUTPUT to the built fixture directory.");
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
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.route("**/*", route => route.request().url().startsWith(`${origin}/`) ? route.continue() : route.abort());
  const apartment = "/tenant/browse/apartment-1";
  const intent = `/tenant/profile?openVerification=true&returnTo=${encodeURIComponent(apartment)}`;
  const dialog = page.getByRole("dialog");
  const waitFor = predicate => page.waitForFunction(predicate);
  const picker = async () => {
    await dialog.getByRole("button", { name: "Generate QR code", exact: true }).waitFor();
    assert.equal(await dialog.count(), 1);
    await dialog.getByText("Verify with Android app", { exact: true }).waitFor();
    await dialog.getByRole("button", { name: "Verify here", exact: true }).waitFor();
    assert.equal(await dialog.evaluate(el => !!el.closest("[inert]")), false);
    assert.equal(await dialog.evaluate(el => el.contains(document.activeElement)), true);
    for (let tab = 0; tab < 6; tab++) {
      await page.keyboard.press("Tab");
      assert.equal(await dialog.evaluate(el => el.contains(document.activeElement)), true);
    }
  };
  const close = async () => {
    await page.getByRole("button", { name: "Close verification", exact: true }).click();
    await dialog.waitFor({ state: "hidden" });
    await page.waitForTimeout(150);
    assert.equal(await dialog.count(), 0);
    assert.equal(new URL(page.url()).searchParams.has("openVerification"), false);
  };

  await page.goto(`${origin}${apartment}`);
  await page.getByRole("button", { name: "Apply Now", exact: true }).click();
  await page.getByRole("link", { name: "Verify account", exact: true }).click();
  await picker();
  assert.equal(new URL(page.url()).pathname, "/tenant/profile");
  assert.equal(new URL(page.url()).searchParams.get("returnTo"), apartment);
  assert.equal(new URL(page.url()).searchParams.has("openVerification"), false);
  // A real first inside click must work, rather than dismiss an inert overlay.
  await dialog.getByRole("button", { name: "Verify here", exact: true }).click();
  await dialog.getByRole("button", { name: "Passport", exact: true }).click();
  await dialog.getByRole("button", { name: "Continue", exact: true }).click();
  await dialog.getByLabel("Upload ID front", { exact: true }).setInputFiles({
    name: "fixture-id.png", mimeType: "image/png",
    buffer: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a7x8AAAAASUVORK5CYII=", "base64"),
  });
  await dialog.getByRole("button", { name: "Continue", exact: true }).click();
  await dialog.getByRole("button", { name: "Enable camera", exact: true }).waitFor();
  await close();
  await page.reload();
  await page.getByRole("heading", { name: "Profile", exact: true }).waitFor();
  assert.equal(await dialog.count(), 0);
  await page.goBack();
  await waitFor(() => location.pathname === "/tenant/browse/apartment-1");
  await page.goForward();
  await waitFor(() => location.pathname === "/tenant/profile");
  assert.equal(await dialog.count(), 0);
  console.log("PASS application → profile, first-open focus/interaction, close, refresh, Back/Forward");

  await page.goto(`${origin}${intent}`);
  await picker();
  await dialog.getByRole("button", { name: "Get Android app", exact: true }).click();
  await dialog.getByText("Get APT on Android", { exact: true }).waitFor();
  assert.equal(await dialog.count(), 1);
  await close();
  await page.getByRole("button", { name: "Apply for Verification", exact: true }).click();
  await picker();
  await dialog.getByRole("button", { name: "Generate QR code", exact: true }).click();
  await dialog.getByLabel("QR code linking to the mobile verification page", { exact: true }).waitFor();
  await close();
  console.log("PASS direct intent opens once, manual reopen, QR and Android options remain interactive");

  // A new explicit intent on the already-mounted profile is a new request.
  await page.evaluate(href => history.pushState(null, "", href), intent);
  await picker();
  await page.reload();
  await page.getByRole("heading", { name: "Profile", exact: true }).waitFor();
  assert.equal(await dialog.count(), 0);
  console.log("PASS same-profile navigation opens once; refreshing an open dialog does not replay the intent");

  for (const status of ["verified", "pending"]) {
    await page.evaluate(value => sessionStorage.setItem("fixtureStatus", value), status);
    await page.goto(`${origin}${intent}`);
    await waitFor(() => !new URL(location.href).searchParams.has("openVerification"));
    assert.equal(await dialog.count(), 0);
    const description = status === "verified" ? "Your identity has been verified." : "Your identity verification is under review.";
    await page.getByText(description, { exact: true }).waitFor();
    assert.equal(await page.getByRole("button", { name: "Apply for Verification", exact: true }).count(), 0);
    await page.getByRole("link", { name: "Return to apartment", exact: true }).click();
    await waitFor(() => location.pathname === "/tenant/browse/apartment-1");
  }
  console.log("PASS verified/pending show existing status, no verification dialog, explicit return link");

  await page.evaluate(() => { sessionStorage.setItem("fixtureStatus", "unverified"); sessionStorage.setItem("fixturePending", "true"); });
  await page.goto(`${origin}${intent}`);
  await dialog.getByText("Verification submitted successfully", { exact: true }).waitFor();
  assert.equal(await dialog.getByRole("button", { name: "Generate QR code", exact: true }).count(), 0);
  await close();
  await page.evaluate(() => { sessionStorage.removeItem("fixturePending"); sessionStorage.setItem("fixtureStatus", "rejected"); });
  await page.goto(`${origin}${intent}`);
  await picker();
  await close();
  console.log("PASS fresh pending submission check and rejected reapplication");

  await page.evaluate(() => sessionStorage.setItem("fixtureStatus", "unverified"));
  for (const profile of ["/tenant/profile", "/landlord/profile"]) {
    await page.goto(`${origin}${profile}`);
    assert.equal(await dialog.count(), 0);
    await page.getByRole("button", { name: "Apply for Verification", exact: true }).click();
    await picker();
    await close();
  }
  await page.goto(`${origin}/verify`);
  await page.getByRole("heading", { name: "Verify your identity", exact: true }).waitFor();
  assert.equal(await dialog.count(), 0);
  assert.deepEqual(errors, []);
  console.log("PASS tenant/landlord manual entry and direct /verify unchanged; no browser errors");
} finally {
  await browser?.close();
  await new Promise(resolve => server.close(resolve));
}
