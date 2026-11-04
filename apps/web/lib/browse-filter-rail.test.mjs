import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { compile } from "./test-support/hook-runtime.mjs";

const source = (file) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
const jsx = (type, props, key) => ({ type, props: props ?? {}, key });
const jsxRuntime = { jsx, jsxs: jsx, Fragment: "Fragment" };
const nodes = (node) => {
  if (Array.isArray(node)) return node.flatMap(nodes);
  if (!node || typeof node !== "object") return [];
  return [node, ...nodes(node.props?.children)];
};
const textOf = (node) =>
  Array.isArray(node) ? node.map(textOf).join("") : typeof node === "string" || typeof node === "number" ? String(node) : node?.props ? textOf(node.props.children) : "";

const layout = compile("app/browse/lib/browse-layout.ts", {});
const params = compile("app/browse/lib/browse-params.ts", {});

test("the rail is for md and up, sticks below the right navbar, and narrows the grid by one column", () => {
  assert.match(layout.BROWSE_RAIL_CLASS, /\bhidden\b/);
  assert.match(layout.BROWSE_RAIL_CLASS, /md:block/);
  assert.match(layout.browseRailCardClass(true), /\bsticky\b.*top-4\b/);
  assert.match(layout.browseRailCardClass(false), /top-24\b/, "the public route's navbar is cleared");
  for (const fullWidth of [true, false]) {
    assert.match(layout.browseRailCardClass(fullWidth), /overflow-hidden rounded-xl border/);
    assert.match(layout.browseRailCardClass(fullWidth), /max-h-\[calc\(100dvh-/);
  }
  const columns = (cls) => Object.fromEntries([...cls.matchAll(/(?:^|\s)((?:lg:|xl:|2xl:)?)grid-cols-(\d)/g)].map((m) => [m[1] || "base", Number(m[2])]));
  const full = columns(layout.BROWSE_GRID_CLASS);
  const rail = columns(layout.BROWSE_GRID_WITH_RAIL_CLASS);
  for (const key of ["lg:", "xl:", "2xl:"]) assert.equal(rail[key], full[key] - 1, `${key} has one column fewer beside the rail`);
  assert.equal(rail.base, full.base);
});

test("the rail shows the filter panel under a Filters header with the active-filter count", () => {
  let search = "locations=Caloocan&verified=1&search=x";
  const { default: Rail } = compile("app/browse/components/BrowseFilterRail.tsx", {
    "react/jsx-runtime": jsxRuntime,
    react: { useMemo: (callback) => callback() },
    "next/navigation": { useSearchParams: () => new URLSearchParams(search) },
    "@tabler/icons-react": { IconAdjustmentsHorizontal: "IconAdjustmentsHorizontal" },
    "../lib/browse-layout": layout,
    "../lib/browse-params": params,
    "./FilterContainer": { default: "FilterContainer" },
  });
  let tree = nodes(Rail({ basePath: "/tenant/browse", fullWidth: true }));
  const aside = tree.find((node) => node.type === "aside");
  assert.equal(aside.props["aria-label"], "Filters");
  assert.equal(aside.props.className, layout.BROWSE_RAIL_CLASS);
  assert.ok(tree.some((node) => node.type === "h3" && textOf(node) === "Filters"));
  const badge = tree.find((node) => node.type === "span" && /bg-primary/.test(node.props.className ?? ""));
  assert.equal(textOf(badge), "2", "locations and verified count; the text search does not");
  const panel = tree.find((node) => node.type === "FilterContainer");
  assert.equal(panel.props.basePath, "/tenant/browse");
  assert.equal(panel.props.onApply, undefined, "nothing to close: the rail stays");
  assert.ok(tree.find((node) => /sticky/.test(node.props.className ?? "")).props.className.includes("top-4"));

  search = "page=2";
  tree = nodes(Rail({}));
  assert.ok(!tree.some((node) => node.type === "span" && /bg-primary/.test(node.props.className ?? "")), "no badge without filters");
});

function shell(props) {
  const { default: BrowseShell } = compile("app/browse/components/BrowseShell.tsx", {
    "react/jsx-runtime": jsxRuntime,
    react: { Suspense: "Suspense" },
    "../lib/browse-layout": layout,
    "./BrowseFilterRail": { default: "BrowseFilterRail" },
    "./SearchContainer": { default: "SearchContainer" },
  });
  return nodes(BrowseShell({ fallback: "fallback", children: jsx("Results", {}), ...props }));
}

test("results get the rail before them and the search bar hands the filters over; discovery does not", () => {
  const withRail = shell({ filterRail: true, fullWidth: true, basePath: "/tenant/browse" });
  const rail = withRail.find((node) => node.type === "BrowseFilterRail");
  assert.deepEqual({ basePath: rail.props.basePath, fullWidth: rail.props.fullWidth }, { basePath: "/tenant/browse", fullWidth: true });
  assert.ok(withRail.indexOf(rail) < withRail.findIndex((node) => node.type === "Results"), "the rail sits to the left of the results");
  assert.equal(withRail.find((node) => node.type === "SearchContainer").props.hasFilterRail, true);

  const discovery = shell({});
  assert.ok(!discovery.some((node) => node.type === "BrowseFilterRail"));
  assert.equal(discovery.find((node) => node.type === "SearchContainer").props.hasFilterRail, false);
});

test("both pages put the rail on results only, and the drawer rounds its left corners", () => {
  const tenant = source("app/tenant/browse/page.tsx");
  const discoveryBranch = tenant.slice(tenant.indexOf("if (isDefaultBrowseParams(params)) {"), tenant.indexOf("// Filtered/search/paged state"));
  assert.doesNotMatch(discoveryBranch, /filterRail/);
  const resultsBranch = tenant.slice(tenant.indexOf("// Filtered/search/paged state"));
  assert.match(resultsBranch, /filterRail/);
  assert.match(resultsBranch, /gridClassName=\{BROWSE_GRID_WITH_RAIL_CLASS\}/);

  const publicPage = source("app/browse/page.tsx");
  assert.match(publicPage, /const hasFilterRail = !showSections;/);
  assert.match(publicPage, /\{hasFilterRail \? \(\s*<Suspense[^]*?<BrowseFilterRail basePath="\/browse" \/>/);

  assert.match(source("app/browse/components/FilterDrawerButton.tsx"), /w-105 max-w-\[90vw\] flex-col overflow-hidden rounded-l-2xl p-0/);
});
