import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.VERIFICATION_PLAYWRIGHT_PATH || "playwright");
const axePath = require.resolve(process.env.VERIFICATION_AXE_PATH || "axe-core");
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
  browser = await chromium.launch({ channel: process.env.VERIFICATION_BROWSER_CHANNEL || "msedge", headless: true, args: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"] });
  for (const [width, height] of [[320, 640], [375, 667], [393, 852], [430, 932], [768, 1024], [1280, 900]]) {
    const context = await browser.newContext({ viewport: { width, height }, permissions: ["camera"] });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.route("**/*", route => route.request().url().startsWith(`${origin}/`) ? route.continue() : route.abort());
    const button = name => page.getByRole("button", { name, exact: true });
    const noOverflow = async () => assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${width}px must not overflow horizontally`);
    const accessible = async label => {
      await page.addScriptTag({ path: axePath });
      const violations = await page.evaluate(async () => (await window.axe.run(document.querySelector("main"), { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa"] } })).violations.map(({ id, nodes }) => ({ id, targets: nodes.map(node => node.target) })));
      assert.deepEqual(violations, [], `${width}px ${label} accessibility`);
    };
    const footerVisible = async () => {
      const rect = await page.locator(".mobile-verification-navigation").boundingBox();
      assert.ok(rect.y >= 0 && rect.y + rect.height <= (await page.viewportSize()).height + 1, `${width}px footer stays within the viewport`);
      for (const control of await page.locator(".mobile-verification-navigation button").all()) {
        const box = await control.boundingBox();
        assert.ok(box.height >= 44, "touch targets are at least 44px high");
      }
    };
    await page.goto(`${origin}/verify/mobile?token=${"a".repeat(43)}`);
    await button("Continue").waitFor();
    assert.equal(await page.getByRole("progressbar").getAttribute("aria-valuemax"), "6");
    assert.equal(await page.locator(".mobile-verification-shell [data-slot='card']").count(), 0);
    await noOverflow();
    await accessible("introduction");
    await page.screenshot({ path: path.join(output, `mobile-intro-${width}.png`), fullPage: true });
    await button("Continue").click();
    assert.equal(await button("Continue").isDisabled(), true);
    await footerVisible();
    const listBox = await page.getByRole("radiogroup").boundingBox();
    const actionBox = await page.locator(".mobile-verification-navigation").boundingBox();
    assert.ok(listBox.y + listBox.height <= actionBox.y + 1, "the list scroll area never extends under navigation");
    const radios = page.getByRole("radio");
    assert.ok(await radios.count() > 10);
    const last = await radios.last().getAttribute("value");
    const lastRow = page.locator('[data-slot="radio"]').last();
    await lastRow.evaluate(el => el.scrollIntoView({ block: "center" }));
    await page.getByText(last, { exact: true }).click();
    assert.equal(await radios.last().isChecked(), true);
    const rowBox = await lastRow.boundingBox();
    const footerBox = await page.locator(".mobile-verification-navigation").boundingBox();
    assert.ok(rowBox.y + rowBox.height <= footerBox.y + 1, "last ID remains above the action bar");
    await footerVisible();
    await noOverflow();
    await button("Back").click();
    await button("Continue").click();
    assert.equal(await radios.last().isChecked(), true, "Back retains ID selection");
    await radios.first().focus();
    await page.keyboard.press("ArrowDown");
    assert.equal(await radios.nth(1).isChecked(), true, "standard radio arrow-key selection works");
    await accessible("ID selection");
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: path.join(output, `mobile-id-list-${width}.png`), fullPage: true });
    await page.setViewportSize({ width, height: 360 });
    await lastRow.evaluate(el => el.scrollIntoView({ block: "center" }));
    await footerVisible();
    await noOverflow();
    await page.setViewportSize({ width, height });
    await page.getByText("National ID (PhilSys/PhilID)", { exact: true }).click();
    await button("Continue").click();
    await page.evaluate(() => {
      window.fixtureGetUserMedia = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
      navigator.mediaDevices.getUserMedia = async () => { throw new DOMException("Synthetic denied permission", "NotAllowedError"); };
    });
    await button("Enable camera").click();
    assert.match(await page.getByRole("alert").innerText(), /site controls/);
    assert.doesNotMatch(await page.getByRole("alert").innerText(), /Safari/);
    assert.equal(await page.locator('input[type="file"]').count(), 0, "the mobile camera-only policy is retained");
    await footerVisible();
    await noOverflow();
    await accessible("camera permission denied");
    await page.screenshot({ path: path.join(output, `mobile-camera-denied-${width}.png`), fullPage: true });
    await page.evaluate(() => { navigator.mediaDevices.getUserMedia = window.fixtureGetUserMedia; });
    await button("Try camera again").click();
    await button("Capture").waitFor();
    await footerVisible();
    await button("Capture").click();
    await page.getByRole("heading", { name: "ID back", exact: true }).waitFor();
    await button("Back").click();
    await page.getByAltText("ID front preview", { exact: true }).waitFor();
    await button("Continue").waitFor();
    assert.equal(await button("Enable camera").count(), 0, "Back displays the existing capture, not a new camera request");
    await noOverflow();
    await accessible("captured photo preview");
    await page.screenshot({ path: path.join(output, `mobile-preview-${width}.png`), fullPage: true });
    await page.getByRole("button", { name: "Retake ID front", exact: true }).click();
    await button("Enable camera").waitFor();
    await page.clock.install();
    await page.clock.fastForward(601000);
    await page.getByRole("heading", { name: "This code has expired", exact: true }).waitFor();
    assert.equal(await button("Capture").count(), 0);
    await noOverflow();
    assert.deepEqual(errors, []);
    console.log(`PASS ${width}px: layout, scroll/footer clearance, ID rows/keyboard/state, permissions/retry, capture/Back/preview/retake, expiry and axe WCAG checks`);
    await context.close();
  }
} finally {
  await browser?.close();
  await new Promise(resolve => server.close(resolve));
}
