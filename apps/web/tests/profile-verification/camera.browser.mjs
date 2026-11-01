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
const errors = [];
try {
  browser = await chromium.launch({
    channel: process.env.VERIFICATION_BROWSER_CHANNEL || "msedge", headless: true,
    args: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"],
  });
  const context = await browser.newContext({ ...devices["Pixel 7"], permissions: ["camera"] });
  await context.route("**/*", route => route.request().url().startsWith(`${origin}/`) ? route.continue() : route.abort());
  await context.addInitScript(() => {
    window.fixtureAllowSubmission = true;
    window.fixtureMediaRequests = [];
    window.fixtureStreams = [];
    const realGetUserMedia = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
    navigator.mediaDevices.getUserMedia = async constraints => {
      window.fixtureMediaRequests.push(constraints);
      const mode = window.fixtureCameraMode;
      if (mode && !["pending", "nullBlob", "playFailure"].includes(mode)) throw new DOMException("Synthetic camera failure", mode);
      if (mode === "pending") await new Promise(resolve => { window.fixtureReleaseCamera = resolve; });
      const stream = await realGetUserMedia(constraints);
      window.fixtureStreams.push(stream);
      return stream;
    };
    const realPlay = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function () {
      if (window.fixtureCameraMode === "playFailure") return Promise.reject(new DOMException("Synthetic play failure", "NotReadableError"));
      return realPlay.call(this);
    };
    const realToBlob = HTMLCanvasElement.prototype.toBlob;
    HTMLCanvasElement.prototype.toBlob = function (callback, ...args) {
      if (window.fixtureCameraMode === "nullBlob") { callback(null); return; }
      realToBlob.call(this, callback, ...args);
    };
  });
  const page = await context.newPage();
  page.on("pageerror", error => errors.push(error.message));
  const button = name => page.getByRole("button", { name, exact: true });
  const noGallery = async () => {
    assert.equal(await page.locator('input[type="file"], input[capture]').count(), 0);
    assert.equal(await page.getByRole("button", { name: /upload photo/i }).count(), 0);
  };
  const front = async (id = "National ID (PhilSys/PhilID)") => {
    await page.goto(`${origin}/verify/mobile?token=${"a".repeat(43)}`);
    await button("Continue").click();
    assert.equal(await button("Continue").isDisabled(), true, "an ID type is required");
    await page.getByText(id, { exact: true }).click();
    await button("Continue").click();
    await button("Enable camera").waitFor();
    await noGallery();
    assert.equal(await button("Submit for Review").count(), 0);
  };
  const enable = async () => {
    await button("Enable camera").click();
    await button("Capture").waitFor();
  };
  const capture = async () => { await enable(); await button("Capture").click(); };
  const allStopped = () => page.waitForFunction(() => window.fixtureStreams.every(stream => stream.getTracks().every(track => track.readyState === "ended")));

  await front();
  await page.evaluate(() => {
    const data = new DataTransfer();
    data.items.add(new File(["not a camera capture"], "gallery.jpg", { type: "image/jpeg" }));
    document.querySelector("main").dispatchEvent(new DragEvent("drop", { dataTransfer: data, bubbles: true }));
    document.querySelector("main").dispatchEvent(new ClipboardEvent("paste", { clipboardData: data, bubbles: true }));
  });
  assert.equal(await page.getByRole("progressbar").getAttribute("aria-valuenow"), "3");
  assert.equal(await page.locator('img[alt$="preview"]').count(), 0);
  await page.evaluate(() => { window.fixtureCameraMode = "NotAllowedError"; });
  await button("Enable camera").click();
  assert.match(await page.getByRole("alert").innerText(), /site controls.*allow Camera/i);
  await noGallery();
  assert.equal(await button("Capture").count(), 0);
  assert.equal(await page.getByRole("progressbar").getAttribute("aria-valuenow"), "3");
  await page.evaluate(() => { window.fixtureCameraMode = null; });
  await button("Try camera again").click();
  await button("Capture").waitFor();
  await button("Capture").click();
  await page.getByText("Flip your ID over and capture the back.", { exact: true }).waitFor();
  await allStopped();
  await noGallery();
  await capture();
  await page.getByText("Hold your ID beside your face with your full face visible.", { exact: true }).waitFor();
  await noGallery();
  await capture();
  await page.getByRole("heading", { name: "Review your submission", exact: true }).waitFor();
  assert.equal(await page.locator('img[alt$="preview"]').count(), 3);
  assert.equal(await page.getByRole("progressbar").getAttribute("aria-valuenow"), "6");
  await allStopped();
  assert.deepEqual(await page.evaluate(() => window.fixtureMediaRequests.map(request => request.video.facingMode.ideal)), ["environment", "environment", "environment", "user"]);
  assert.equal(await page.evaluate(() => window.fixtureUploads?.length || 0), 0);
  console.log("PASS denied permission → retry → live front/back/selfie captures; progress, previews, lens preferences, stopped tracks and no gallery inputs");

  await page.getByRole("button", { name: /^Retake / }).first().click();
  await button("Enable camera").waitFor();
  assert.equal(await button("Submit for Review").count(), 0);
  await button("Back").click();
  await page.getByText("Passport", { exact: true }).click();
  await button("Continue").click();
  await capture();
  await page.getByText("Hold your ID beside your face with your full face visible.", { exact: true }).waitFor();
  await capture();
  await page.getByRole("heading", { name: "Review your submission", exact: true }).waitFor();
  assert.equal(await page.locator('img[alt$="preview"]').count(), 2, "changing ID type retires earlier photos; Passport skips the back");
  assert.equal(await page.getByRole("progressbar").getAttribute("aria-valuemax"), "5");
  await page.getByRole("button", { name: /^Retake / }).last().click();
  await capture();
  await button("Submit for Review").click();
  await button("Go back and review").click();
  assert.equal(await page.evaluate(() => window.fixtureUploads?.length || 0), 0, "confirmation is required before uploads");
  await button("Submit for Review").click();
  await button("Confirm & submit").click();
  await page.getByRole("heading", { name: "Your verification has been submitted.", exact: true }).waitFor();
  const uploads = await page.evaluate(() => window.fixtureUploads);
  assert.equal(uploads.length, 2);
  assert.ok(uploads.every(upload => upload.size > 0 && upload.type === "image/jpeg"));
  assert.deepEqual(uploads.map(upload => upload.path), ["fixture-user/fixture-verification/id-front.jpg", "fixture-user/fixture-verification/selfie.jpg"]);
  assert.equal(await page.evaluate(() => window.fixtureSubmissions), 1);
  console.log("PASS retake, Back, document-type change, Passport exception, review/confirmation and isolated successful submission");

  for (const [mode, message] of [["NotFoundError", /No camera was found/], ["NotReadableError", /other apps or tabs/], ["OverconstrainedError", /No suitable camera/], ["SecurityError", /blocked/], ["playFailure", /other apps or tabs/]]) {
    await front();
    await page.evaluate(value => { window.fixtureCameraMode = value; }, mode);
    await button("Enable camera").click();
    assert.match(await page.getByRole("alert").innerText(), message);
    await button("Try camera again").waitFor();
    await allStopped();
    await noGallery();
  }
  await front();
  await page.evaluate(() => { navigator.mediaDevices.getUserMedia = undefined; });
  await button("Enable camera").click();
  assert.match(await page.getByRole("alert").innerText(), /does not support camera/);
  await noGallery();
  await front();
  await page.evaluate(() => Object.defineProperty(window, "isSecureContext", { value: false, configurable: true }));
  await button("Enable camera").click();
  assert.match(await page.getByRole("alert").innerText(), /HTTPS/);
  assert.equal(await page.evaluate(() => window.fixtureMediaRequests.length), 0);
  console.log("PASS missing camera, hardware failure, unsuitable settings, blocked/unsupported browser, video playback failure and insecure-origin guidance");

  await front();
  await enable();
  await page.evaluate(() => window.fixtureStreams[0].getVideoTracks()[0].dispatchEvent(new Event("ended")));
  assert.match(await page.getByRole("alert").innerText(), /camera stopped/);
  await allStopped();
  await button("Try camera again").click();
  await button("Capture").waitFor();
  await button("Back").click();
  await allStopped();

  await front();
  await enable();
  await page.evaluate(() => { window.fixtureCameraMode = "nullBlob"; });
  await button("Capture").click();
  assert.match(await page.getByRole("alert").innerText(), /could not be captured/);
  assert.equal(await page.getByRole("progressbar").getAttribute("aria-valuenow"), "3");
  await allStopped();
  await front();
  await page.evaluate(() => { window.fixtureCameraMode = "pending"; });
  await button("Enable camera").click();
  await page.waitForFunction(() => !!window.fixtureReleaseCamera);
  await button("Back").click();
  await page.evaluate(() => window.fixtureReleaseCamera());
  await page.waitForFunction(() => window.fixtureStreams.length === 1);
  await allStopped();
  await page.getByRole("heading", { name: "Select your ID type", exact: true }).waitFor();
  console.log("PASS failed frame encoding cannot advance; permission resolving after Back releases its stream");

  await front();
  await enable();
  await page.clock.install();
  await page.clock.fastForward(601000);
  await page.getByRole("heading", { name: "This code has expired", exact: true }).waitFor();
  await allStopped();
  assert.equal(await button("Capture").count(), 0);
  assert.equal(await page.evaluate(() => window.fixtureSubmissions || 0), 0);
  console.log("PASS expiration stops the camera and blocks capture/submission");

  for (const query of ["id=false&selfie=false", "id=true&selfie=false", "id=false&selfie=true"]) {
    await page.goto(`${origin}/confirmation?${query}`);
    await button("Confirm & submit").waitFor();
    assert.equal(await button("Confirm & submit").isDisabled(), true);
    assert.equal(await button("Go back and review").isEnabled(), true);
    assert.equal(await page.evaluate(() => window.fixtureConfirmations || 0), 0);
  }
  assert.deepEqual(errors, []);
  console.log("PASS incomplete final confirmation is disabled without trapping the user; no uncaught browser errors");
  await context.close();
} finally {
  await browser?.close();
  await new Promise(resolve => server.close(resolve));
}
