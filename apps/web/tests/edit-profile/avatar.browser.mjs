import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";

const { chromium } = createRequire(import.meta.url)(process.env.PROFILE_PLAYWRIGHT_PATH || "playwright");
const output = process.env.PROFILE_BROWSER_OUTPUT;
if (!output) throw new Error("Set PROFILE_BROWSER_OUTPUT to the built fixture directory.");
let pixel;
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
  pixel = Buffer.from(await page.evaluate(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 120;
    canvas.height = 60;
    const context = canvas.getContext("2d");
    context.fillStyle = "#376bf5";
    context.fillRect(0, 0, 120, 60);
    return canvas.toDataURL("image/png").split(",")[1];
  }), "base64");
  await page.route("**/*", (route) => route.request().url().startsWith(`${origin}/`) || route.request().url().startsWith("blob:") ? route.continue() : route.abort());
  await page.goto(`${origin}/?avatar=1`);
  await page.waitForLoadState("networkidle");
  const trigger = page.getByRole("button", { name: "View profile photo", exact: true });
  const viewer = page.getByRole("dialog", { name: "Preview Tenant · Profile photo", exact: true });
  const camera = page.getByRole("button", { name: "Edit profile photo", exact: true });
  const editor = page.getByRole("dialog", { name: "Edit Profile Photo", exact: true });
  const save = editor.getByRole("button", { name: "Save Changes", exact: true });
  const preview = editor.getByAltText("Profile photo preview");
  const savedPhoto = page.getByTestId("profile-details").locator("img");
  const file = { name: "preview.png", mimeType: "image/png", buffer: pixel };
  const choose = async () => {
    const chooser = page.waitForEvent("filechooser");
    await editor.getByRole("button", { name: "Choose photo", exact: true }).click();
    await (await chooser).setFiles(file);
    await preview.waitFor();
  };
  const cameraOpacity = () => camera.evaluate((element) => getComputedStyle(element).opacity);
  assert.equal(await cameraOpacity(), "0", "camera is hidden away from the avatar");
  await trigger.hover();
  assert.equal(await cameraOpacity(), "1", "hovering avatar reveals camera");
  await page.mouse.move(0, 0);
  assert.equal(await cameraOpacity(), "0", "leaving avatar hides camera");
  await page.keyboard.press("Tab");
  assert.equal(await trigger.evaluate((element) => document.activeElement === element), true);
  assert.equal(await cameraOpacity(), "1", "keyboard focus reveals camera");
  await page.keyboard.press("Tab");
  assert.equal(await camera.evaluate((element) => document.activeElement === element), true, "camera stays keyboard reachable");
  const closed = () => page.waitForFunction(() => document.querySelectorAll('[role="dialog"]').length === 0);
  const assertViewer = async () => {
    await viewer.waitFor();
    assert.equal(await viewer.getByRole("img", { name: "Preview Tenant Profile photo", exact: true }).getAttribute("src"), `${origin}/initial.png`);
    assert.equal(await viewer.getByRole("button", { name: /Save|Change|Remove|Cancel/ }).count(), 0, "viewer has no editing controls");
    assert.equal(await page.evaluate(() => window.fixturePhotoWrites.length), 0, "viewing never writes");
  };
  await trigger.click();
  await assertViewer();
  await page.keyboard.press("Escape");
  await closed();
  assert.equal(await trigger.evaluate((element) => document.activeElement === element), true);
  for (const key of ["Enter", "Space"]) {
    await trigger.focus();
    await page.keyboard.press(key);
    await assertViewer();
    await viewer.getByRole("button", { name: "Close photo gallery" }).click();
    await closed();
    assert.equal(await trigger.evaluate((element) => document.activeElement === element), true);
  }

  // The camera remains a sibling editing control, never a nested viewer button.
  await camera.click();
  await editor.waitFor();
  assert.equal(await viewer.count(), 0, "camera does not open viewer");
  assert.equal(await save.isDisabled(), true, "save starts disabled");
  await choose();
  assert.match(await preview.getAttribute("src"), /^blob:/);
  assert.equal(await savedPhoto.getAttribute("src"), `${origin}/initial.png`, "header photo stays saved while previewing");
  await editor.getByRole("button", { name: "Cancel", exact: true }).click();
  await closed();
  assert.equal(await camera.evaluate((element) => document.activeElement === element), true);
  assert.equal(await trigger.isEnabled(), true);
  assert.equal(await page.evaluate(() => window.fixturePhotoWrites.length), 0, "preview cancellation never uploads");

  for (const dark of [false, true]) {
    for (const width of [390, 1280]) {
      await page.setViewportSize({ width, height: 844 });
      await page.evaluate((value) => document.documentElement.classList.toggle("dark", value), dark);
      await trigger.click();
      await assertViewer();
      await page.locator('[data-slot="modal-backdrop"]').evaluate(async (element) => {
        await Promise.all(element.getAnimations({ subtree: true }).map((animation) => animation.finished.catch(() => {})));
      });
      const box = await viewer.boundingBox();
      assert.ok(box.x >= 0 && box.x + box.width <= width + 1);
      await page.screenshot({ path: path.join(output, `avatar-${width}-${dark ? "dark" : "light"}.png`) });
      await viewer.getByRole("button", { name: "Close photo gallery" }).click();
      await closed();
      await camera.click();
      await editor.waitFor();
      await choose();
      const editorBox = await editor.boundingBox();
      assert.ok(editorBox.x >= 0 && editorBox.x + editorBox.width <= width + 1);
      await page.screenshot({ path: path.join(output, `avatar-editor-${width}-${dark ? "dark" : "light"}.png`) });
      await editor.getByRole("button", { name: "Close edit profile photo", exact: true }).click();
      await closed();
    }
  }

  await camera.click();
  await editor.waitFor();
  assert.equal(await preview.getAttribute("src"), `${origin}/initial.png`, "closed drafts do not survive reopening");
  await editor.locator('input[type="file"]').setInputFiles({ name: "invalid.txt", mimeType: "text/plain", buffer: Buffer.from("invalid") });
  await editor.getByText("Please choose a JPG, PNG, or WebP image.", { exact: true }).waitFor();
  await editor.locator('input[type="file"]').setInputFiles({ name: "large.png", mimeType: "image/png", buffer: Buffer.alloc(5 * 1024 * 1024 + 1) });
  await editor.getByText("Image must be 5MB or smaller.", { exact: true }).waitFor();
  await choose();
  await page.evaluate(() => { window.fixturePhotoError = "Upload failed. Try again."; });
  await save.click();
  await editor.getByText("Upload failed. Try again.", { exact: true }).waitFor();
  assert.match(await preview.getAttribute("src"), /^blob:/, "failed save retains draft");
  assert.equal(await savedPhoto.getAttribute("src"), `${origin}/initial.png`);
  await page.evaluate(() => { window.fixturePhotoError = null; });
  await save.click();
  await editor.getByRole("button", { name: "Saving..." }).waitFor();
  assert.equal(await editor.getByRole("button", { name: "Close edit profile photo" }).isDisabled(), true);
  await page.keyboard.press("Escape");
  assert.equal(await editor.isVisible(), true, "saving blocks dismissal");
  await closed();
  assert.match(await savedPhoto.getAttribute("src"), /saved\.png\?t=/);
  const writes = await page.evaluate(() => window.fixturePhotoWrites);
  assert.equal(writes[0].type, "image/jpeg", "real avatar compression runs");
  assert.equal(writes[0].bucket, "avatars");
  assert.equal(writes.at(-1).id, "preview-user");
  assert.match(writes.at(-1).values.avatar_url, /saved\.png\?t=/);
  await camera.click();
  await editor.getByRole("button", { name: "Remove photo", exact: true }).click();
  const confirmation = page.getByRole("dialog", { name: "Remove profile photo?", exact: true });
  await confirmation.getByRole("button", { name: "Keep", exact: true }).click();
  await confirmation.waitFor({ state: "hidden" });
  await editor.getByRole("button", { name: "Remove photo", exact: true }).click();
  await page.evaluate(() => { window.fixturePhotoError = "Could not remove photo."; });
  await confirmation.getByRole("button", { name: "Remove photo", exact: true }).click();
  await confirmation.getByText("Could not remove photo.", { exact: true }).waitFor();
  assert.match(await savedPhoto.getAttribute("src"), /saved\.png\?t=/, "failed removal retains saved photo");
  await page.evaluate(() => { window.fixturePhotoError = null; });
  await confirmation.getByRole("button", { name: "Remove photo", exact: true }).click();
  await confirmation.getByRole("button", { name: "Removing..." }).waitFor();
  await page.keyboard.press("Escape");
  assert.equal(await confirmation.isVisible(), true);
  await closed();
  assert.equal(await trigger.count(), 0, "removed avatar restores initials fallback");
  assert.equal(await page.evaluate(() => window.fixturePhotoWrites.at(-1).values.avatar_url), null);

  const touch = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await touch.route("**/*", (route) => route.request().url().startsWith(`${origin}/`) ? route.continue() : route.abort());
  await touch.goto(`${origin}/?avatar=1`);
  await touch.waitForLoadState("networkidle");
  assert.equal(await touch.getByRole("button", { name: "Edit profile photo", exact: true }).evaluate((element) => getComputedStyle(element).opacity), "1", "camera stays visible on touch devices");
  await touch.getByRole("button", { name: "View profile photo", exact: true }).tap();
  await touch.getByRole("dialog", { name: "Preview Tenant · Profile photo", exact: true }).waitFor();
  await touch.getByRole("button", { name: "Close photo gallery" }).tap();
  await touch.waitForFunction(() => document.querySelectorAll('[role="dialog"]').length === 0);
  await touch.getByRole("button", { name: "Edit profile photo", exact: true }).tap();
  await touch.getByRole("dialog", { name: "Edit Profile Photo", exact: true }).waitFor();
  await touch.close();

  await page.goto(`${origin}/?avatar=1&empty=1`);
  await page.waitForLoadState("networkidle");
  assert.equal(await trigger.count(), 0, "initials fallback is not selectable");
  await camera.click();
  await editor.waitFor();
  assert.equal(await editor.getByRole("button", { name: "Remove photo", exact: true }).isDisabled(), true);
  assert.deepEqual(errors, []);
  console.log("PASS: avatar viewer/editor separation, hover/keyboard/touch, local preview isolation, cancel/reopen, validation, JPEG compression, save/remove failure/retry and dismissal locks, nested confirmation, initials fallback and responsive light/dark layouts.");
} finally {
  await browser?.close();
  server.close();
}
