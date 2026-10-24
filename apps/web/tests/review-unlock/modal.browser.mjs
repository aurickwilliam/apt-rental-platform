// Production modal + HeroUI + production CSS; only eligibility/navigation are fixtures.
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";

const { chromium } = createRequire(import.meta.url)(process.env.REVIEW_PLAYWRIGHT_PATH || "playwright");
const output = process.env.REVIEW_BROWSER_OUTPUT;
if (!output) throw new Error("Set REVIEW_BROWSER_OUTPUT to the built fixture directory.");
const seenKey = "review-unlock-modal-seen:fixture-tenancy";
const probe = process.argv.includes("--probe");
const sizes = [
  [320, 568], [375, 667], [390, 844], [639, 700], [640, 700],
  [767, 700], [768, 1024], [1024, 768], [1440, 900], [1920, 1080],
  [667, 320], [844, 390], [320, 256],
];

async function geometry(page) {
  return page.evaluate(() => {
    const dialog = document.querySelector('[role="dialog"]');
    const body = document.querySelector('[data-slot="modal-body"]');
    return {
      overflow: document.documentElement.scrollWidth > innerWidth,
      dialog: dialog.getBoundingClientRect().toJSON(),
      body: body.getBoundingClientRect().toJSON(),
      buttons: [...dialog.querySelectorAll("button")].map(button => {
        const rect = button.getBoundingClientRect();
        const hit = document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2);
        return {
          label: button.getAttribute("aria-label") || button.textContent.trim(),
          rect: rect.toJSON(),
          hit: hit && (hit === button || button.contains(hit)),
          hitElement: hit?.outerHTML.slice(0, 180),
          inBody: body.contains(button),
        };
      }),
    };
  });
}

