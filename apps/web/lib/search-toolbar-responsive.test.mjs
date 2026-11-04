import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = (file) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");

test("the browse search row compacts at 336px of usable width and preserves sm desktop", () => {
  const layout = source("app/browse/lib/browse-layout.ts");
  const row = layout.match(/BROWSE_SEARCH_ROW_CLASS =\s*"([^"]+)"/)?.[1] ?? "";
  const tokens = row.split(/\s+/);
  for (const token of ["grid", "grid-cols-1", "@[336px]:flex", "@[336px]:flex-row", "@[336px]:max-sm:gap-1", "sm:flex", "sm:flex-row", "w-full", "max-w-xl", "min-w-0"]) {
    assert.ok(tokens.includes(token), `search row keeps ${token}`);
  }
  assert.match(layout, /"@container w-full/, "breakpoint measures actual hero content width");
  // The narrow fallback must not force all controls into one row.
  assert.doesNotMatch(row, /(?:^|\s)flex-row(?:\s|$)/, "phone row must not force a single flex row");
});

test("the search input shrinks inside the pill and the pill clips its own contents", () => {
  const container = source("app/browse/components/SearchContainer.tsx");
  const input = container.match(/<InputGroup\.Input[\s\S]*?\/>/)?.[0] ?? "";
  assert.match(input, /className="min-w-0"/, "input must be allowed to shrink below its intrinsic width");
  assert.match(
    container,
    /browse-search-pill[^"]*relative[^"]*w-full[^"]*overflow-hidden/,
    "pill owns the clip and the positioned hint",
  );
  assert.equal(container.match(/<InputGroup\.Input/g)?.length, 1, "one native input only");
});

test("narrow screens use the short CSS hint, desktop keeps the full placeholder", () => {
  const container = source("app/browse/components/SearchContainer.tsx");
  assert.match(container, /placeholder="Search by apartment name, city, or barangay\.\.\."/);
  const hints = container.match(/Search by apartment name\.\.\./g) ?? [];
  assert.equal(hints.length, 1, "the short hint is rendered once");
  assert.match(container, /<span className="min-w-0 truncate">Search by apartment name\.\.\.<\/span>/, "hint shows as much text as fits with an ellipsis");
  assert.match(
    container,
    /aria-hidden="true"[\s\S]{0,200}left-9 right-3 flex items-center truncate text-base text-muted-foreground sm:hidden/,
  );
  assert.match(container, /aria-label="Search by apartment name, city, or barangay"/, "accessible name is unchanged");

  const css = source("app/globals.css");
  assert.match(
    css,
    /@media \(max-width: 639\.98px\) \{[^}]*\.browse-search-pill input::placeholder \{[^}]*color: transparent;/,
    "native long placeholder must be hidden exactly below sm",
  );
});

test("filter, map and Ava stay unshrunk inside the action group", () => {
  const container = source("app/browse/components/SearchContainer.tsx");
  assert.match(container, /ml-auto flex shrink-0 items-center gap-2/);
  assert.ok(container.includes("@[336px]:max-sm:gap-1"), "compact actions give the input extra width without smaller buttons");
  assert.match(container, /aria-label="Search on the map"/);
  assert.match(container, /\{filterButton\}/);
  assert.match(container, /\{assistantButton\}/);
  // Loading keeps the same second-row right alignment as the loaded toolbar.
  const skeleton = source("app/browse/components/BrowsePageSkeleton.tsx");
  assert.match(skeleton, /ml-auto flex shrink-0 items-center gap-2[\s\S]{0,120}<FilterEntrySkeleton/);
});
