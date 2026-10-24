import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const modal = readFileSync(new URL("../app/tenant/components/ReviewUnlockGate.tsx", import.meta.url), "utf8");
const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");

test("review prompt keeps close and actions outside the scrolling content", () => {
  assert.match(modal, /Modal\.Container placement="center" scroll="inside"/);
  const body = modal.match(/<Modal\.Body[\s\S]*?<\/Modal\.Body>/)?.[0];
  assert.ok(body);
  assert.match(body, /<Modal\.Heading/);
  assert.doesNotMatch(body, /<Button|<Modal\.CloseTrigger/);
  assert.match(modal, /<Modal\.Header[\s\S]*<Modal\.CloseTrigger[\s\S]*<\/Modal\.Header>/);
  assert.match(modal, /<Modal\.Footer[\s\S]*Write a Review[\s\S]*Maybe later[\s\S]*<\/Modal\.Footer>/);
});

test("review prompt uses scoped touch sizing, responsive footer and safe-area padding", () => {
  assert.match(css, /\.review-unlock-close\s*\{[^}]*position: static;[^}]*width: 2\.75rem;[^}]*height: 2\.75rem;/);
  assert.match(css, /\.review-unlock-action\s*\{[^}]*flex: none;[^}]*min-height: 2\.75rem;/);
  assert.match(css, /\.review-unlock-footer\s*\{[^}]*flex-shrink: 0;[^}]*flex-direction: column;/);
  assert.match(css, /@media \(min-width: 40rem\)[\s\S]*\.review-unlock-footer \{ flex-direction: row;/);
  assert.match(css, /\.review-unlock-heading\s*\{[^}]*overflow-wrap: anywhere;/);
  assert.match(css, /\.review-unlock-container\s*\{[^}]*env\(safe-area-inset-bottom\)/);
});