(async () => {
  const server = createServer(async (req, res) => {
    const file = { "/": "index.html", "/fixture.js": "fixture.js", "/styles.css": "styles.css" }[new URL(req.url, "http://localhost").pathname];
    if (!file) { res.writeHead(404).end(); return; }
    res.setHeader("Content-Type", file.endsWith(".js") ? "text/javascript" : file.endsWith(".css") ? "text/css" : "text/html");
    res.end(await readFile(path.join(output, file)));
  });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  let browser;
  const failures = [];
  let checks = 0;
  try {
    browser = await chromium.launch({ channel: process.env.REVIEW_BROWSER_CHANNEL || "msedge", headless: true });
    for (const [width, height] of sizes) {
      for (const dark of [false, true]) {
        const context = await browser.newContext({ viewport: { width, height }, hasTouch: width < 768, isMobile: width < 768 });
        const page = await context.newPage();
        const errors = [];
        page.on("pageerror", error => errors.push(error.message));
        await page.route("**/*", route => route.request().url().startsWith(`${origin}/`) ? route.continue() : route.abort());
        const url = `${origin}/?${dark ? "dark=1&" : ""}name=${encodeURIComponent("CozyCove".repeat(16) + " Apartment with a long name")}`;
        const open = async () => {
          await page.goto(url);
          await page.evaluate(key => localStorage.removeItem(key), seenKey);
          await page.reload();
          await page.waitForLoadState("networkidle");
          await page.getByRole("dialog").waitFor();
        };
        try {
          await open();
          const layout = await geometry(page);
          if (probe) {
            if (!dark) console.log(JSON.stringify({ width, height, ...layout }));
            continue;
          }
          const label = `${width}x${height} ${dark ? "dark" : "light"}`;
          assert.equal(layout.overflow, false, `${label}: document overflow`);
          assert.ok(layout.dialog.x >= 0 && layout.dialog.right <= width + 1, `${label}: dialog width`);
          assert.ok(layout.dialog.y >= 0 && layout.dialog.bottom <= height + 1, `${label}: dialog height`);
          for (const button of layout.buttons) {
            assert.ok(button.hit, `${label}: ${button.label} obstructed (${button.hitElement})`);
            assert.ok(button.rect.y >= 0 && button.rect.bottom <= height + 1, `${label}: ${button.label} offscreen`);
            assert.ok(button.rect.height >= 44 && button.rect.width >= 44, `${label}: ${button.label} touch target`);
            assert.equal(button.inBody, false, `${label}: ${button.label} scrolls with body`);
          }
          await page.getByRole("dialog", { name: /You can now review/ }).waitFor();
          const body = page.locator('[data-slot="modal-body"]');
          await body.evaluate(element => { element.scrollTop = element.scrollHeight; });
          assert.ok((await geometry(page)).buttons.every(button => button.hit), `${label}: scrolling obstructs controls`);
          const activate = async locator => width < 768 ? locator.tap() : locator.click();
          await activate(page.getByRole("button", { name: "Maybe later", exact: true }));
          await page.getByRole("dialog").waitFor({ state: "hidden" });
          assert.equal(await page.evaluate(key => localStorage.getItem(key), seenKey), "1");
          await page.reload();
          await page.waitForLoadState("networkidle");
          assert.equal(await page.getByRole("dialog").count(), 0, "Dismissal survives reload");
          await open();
          await activate(page.getByRole("button", { name: "Write a Review", exact: true }));
          await page.getByRole("dialog").waitFor({ state: "hidden" });
          assert.equal(await page.evaluate(() => window.reviewDestination), "/tenant/browse/fixture-apartment/ratings");
          await open();
          await activate(page.getByRole("button", { name: "Close", exact: true }));
          await page.getByRole("dialog").waitFor({ state: "hidden" });
          await open();
          await page.keyboard.press("Escape");
          await page.getByRole("dialog").waitFor({ state: "hidden" });
          await open();
          await page.mouse.click(2, 2);
          await page.getByRole("dialog").waitFor({ state: "hidden" });
          assert.equal(await page.evaluate(() => window.backgroundClicks), 0);
          await open();
          for (let i = 0; i < 5; i++) {
            await page.keyboard.press("Tab");
            assert.equal(await page.evaluate(() => document.querySelector('[role="dialog"]').contains(document.activeElement)), true, "Focus stays in modal");
          }
          await page.screenshot({ path: path.join(output, `review-${width}x${height}-${dark ? "dark" : "light"}.png`) });
          assert.deepEqual(errors, [], `${label}: browser errors`);
          checks++;
        } catch (error) {
          failures.push({ width, height, dark, error: error.message });
        } finally {
          await context.close();
        }
      }
    }
    if (!probe) {
      // Resize the same open modal across breakpoints, without remounting it.
      for (const dark of [false, true]) {
        const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
        const page = await context.newPage();
        await page.route("**/*", route => route.request().url().startsWith(`${origin}/`) ? route.continue() : route.abort());
        try {
          await page.goto(`${origin}/${dark ? "?dark=1" : ""}`);
          await page.waitForLoadState("networkidle");
          await page.getByRole("dialog", { name: "You can now review Cozy Cove Apartment!" }).waitFor();
          for (const [width, height] of sizes) {
            await page.setViewportSize({ width, height });
            const layout = await geometry(page);
            assert.equal(layout.overflow, false, `resize ${width}x${height}: overflow`);
            assert.ok(layout.buttons.every(button => button.hit), `resize ${width}x${height}: controls obstructed`);
            const actions = layout.buttons.filter(button => button.label !== "Close");
            assert.ok(width < 640
              ? actions[0].rect.bottom <= actions[1].rect.top
              : Math.abs(actions[0].rect.top - actions[1].rect.top) < 1, `resize ${width}x${height}: action layout`);
            if ([390, 667, 1440].includes(width)) {
              await page.screenshot({ path: path.join(output, `review-normal-${width}x${height}-${dark ? "dark" : "light"}.png`) });
            }
            checks++;
          }
          await page.getByRole("button", { name: "Maybe later", exact: true }).click();
          await page.getByRole("dialog").waitFor({ state: "hidden" });
        } catch (error) {
          failures.push({ scenario: "resize open modal", dark, error: error.message });
        } finally {
          await context.close();
        }
      }
    }
  } finally {
    await browser?.close();
    await new Promise(resolve => server.close(resolve));
  }
  console.log(JSON.stringify({ checkedLayouts: checks, failures }, null, 2));
  if (failures.length) process.exitCode = 1;
})().catch(error => { console.error(error); process.exitCode = 1; });
