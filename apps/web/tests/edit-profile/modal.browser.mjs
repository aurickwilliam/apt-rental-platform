import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";

const { chromium } = createRequire(import.meta.url)(process.env.PROFILE_PLAYWRIGHT_PATH || "playwright");
const output = process.env.PROFILE_BROWSER_OUTPUT;
if (!output) throw new Error("Set PROFILE_BROWSER_OUTPUT to the built fixture directory.");
const server = createServer(async (req, res) => {
  const name = new URL(req.url, "http://localhost").pathname.slice(1) || "index.html";
  if (!["index.html", "fixture.js", "styles.css"].includes(name)) return res.writeHead(404).end();
  try {
    const body = await readFile(path.join(output, name));
    res.setHeader("Content-Type", name.endsWith(".js") ? "text/javascript" : name.endsWith(".css") ? "text/css" : "text/html");
    res.end(body);
  } catch {
    res.writeHead(404).end();
  }
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
let browser;
try {
  browser = await chromium.launch({ channel: "msedge", headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route("**/*", (route) => route.request().url().startsWith(`${origin}/`) ? route.continue() : route.abort());
  await page.goto(origin);
  await page.waitForLoadState("networkidle");
  const edit = page.getByRole("button", { name: "Edit", exact: true });
  const dialog = page.getByRole("dialog", { name: "Edit Profile", exact: true });
  const mobile = dialog.getByRole("textbox", { name: "Mobile Number" });
  const save = dialog.getByRole("button", { name: "Save Changes", exact: true });
  const settle = async () => {
    await page.locator('[data-slot="modal-backdrop"]').first().evaluate(async (element) => {
      await Promise.all(element.getAnimations({ subtree: true }).map((animation) => animation.finished.catch(() => {})));
    });
  };
  const closed = async () => {
    await dialog.waitFor({ state: "hidden" });
    await page.waitForFunction(() => document.querySelectorAll('[role="dialog"]').length === 0);
  };
  const original = await page.getByTestId("profile-details").innerText();
  await edit.click();
  await dialog.waitFor();
  await settle();
  assert.equal(await page.getByTestId("profile-details").innerText(), original, "page details remain unchanged behind modal");
  assert.equal(await save.isDisabled(), true);
  assert.equal(await mobile.evaluate((element) => document.activeElement === element), true, "focus starts in first editable field");
  assert.equal(await dialog.getByRole("textbox", { name: "First Name", exact: true }).getAttribute("readonly"), "");
  await page.keyboard.press("Escape");
  await closed();
  assert.equal(await edit.evaluate((element) => document.activeElement === element), true, "focus returns to Edit");

  await edit.click();
  await settle();
  await page.locator('[data-slot="modal-backdrop"]').click({ position: { x: 4, y: 4 } });
  await closed();

  await edit.click();
  await settle();
  await mobile.fill("09181234567");
  await dialog.getByRole("button", { name: "Close edit profile" }).click();
  const discard = page.getByRole("dialog", { name: "Discard changes?" });
  await discard.waitFor();
  await discard.getByRole("button", { name: "Keep Editing" }).click();
  await discard.waitFor({ state: "hidden" });
  assert.equal(await mobile.inputValue(), "0918 123 4567");
  await mobile.fill("09171234567");
  assert.equal(await save.isDisabled(), true, "reverted edits are pristine");
  await mobile.fill("09181234567");
  await page.keyboard.press("Escape");
  await discard.getByRole("button", { name: "Discard", exact: true }).click();
  await closed();
  await edit.click();
  await settle();
  assert.equal(await mobile.inputValue(), "0917 123 4567", "discarded draft does not survive reopening");

  const gender = dialog.getByRole("button", { name: /Gender/ });
  await gender.click();
  await page.keyboard.press("Escape");
  assert.equal(await dialog.isVisible(), true, "dropdown Escape does not close editor");
  await gender.click();
  await page.getByRole("option", { name: "Female", exact: true }).click();
  await mobile.fill("123");
  await mobile.blur();
  assert.ok(await dialog.getByText(/mobile number/i).count() > 0);
  assert.equal(await mobile.getAttribute("aria-invalid"), "true");
  await mobile.fill("09181234567");
  await page.evaluate(() => { window.fixtureError = "Mobile number could not be saved."; });
  await save.click();
  await dialog.getByText("Mobile number could not be saved.", { exact: true }).waitFor();
  assert.equal(await mobile.inputValue(), "0918 123 4567", "failed save retains draft");
  await page.evaluate(() => { window.fixtureError = null; });
  await mobile.fill("09191234567");
  await mobile.fill("09181234567");
  await save.click();
  await dialog.getByRole("button", { name: "Saving..." }).waitFor();
  await page.keyboard.press("Escape");
  assert.equal(await dialog.isVisible(), true, "cannot dismiss while saving");
  await closed();
  assert.match(await page.getByTestId("profile-details").innerText(), /0918 123 4567/);
  assert.match(await page.getByTestId("profile-details").innerText(), /Female/);
  assert.equal(await page.evaluate(() => window.fixtureWrites.length), 2);
  await edit.click();
  await settle();
  assert.equal(await mobile.inputValue(), "0918 123 4567");
  assert.equal(await save.isDisabled(), true);
  await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
  await closed();

  for (const dark of [false, true]) {
    for (const width of [390, 1280]) {
      await page.setViewportSize({ width, height: 844 });
      await page.evaluate((value) => document.documentElement.classList.toggle("dark", value), dark);
      await edit.click();
      await settle();
      const close = dialog.getByRole("button", { name: "Close edit profile" });
      const closeBox = await close.boundingBox();
      assert.ok(closeBox.width >= 44 && closeBox.height >= 44, "close target is at least 44px");
      const contrast = await close.evaluate((element) => {
        const style = getComputedStyle(element);
        const canvas = document.createElement("canvas");
        canvas.width = canvas.height = 1;
        const context = canvas.getContext("2d");
        const luminance = (color) => {
          context.clearRect(0, 0, 1, 1);
          context.fillStyle = getComputedStyle(element.closest('[role="dialog"]')).backgroundColor;
          context.fillRect(0, 0, 1, 1);
          context.fillStyle = color;
          context.fillRect(0, 0, 1, 1);
          const channels = [...context.getImageData(0, 0, 1, 1).data].slice(0, 3).map((value) => {
            const channel = value / 255;
            return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
          });
          return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
        };
        const foreground = luminance(style.color);
        const background = luminance(style.backgroundColor);
        return (Math.max(foreground, background) + 0.05) / (Math.min(foreground, background) + 0.05);
      });
      assert.ok(contrast >= 3, `close icon contrasts against its surface (${contrast.toFixed(2)}:1), ${await close.evaluate((element) => [getComputedStyle(element).color, getComputedStyle(element).backgroundColor].join(" / "))}`);
      const box = await dialog.boundingBox();
      if (width === 1280) assert.ok(box.width >= 700, "desktop modal keeps wide two-column form");
      assert.ok(box.x >= 0 && box.x + box.width <= width + 1, "modal fits viewport");
      assert.ok(box.y >= 0 && box.y + box.height <= 845, "modal fits viewport height");
      await save.scrollIntoViewIfNeeded();
      await page.screenshot({ path: path.join(output, `profile-${width}-${dark ? "dark" : "light"}.png`) });
      await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
      await closed();
    }
  }
  await page.goto(`${origin}/?standalone=1`);
  await page.waitForLoadState("networkidle");
  assert.equal(await page.getByRole("dialog").count(), 0, "standalone editor stays inline");
  assert.equal(await page.getByRole("heading", { name: "Edit Profile" }).count(), 1);
  assert.deepEqual(errors, []);
  console.log("PASS: unchanged details, focus, locked fields, pristine/reverted drafts, nested discard, dropdown, validation, failed/successful saves, save lock, reopening, responsive light/dark, standalone editor.");
} finally {
  await browser?.close();
  server.close();
}
