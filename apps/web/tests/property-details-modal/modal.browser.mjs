// Production My Properties table + drawer + edit dialog + HeroUI + production
// CSS. Only Supabase transport, Next navigation and two out-of-scope children
// are fixtures, and every external request is blocked.
//
// Regression: opening Edit from the table's overflow menu mounts the details
// drawer and the edit dialog in the same commit. The dialog must still be the
// interactive top layer on that first open (previously its overlay was marked
// inert by the drawer's ariaHideOutside pass, so typing did nothing and the
// first click dismissed the dialog).
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";

const { chromium } = createRequire(import.meta.url)(
  process.env.PROPERTY_MODAL_PLAYWRIGHT_PATH || "playwright",
);
const output = process.env.PROPERTY_MODAL_BROWSER_OUTPUT;
if (!output) {
  throw new Error("Set PROPERTY_MODAL_BROWSER_OUTPUT to the built fixture directory.");
}

const server = createServer(async (req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
  const file = pathname === "/" ? "index.html" : pathname.slice(1);
  if (!file || file.includes("/") || file.includes("\\")) {
    res.writeHead(404).end();
    return;
  }
  try {
    const body = await readFile(path.join(output, file));
    const type = file.endsWith(".js")
      ? "text/javascript"
      : file.endsWith(".css")
        ? "text/css"
        : "text/html";
    res.setHeader("Content-Type", type);
    res.end(body);
  } catch {
    res.writeHead(404).end();
  }
});

const activeElementInsideDialog = () =>
  page.evaluate(() => {
    const dialog = document.querySelector('[data-slot="modal-dialog"]');
    return !!dialog && dialog.contains(document.activeElement);
  });

const dialogCount = () =>
  page.evaluate(() => document.querySelectorAll('[data-slot="modal-dialog"]').length);

// HeroUI animates the overlay (not the inner dialog) in; hit tests and
// screenshots must wait for it to reach its resting opacity and geometry.
const settleAnimations = () =>
  page.locator('[data-slot="modal-backdrop"]').evaluate(async (element) => {
    await Promise.all(
      element
        .getAnimations({ subtree: true })
        .map((animation) => animation.finished.catch(() => {})),
    );
  });

// Selects keep their popover in the DOM while it animates out, so read the
// trigger and retry instead of matching the whole subtree by label.
const waitForText = async (locator, pattern, label) => {
  const deadline = Date.now() + 5000;
  let text = "";
  while (Date.now() < deadline) {
    text = (await locator.innerText()).trim();
    if (pattern.test(text)) return text;
    await page.waitForTimeout(50);
  }
  throw new Error(`Timed out waiting for ${label}; last text: ${JSON.stringify(text)}`);
};

let page;
const steps = [];

async function step(name, run) {
  try {
    await run();
    steps.push({ name, ok: true });
  } catch (error) {
    steps.push({ name, ok: false, error: error.message });
    throw error;
  }
}

