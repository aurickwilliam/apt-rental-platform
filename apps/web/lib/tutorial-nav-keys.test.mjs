import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

// The layouts tag their links with literal `tourKey`s (their test harnesses
// stub `@repo/utils`), which must match the keys the step list in
// `@repo/utils` `tutorial.ts` points at.
const read = path => readFileSync(new URL(path, import.meta.url), "utf8");
const tutorial = read("../../../packages/utils/src/tutorial.ts");
const tenant = read("../app/tenant/layout.tsx");
const landlord = read("../app/landlord/layout.tsx");

const webKeys = [...tutorial.matchAll(/web[A-Za-z]+: "(nav-[a-z-]+)"/g)].map(match => match[1]);

test("the step list defines the web navigation keys", () => {
  assert.deepEqual(new Set(webKeys), new Set([
    "nav-browse", "nav-my-rental", "nav-maintenance", "nav-messages",
    "nav-dashboard", "nav-properties", "nav-applications", "nav-payments",
  ]));
});

test("every web key is on a tenant or landlord navigation link", () => {
  for (const key of webKeys) {
    assert.ok(tenant.includes(`tourKey: "${key}"`) || landlord.includes(`tourKey: "${key}"`), key);
  }
});

test("layouts mount the tour for their own portal", () => {
  assert.match(tenant, /<TutorialTour portal="tenant"/);
  assert.match(landlord, /<TutorialTour portal="landlord"/);
});
