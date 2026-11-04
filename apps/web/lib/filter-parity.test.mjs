import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const web = readFileSync(new URL("../app/browse/components/FilterContainer.tsx", import.meta.url), "utf8");
const mobile = readFileSync(new URL("../../mobile/app/(tabs)/components/search/FilterBottomSheet.tsx", import.meta.url), "utf8");

const SECTIONS = ["Budget", "Unit Type", "Sort By", "Bedrooms", "Bathrooms", "Size Range", "Furnishing", "Floor Level", "Lease Duration", "Amenities"];

// Section titles in the order they appear in the rendered panel (after the
// component helpers, which hold the slider labels).
function orderOf(source, start) {
  return SECTIONS.map((name) => [name, source.indexOf(`>${name}<`, start) === -1 ? source.indexOf(name, start) : source.indexOf(`>${name}<`, start)])
    .sort((a, b) => a[1] - b[1])
    .map(([name]) => name);
}

test("web and mobile filters list their sections in the same order (web adds Location after Verified)", () => {
  const webStart = web.indexOf('return (\n    <div className="flex min-h-0 flex-1 flex-col text-foreground">');
  assert.ok(webStart > 0);
  const webPanel = web.slice(webStart);
  const mobilePanel = mobile.slice(mobile.indexOf("{/* Verification */}"));
  // Budget and Size Range are components on web, so read their titles from those.
  const webOrder = [
    ...(["Location", "<BudgetSection", "Unit Type", "Sort By", "Bedrooms", "Bathrooms", "<SizeSection", "Furnishing", "Floor Level", "Lease Duration", "Amenities"].map((token) => [token, webPanel.indexOf(token)])),
  ]
    .sort((a, b) => a[1] - b[1])
    .map(([token]) => token.replace("<BudgetSection", "Budget").replace("<SizeSection", "Size Range"));
  assert.deepEqual(webOrder.filter((name) => name !== "Location"), SECTIONS);
  assert.equal(webOrder[0], "Location", "Location comes right after the Verified switch, before Budget");
  assert.deepEqual(orderOf(mobilePanel, 0), SECTIONS);
});

test("the apply button says Apply Filters on both, and the old label is gone", () => {
  assert.match(web, /Apply Filters/);
  assert.match(mobile, /<Button\.Label>Apply Filters<\/Button\.Label>/);
  assert.doesNotMatch(web, /Search Apartment/);
});

test("section titles share one size and weight on web, and Sort By is chips like mobile", () => {
  assert.doesNotMatch(web, /text-sm font-medium/, "no leftover small, medium-weight section titles");
  const titles = [...web.matchAll(/<h4 className="([^"]*)">/g)].map((m) => m[1]);
  assert.equal(titles.length, 9);
  for (const cls of titles) assert.match(cls, /font-nunito text-base font-semibold/);
  assert.equal([...web.matchAll(/<Label className="font-nunito text-base font-semibold">/g)].length, 2, "the Budget and Size Range slider labels match");
  assert.match(mobile, /font-nunitoSemiBold text-base text-foreground/);
  assert.doesNotMatch(web, /RadioGroup|<Radio\b/, "Sort By is no longer radios");
  assert.match(web, /aria-label="Sort by"/);
  assert.match(mobile, /selectionMode="single"[^]*?id="newest"/);
});

test("Budget and Size Range have typed Min/Max fields on both platforms, committed by the same shared rule", () => {
  const mobileFields = readFileSync(new URL("../../mobile/components/inputs/RangeInputFields.tsx", import.meta.url), "utf8");
  assert.match(web, /import \{ commitRangeDraft \} from "@repo\/utils"/);
  assert.match(mobileFields, /commitRangeDraft/);
  // The same slider steps, so a typed value snaps to the same numbers.
  assert.match(web, /<RangeInputs[^]*?absoluteMin=\{MIN_BUDGET\}[^]*?step=\{500\}/);
  assert.match(web, /<RangeInputs[^]*?absoluteMin=\{MIN_SIZE\}[^]*?step=\{5\}/);
  assert.match(mobile, /<RangeInputFields[^]*?absoluteMin=\{MIN_BUDGET\}[^]*?step=\{500\}/);
  assert.match(mobile, /<RangeInputFields[^]*?absoluteMin=\{MIN_SIZE\}[^]*?step=\{5\}/);
  assert.match(mobile, /keyboardBehavior="interactive"/, "the sheet stays above the keyboard");
});
