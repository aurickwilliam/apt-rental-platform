import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";

const { chromium } = createRequire(import.meta.url)(process.env.PROFILE_PLAYWRIGHT_PATH || "playwright");
const output = process.env.PROFILE_BROWSER_OUTPUT;
if (!output) throw new Error("Set PROFILE_BROWSER_OUTPUT to the built fixture directory.");
const pixel = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a4JkAAAAASUVORK5CYII=", "base64");
const server = createServer(async (req, res) => {
  const name = new URL(req.url, "http://localhost").pathname.slice(1) || "index.html";
  if (["initial.png", "saved.png"].includes(name)) {
    res.setHeader("Content-Type", "image/png");
    return res.end(pixel);
  }
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
  await page.route("**/*", (route) => route.request().url().startsWith(`${origin}/`) || route.request().url().startsWith("blob:") ? route.continue() : route.abort());
  await page.goto(`${origin}/?cover=1`);
  await page.waitForLoadState("networkidle");
  const open = page.getByRole("button", { name: "Edit cover photo", exact: true });
  const coverTrigger = page.getByRole("button", { name: "View cover photo", exact: true });
  const viewer = page.getByRole("dialog", { name: "Profile · Cover photo", exact: true });
  const dialog = page.getByRole("dialog", { name: "Edit Cover Photo", exact: true });
  const save = dialog.getByRole("button", { name: "Save Changes", exact: true });
  const banner = page.getByTestId("profile-details").locator("img");
  const preview = dialog.getByAltText("Cover photo preview");
  const toolbar = page.locator(".profile-cover-toolbar");
  const toolbarOpacity = () => toolbar.evaluate((element) => getComputedStyle(element).opacity);
  assert.equal(await toolbarOpacity(), "0", "desktop button is hidden away from cover");
  await page.locator(".profile-cover-banner").hover({ position: { x: 8, y: 80 } });
  assert.equal(await toolbarOpacity(), "1", "hover anywhere on cover reveals editing");
  await page.mouse.move(0, 0);
  assert.equal(await toolbarOpacity(), "0", "leaving cover hides editing");
  await page.keyboard.press("Tab");
  assert.equal(await coverTrigger.evaluate((element) => document.activeElement === element), true);
  assert.equal(await toolbarOpacity(), "1", "keyboard focus reveals editing");
  await coverTrigger.blur();
  const settle = async () => {
    await page.locator('[data-slot="modal-backdrop"]').first().evaluate(async (element) => {
      await Promise.all(element.getAnimations({ subtree: true }).map((animation) => animation.finished.catch(() => {})));
    });
  };
  const closed = () => page.waitForFunction(() => document.querySelectorAll('[role="dialog"]').length === 0);
  await coverTrigger.click({ position: { x: 8, y: 80 } });
  await settle();
  await viewer.waitFor();
  assert.equal(await viewer.getByRole("img", { name: "Profile Cover photo", exact: true }).getAttribute("src"), `${origin}/initial.png`);
  assert.equal(await viewer.getByRole("button", { name: /Save|Choose|Remove|Cancel/ }).count(), 0, "viewing has no editing controls");
  assert.equal(await dialog.count(), 0, "banner does not open editor");
  assert.equal(await page.evaluate(() => window.fixturePhotoWrites.length), 0, "viewing never writes");
  await page.keyboard.press("Escape");
  await closed();
  assert.equal(await coverTrigger.evaluate((element) => document.activeElement === element), true, "banner click restores focus to banner");
  for (const key of ["Enter", "Space"]) {
    await coverTrigger.focus();
    await page.keyboard.press(key);
    await settle();
    await viewer.getByRole("button", { name: "Close photo gallery", exact: true }).click();
    await closed();
    assert.equal(await coverTrigger.evaluate((element) => document.activeElement === element), true, "keyboard activation restores banner focus");
  }
  const file = {
    name: "cover.png", mimeType: "image/png",
    buffer: Buffer.from(await page.evaluate(() => {
      const canvas = document.createElement("canvas");
      canvas.width = 120;
      canvas.height = 60;
      const context = canvas.getContext("2d");
      context.fillStyle = "#376bf5";
      context.fillRect(0, 0, 120, 60);
      return canvas.toDataURL("image/png").split(",")[1];
    }), "base64"),
  };
  const choose = async () => {
    const chooser = page.waitForEvent("filechooser");
    await dialog.getByRole("button", { name: "Choose photo" }).click();
    await (await chooser).setFiles(file);
  };
  await open.click();
  await settle();
  assert.equal(await preview.getAttribute("src"), `${origin}/initial.png`);
  assert.equal(await save.isDisabled(), true);
  await choose();
  assert.match(await preview.getAttribute("src"), /^blob:/);
  assert.equal(await banner.getAttribute("src"), `${origin}/initial.png`, "page shows only saved cover");
  assert.equal(await page.evaluate(() => window.fixturePhotoWrites.length), 0, "selection never uploads");
  await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
  await closed();
  assert.equal(await open.evaluate((element) => document.activeElement === element), true);
  await open.click();
  await settle();
  assert.equal(await preview.getAttribute("src"), `${origin}/initial.png`, "cancel clears preview");
  await dialog.locator('input[type="file"]').setInputFiles({ name: "invalid.txt", mimeType: "text/plain", buffer: Buffer.from("not an image") });
  await dialog.getByText("Please choose a JPG, PNG, or WebP image.", { exact: true }).waitFor();
  assert.equal(await page.evaluate(() => window.fixturePhotoWrites.length), 0);
  await dialog.locator('input[type="file"]').setInputFiles({ name: "too-large.png", mimeType: "image/png", buffer: Buffer.alloc(5 * 1024 * 1024 + 1) });
  await dialog.getByText("Image must be 5MB or smaller.", { exact: true }).waitFor();
  assert.equal(await save.isDisabled(), true);
  await choose();
  await page.evaluate(() => { window.fixturePhotoError = "Upload failed. Try again."; });
  await save.click();
  await dialog.getByText("Upload failed. Try again.", { exact: true }).waitFor();
  assert.match(await preview.getAttribute("src"), /^blob:/, "failed save retains preview");
  assert.equal(await banner.getAttribute("src"), `${origin}/initial.png`);
  await page.evaluate(() => { window.fixturePhotoError = null; });
  await save.click();
  await dialog.getByRole("button", { name: "Saving..." }).waitFor();
  assert.equal(await dialog.getByRole("button", { name: "Close edit cover photo" }).isDisabled(), true);
  await page.keyboard.press("Escape");
  assert.equal(await dialog.isVisible(), true, "cannot dismiss while saving");
  await closed();
  assert.match(await banner.getAttribute("src"), /\/saved\.png\?t=/);
  const writes = await page.evaluate(() => window.fixturePhotoWrites);
  assert.equal(writes.filter((write) => write.kind === "upload").length, 2);
  assert.equal(writes[0].type, "image/jpeg", "real compression pipeline runs");
  assert.equal(writes.at(-1).values.background_url.startsWith(`${origin}/saved.png`), true);
  assert.equal(writes.at(-1).id, "preview-user", "write stays account-bound");

  await open.click();
  await settle();
  await dialog.getByRole("button", { name: "Remove cover", exact: true }).click();
  const confirm = page.getByRole("dialog", { name: "Remove cover photo?", exact: true });
  await confirm.getByRole("button", { name: "Keep", exact: true }).click();
  await confirm.waitFor({ state: "hidden" });
  assert.match(await banner.getAttribute("src"), /saved\.png/);
  await dialog.getByRole("button", { name: "Remove cover", exact: true }).click();
  await page.evaluate(() => { window.fixturePhotoError = "Could not remove the cover."; });
  await confirm.getByRole("button", { name: "Remove cover", exact: true }).click();
  await confirm.getByText("Could not remove the cover.", { exact: true }).waitFor();
  assert.match(await banner.getAttribute("src"), /saved\.png/, "failed removal keeps cover");
  await page.evaluate(() => { window.fixturePhotoError = null; });
  await confirm.getByRole("button", { name: "Remove cover", exact: true }).click();
  await confirm.getByRole("button", { name: "Removing..." }).waitFor();
  await page.keyboard.press("Escape");
  assert.equal(await confirm.isVisible(), true, "cannot dismiss removal while busy");
  await closed();
  assert.equal(await banner.count(), 0, "successful removal restores fallback");
  assert.equal(await coverTrigger.count(), 0, "no viewer trigger without a saved photo");
  assert.equal(await page.evaluate(() => window.fixturePhotoWrites.at(-1).values.background_url), null);

  for (const dark of [false, true]) {
    for (const width of [390, 1280]) {
      await page.setViewportSize({ width, height: 844 });
      await page.evaluate((value) => document.documentElement.classList.toggle("dark", value), dark);
      await open.click();
      await settle();
      assert.equal(await dialog.getByRole("button", { name: "Remove cover", exact: true }).isDisabled(), true);
      await choose();
      const box = await dialog.boundingBox();
      assert.ok(box.x >= 0 && box.x + box.width <= width + 1);
      assert.ok(box.y >= 0 && box.y + box.height <= 845);
      await page.screenshot({ path: path.join(output, `cover-${width}-${dark ? "dark" : "light"}.png`) });
      await dialog.getByRole("button", { name: "Close edit cover photo" }).click();
      await closed();
      assert.equal(await banner.count(), 0, "close discards preview without changing fallback");
    }
  }
  await open.click();
  await settle();
  await page.keyboard.press("Escape");
  await closed();
  await open.click();
  await settle();
  await page.locator('[data-slot="modal-backdrop"]').click({ position: { x: 4, y: 4 } });
  await closed();
  assert.deepEqual(errors, []);
  const touchPage = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await touchPage.route("**/*", (route) => route.request().url().startsWith(`${origin}/`) ? route.continue() : route.abort());
  await touchPage.goto(`${origin}/?cover=1`);
  await touchPage.waitForLoadState("networkidle");
  assert.equal(await touchPage.locator(".profile-cover-toolbar").evaluate((element) => getComputedStyle(element).opacity), "1", "touch devices retain visible editing");
  await touchPage.getByRole("button", { name: "View cover photo", exact: true }).tap({ position: { x: 8, y: 80 } });
  await touchPage.getByRole("dialog", { name: "Profile · Cover photo", exact: true }).waitFor();
  await touchPage.close();
  console.log("PASS: cover modal, chooser/local preview, saved banner isolation, cancellation, file validation, compression, save/failure/retry, save lock, nested removal/failure/retry, empty state, light/dark responsive layouts and focus restoration.");
} finally {
  await browser?.close();
  server.close();
}
