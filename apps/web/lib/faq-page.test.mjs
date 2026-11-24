import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

// The dedicated FAQ page is a static composition of the two landing sections:
// composing them here (instead of copying their copy) keeps the page and the
// signed-out landing page in step, and gives the footer's FAQ and Contact Us
// links a route that survives the signed-in landing redirect.
const page = readFileSync(new URL("../app/(main)/faq/page.tsx", import.meta.url), "utf8");

test("the FAQ page reuses the landing FAQ and contact sections in the same order", () => {
  assert.match(page, /import FaqSection from "\.\.\/components\/FaqSection"/);
  assert.match(page, /import ContactSection from "\.\.\/components\/ContactSection"/);
  const faq = page.indexOf("<FaqSection />");
  const contact = page.indexOf("<ContactSection />");
  assert.ok(faq !== -1 && contact !== -1, "both landing sections must render on the page");
  assert.ok(faq < contact, "FAQs come first so the contact card's 'FAQs above' copy stays true");
});

test("the FAQ page stays static outside the signed-in landing redirect", () => {
  assert.doesNotMatch(page, /createClient|getUser|redirect\(/);
  assert.match(page, /export const metadata: Metadata = \{/);
  assert.match(page, /title: "FAQs — APT"/);
});