(async () => {
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  let browser;
  const failures = [];
  try {
    browser = await chromium.launch({
      channel: process.env.PROPERTY_MODAL_BROWSER_CHANNEL || "msedge",
      headless: true,
    });
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    page = await context.newPage();
    const pageErrors = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));
    await page.route("**/*", (route) =>
      route.request().url().startsWith(`${origin}/`) ? route.continue() : route.abort(),
    );
    await page.goto(origin);
    await page.waitForLoadState("networkidle");

    const drawer = page.locator('[data-slot="drawer-dialog"]');
    const drawerContent = page.locator('[data-slot="drawer-content"]');
    const backdrop = page.locator('[data-slot="modal-backdrop"]');
    const heading = page.getByRole("heading", { name: "Edit Property" });
    const editTrigger = page.getByRole("button", { name: "Edit property details" });
    const depositTrigger = page.getByRole("button", { name: /Security Deposit/ });
    const openFromTable = async (name) => {
      const row = page.getByRole("row", { name: new RegExp(name) });
      await row.getByRole("button").click();
      await page.getByRole("menuitem", { name: "Edit", exact: true }).click();
      await heading.waitFor();
      await settleAnimations();
    };

    await step("first open from the table Edit action", async () => {
      await openFromTable("Preview Alpha");
      assert.equal(await dialogCount(), 1, "exactly one dialog should be open");
      assert.equal(await page.getByLabel("Name").inputValue(), "Preview Alpha");
    });

    await step("first open is the interactive top layer", async () => {
      assert.equal(
        await backdrop.evaluate((element) => element.inert),
        false,
        "modal backdrop must not be inert on the first open",
      );
      assert.equal(
        await drawerContent.evaluate((element) => element.inert),
        true,
        "drawer content should be inert while its dialog is open",
      );
      assert.equal(
        await page.evaluate(
          () =>
            document
              .querySelector('[data-slot="drawer-backdrop"]')
              ?.contains(document.querySelector('[data-slot="modal-backdrop"]')) ?? false,
        ),
        true,
        "the nested dialog should mount inside the drawer overlay that owns it",
      );
      const hit = await page.getByLabel("Name").evaluate((element) => {
        const rect = element.getBoundingClientRect();
        const top = document.elementFromPoint(
          rect.left + rect.width / 2,
          rect.top + rect.height / 2,
        );
        return { inside: top === element || element.contains(top), tag: top?.tagName ?? null };
      });
      assert.equal(hit.inside, true, `the Name input is not hit-testable (top element: ${hit.tag})`);
      // Where the dialog and the drawer overlap, the dialog must paint above.
      const stacking = await page.evaluate(() => {
        const dialog = document.querySelector('[data-slot="modal-dialog"]');
        const drawer = document.querySelector('[data-slot="drawer-dialog"]');
        const dialogRect = dialog.getBoundingClientRect();
        const drawerRect = drawer.getBoundingClientRect();
        const top = document.elementFromPoint(
          Math.min(dialogRect.right, drawerRect.right) - 20,
          Math.min(dialogRect.bottom, drawerRect.bottom) - 40,
        );
        return { insideDialog: dialog.contains(top), insideDrawer: drawer.contains(top) };
      });
      assert.equal(stacking.insideDialog, true, "the dialog must paint above the drawer");
      assert.equal(stacking.insideDrawer, false, "the drawer must not paint above the dialog");
      await page.screenshot({ path: path.join(output, "property-details-edit.png") });
    });

    await step("keyboard focus enters and stays in the dialog", async () => {
      assert.equal(await activeElementInsideDialog(), true, "focus did not move into the dialog");
      for (let index = 0; index < 8; index++) {
        await page.keyboard.press("Tab");
        assert.equal(
          await activeElementInsideDialog(),
          true,
          `focus escaped the dialog after ${index + 1} Tab presses`,
        );
      }
    });

    await step("typing works on the first open", async () => {
      await page.getByLabel("Name").click();
      await page.getByLabel("Name").fill("Alpha Typed");
      assert.equal(await page.getByLabel("Name").inputValue(), "Alpha Typed");
      assert.equal(await heading.isVisible(), true, "typing must not dismiss the dialog");
    });

    await step("clicking inside the dialog does not dismiss it", async () => {
      await page.getByLabel("Description").click();
      await page.getByLabel("Description").fill("Still open");
      assert.equal(await heading.isVisible(), true, "an inside click must not dismiss the dialog");
    });

    await step("a dropdown opens and selects on the first open", async () => {
      await depositTrigger.click();
      await page.getByRole("option", { name: "1 month", exact: true }).click();
      await waitForText(depositTrigger, /\b1 month\b/, "the deposit to show 1 month");
      assert.equal(await heading.isVisible(), true);
    });

    await step("Cancel closes the dialog and restores the drawer", async () => {
      await page.getByRole("button", { name: "Cancel", exact: true }).click();
      await heading.waitFor({ state: "hidden" });
      assert.equal(await drawer.isVisible(), true, "the drawer should stay open");
      assert.equal(await drawerContent.evaluate((element) => element.inert), false);
      await editTrigger.click();
      await heading.waitFor();
      assert.equal(
        await page.getByLabel("Name").inputValue(),
        "Preview Alpha",
        "Cancel must discard the draft",
      );
      await waitForText(depositTrigger, /\b2 months\b/, "Cancel to restore 2 months");
    });

    await step("Escape closes the dialog and restores focus to its trigger", async () => {
      await page.keyboard.press("Escape");
      await heading.waitFor({ state: "hidden" });
      assert.equal(
        await page.evaluate(() => document.activeElement?.getAttribute("aria-label")),
        "Edit property details",
      );
      assert.equal(await drawerContent.evaluate((element) => element.inert), false);
    });

    await step("Save writes the edited values and updates the drawer", async () => {
      await editTrigger.click();
      await heading.waitFor();
      await page.getByLabel("Name").fill("Preview Alpha Updated");
      await page.getByLabel("Monthly Rent").fill("16000");
      await depositTrigger.click();
      await page.getByRole("option", { name: "1 month", exact: true }).click();
      await page.getByRole("button", { name: "Save Changes" }).click();
      await heading.waitFor({ state: "hidden" });
      await drawer.getByText("Preview Alpha Updated").waitFor();
      const result = await page.evaluate(() => ({
        writes: window.fixtureWrites,
        rpcs: window.fixtureRpcs,
      }));
      const update = [...result.writes].reverse().find((entry) => entry.table === "apartments");
      assert.ok(update, "Save should write to the apartments table");
      assert.equal(update.values.name, "Preview Alpha Updated");
      assert.equal(update.values.monthly_rent, 16000);
      assert.equal(update.values.security_deposit, 16000);
      assert.equal(update.values.advance_rent, 16000);
      assert.ok(
        result.rpcs.includes("validate_camanava_location"),
        "Save should verify the pin before writing",
      );
    });

    await step("reopening after Save shows the saved values", async () => {
      await editTrigger.click();
      await heading.waitFor();
      assert.equal(await page.getByLabel("Name").inputValue(), "Preview Alpha Updated");
      assert.equal(await page.getByLabel("Monthly Rent").inputValue(), "16000");
      await waitForText(depositTrigger, /\b1 month\b/, "the saved deposit to show 1 month");
    });

    await step("switching apartments leaves no stale dialog state", async () => {
      await page.keyboard.press("Escape");
      await heading.waitFor({ state: "hidden" });
      // The drawer only becomes dismissable once no nested dialog is open.
      await page.waitForFunction(
        () => document.querySelector('[data-slot="drawer-content"]')?.inert === false,
      );
      await page.keyboard.press("Escape");
      await drawer.waitFor({ state: "hidden" });
      await openFromTable("Preview Beta");
      assert.equal(await page.getByLabel("Name").inputValue(), "Preview Beta");
      assert.equal(await page.getByLabel("Monthly Rent").inputValue(), "22000");
      await waitForText(depositTrigger, /\b2 months\b/, "the Beta deposit to show 2 months");
      assert.equal(
        await page.getByLabel("Description").inputValue(),
        "Second fixture listing.",
      );
    });

    await step("the close button works and reopening stays consistent", async () => {
      await page.getByRole("button", { name: "Close", exact: true }).click();
      await heading.waitFor({ state: "hidden" });
      await editTrigger.click();
      await heading.waitFor();
      assert.equal(await page.getByLabel("Name").inputValue(), "Preview Beta");
    });

    await step("the dialog keeps dialog semantics while the drawer is hidden from it", async () => {
      const semantics = await page.evaluate(() => {
        const dialog = document.querySelector('[data-slot="modal-dialog"]');
        const labelledBy = dialog?.getAttribute("aria-labelledby");
        return {
          role: dialog?.getAttribute("role"),
          label: labelledBy ? document.getElementById(labelledBy)?.textContent : null,
          hiddenAncestors: [...document.querySelectorAll('[aria-hidden="true"]')].filter(
            (element) => dialog && element.contains(dialog),
          ).length,
          dialogs: document.querySelectorAll('[data-slot="modal-dialog"]').length,
        };
      });
      assert.equal(semantics.role, "dialog");
      assert.equal(semantics.label, "Edit Property");
      assert.equal(semantics.hiddenAncestors, 0, "the dialog must not sit inside an aria-hidden layer");
      assert.equal(semantics.dialogs, 1);
    });

    await context.close();

    // The same-commit entry point must stay fixed on later opens too, not just
    // the first one in a page session.
    const secondContext = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    page = await secondContext.newPage();
    const secondErrors = [];
    page.on("pageerror", (error) => secondErrors.push(error.message));
    await page.route("**/*", (route) =>
      route.request().url().startsWith(`${origin}/`) ? route.continue() : route.abort(),
    );
    await page.goto(origin);
    await page.waitForLoadState("networkidle");
    try {
      await step("the table Edit action stays interactive on a repeat open", async () => {
        for (const round of [1, 2]) {
          await page
            .getByRole("row", { name: /Preview Alpha/ })
            .getByRole("button")
            .click();
          await page.getByRole("menuitem", { name: "Edit", exact: true }).click();
          await page.getByRole("heading", { name: "Edit Property" }).waitFor();
          await page.getByLabel("Name").fill(`Round ${round}`);
          assert.equal(await page.getByLabel("Name").inputValue(), `Round ${round}`);
          await page.getByRole("button", { name: "Cancel", exact: true }).click();
          await page.getByRole("heading", { name: "Edit Property" }).waitFor({ state: "hidden" });
          await page.keyboard.press("Escape");
          await page.locator('[data-slot="drawer-dialog"]').waitFor({ state: "hidden" });
        }
      });
      assert.deepEqual(secondErrors, [], "browser errors in the repeat-open session");
    } catch (error) {
      failures.push({ scenario: "repeat open", error: error.message });
    } finally {
      await secondContext.close();
    }

    assert.deepEqual(pageErrors, [], "browser errors in the main session");
  } finally {
    await browser?.close();
    await new Promise((resolve) => server.close(resolve));
  }

  console.log(
    JSON.stringify({ checked: steps.filter((entry) => entry.ok).length, steps, failures }, null, 2),
  );
  if (steps.some((entry) => !entry.ok) || failures.length) process.exitCode = 1;
})().catch((error) => {
  console.error(error);
  console.log(JSON.stringify({ steps }, null, 2));
  process.exitCode = 1;
});
