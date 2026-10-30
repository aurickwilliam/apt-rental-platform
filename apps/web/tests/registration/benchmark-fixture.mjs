// Informational, repeatable UI timings; not a CI threshold or real signup test.
// Uses the same isolated build/browser variables as check-fixture.mjs.
import { createRequire } from "node:module";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";

const root = process.argv[2];
if (!root || !process.env.REGISTRATION_PLAYWRIGHT_PATH) throw new Error("Supply fixture directory and REGISTRATION_PLAYWRIGHT_PATH.");
const { chromium } = createRequire(import.meta.url)(process.env.REGISTRATION_PLAYWRIGHT_PATH);
const server = createServer(async (req, res) => {
  const file = new URL(req.url, "http://localhost").pathname.slice(1) || "index.html";
  if (path.basename(file) !== file) { res.writeHead(404); res.end(); return; }
  try {
    const body = await readFile(path.join(root, file));
    res.setHeader("content-type", file.endsWith(".js") ? "text/javascript" : file.endsWith(".css") ? "text/css" : "text/html");
    // Model a slower first policy download, equally for baseline and optimized UI.
    if (file.startsWith("RegistrationPolicyContent-")) await new Promise(resolve => setTimeout(resolve, 250));
    res.end(body);
  } catch { res.writeHead(404); res.end(); }
});
await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
const browser = await chromium.launch({ headless: true, ...(process.env.REGISTRATION_BROWSER_PATH ? { executablePath: process.env.REGISTRATION_BROWSER_PATH } : {}) });
const samples = { coldOpen: [], intentOpen: [], visitedTab: [], reopen: [] };
try {
  for (let run = 0; run < 3; run++) {
    for (const intent of [false, true]) {
      const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
      const cdp = await page.context().newCDPSession(page);
      await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
      await page.goto(`http://127.0.0.1:${server.address().port}`);
      await page.waitForLoadState("networkidle");
      const trigger = page.getByRole("form", { name: "Email registration", exact: true }).getByRole("button", { name: "Privacy Policy", exact: true });
      const dialog = page.getByRole("dialog", { name: "Policies", exact: true });
      const article = name => dialog.getByRole("article", { name, exact: true });
      const measure = async (action, ready) => {
        await page.evaluate(() => { window.policyBenchmarkStart = performance.now(); });
        await action();
        await ready.waitFor({ state: "visible" });
        return page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => resolve(performance.now() - window.policyBenchmarkStart))));
      };
      if (intent) {
        await trigger.hover();
        // Intent scenario deliberately gives the same 1s hover dwell to both
        // builds. networkidle alone may already be settled before React's
        // hover handler starts the download, so it is not a dwell substitute.
        await page.waitForTimeout(1000);
        await page.waitForLoadState("networkidle");
      }
      samples[intent ? "intentOpen" : "coldOpen"].push(await measure(() => trigger.click(), article("Privacy Policy")));
      await dialog.getByRole("tab", { name: "Terms and Conditions", exact: true }).click();
      await article("Terms and Conditions").waitFor();
      samples.visitedTab.push(await measure(() => dialog.getByRole("tab", { name: "Privacy Policy", exact: true }).click(), article("Privacy Policy")));
      await dialog.getByRole("button", { name: "Close", exact: true }).click();
      await dialog.waitFor({ state: "hidden" });
      samples.reopen.push(await measure(() => trigger.click(), article("Privacy Policy")));
      await page.close();
    }
  }
  console.log("Median ms; isolated development fixture, 4x CPU slowdown, 250ms policy response delay:");
  for (const [name, values] of Object.entries(samples)) {
    values.sort((a, b) => a - b);
    console.log(`${name}: ${Math.round(values[Math.floor(values.length / 2)])} (${values.length} samples)`);
  }
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
