import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
import { financeTabParam } from "./landlord-finance-params.ts";

const root = fileURLToPath(new URL("../", import.meta.url));
const source = file => readFileSync(path.join(root, file), "utf8");
function cssBlock(css, selector) {
  const start = css.indexOf(selector);
  assert.ok(start >= 0, `Missing CSS block: ${selector}`);
  const open = css.indexOf("{", start);
  let depth = 1;
  for (let index = open + 1; index < css.length; index++) {
    if (css[index] === "{") depth++;
    if (css[index] === "}" && --depth === 0) return css.slice(open + 1, index);
  }
  assert.fail(`Unclosed CSS block: ${selector}`);
}
const jsx = (type, props, key) => ({ type, props: props ?? {}, key });
const base = {
  "react/jsx-runtime": { jsx, jsxs: jsx, Fragment: "Fragment" },
  react: {
    memo: component => component,
    useCallback: callback => callback,
    useEffect: () => {},
    useRef: value => ({ current: value }),
    useState: value => [typeof value === "function" ? value() : value, () => {}],
    Suspense: "Suspense",
  },
  "@tabler/icons-react": new Proxy({}, { get: (_, key) => key }),
  "@heroui/react": { Card: "Card", toast: {}, Spinner: "Spinner" },
  "@/components/ui/skeleton": { Skeleton: "Skeleton" },
  "next/link": { default: "Link" },
};

function compile(file, dependencies = {}) {
  const code = ts.transpileModule(source(file), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const context = { exports: {}, require: name => {
    if (name in dependencies) return dependencies[name];
    if (name in base) return base[name];
    let resolved = name.startsWith("@/") ? name.slice(2) : path.join(path.dirname(file), name);
    if (!path.extname(resolved)) resolved += ".tsx";
    assert.ok(existsSync(path.join(root, resolved)), `Unexpected dependency ${name} in ${file}`);
    return compile(resolved, dependencies);
  } };
  vm.runInNewContext(code, context);
  return context.exports;
}

function nodes(node) {
  if (Array.isArray(node)) return node.flatMap(nodes);
  if (!node || typeof node !== "object") return [];
  const child = typeof node.type === "function" ? node.type(node.props) : node.props?.children;
  return [node, ...nodes(child)];
}

test("See All keeps all loaded cards during pending, cancelled and failed navigation", () => {
  let pending = false;
  let dismissed = 0;
  const dependencies = {
    "next/link": { default: "Link", useLinkStatus: () => ({ pending }) },
    "next/navigation": { useRouter: () => ({ push() {} }) },
    "next/dynamic": { default: () => "HoverPreview" },
    "../../components/ui/ApartmentCard": { default: "ApartmentCard" },
    "@/app/components/ui/AuthPromptModal": { default: "AuthPromptModal" },
    "@/hooks/use-favorites": { useFavorites: () => ({ isFavorite: () => false, toggleFavorite() {} }) },
    "./use-hover-preview": { useHoverPreview: () => ({ preview: null, dismissPreview: () => { dismissed++; } }) },
  };
  const Browse = compile("app/browse/components/BrowseSectionsList.tsx", dependencies).default;
  const sections = [{ id: "verified", title: "Verified", seeAllHref: "/browse?verified=1", apartments: [{ id: "one", name: "One" }, { id: "two", name: "Two" }] }];
  const render = () => nodes(Browse({ sections }));
  const link = render().find(node => node.type === "Link");
  assert.equal(link.props.href, "/browse?verified=1");
  assert.equal(link.props.onClick, undefined, "native Link modifier/history behavior stays intact");
  link.props.onNavigate();
  assert.equal(dismissed, 1);
  for (const nextPending of [true, false, true, false]) {
    pending = nextPending;
    const tree = render();
    assert.equal(tree.filter(node => node.type === "ApartmentCard").length, 2);
    assert.equal(tree.filter(node => node.type === "Skeleton").length, 0);
    assert.equal(tree.some(node => node.props.role === "status"), pending);
  }
  assert.doesNotMatch(source("app/browse/components/BrowseSectionsList.tsx"), /navigatingHref|BrowseCardsSkeleton|setNavigatingHref|useSearchParams/);
});

test("tenant form and reviews boundaries override the parent gallery with Back, title and accessible status", () => {
  for (const [route, title] of [["apply", "Apartment Application"], ["rate-apartment", "Rate Apartment"], ["ratings", "Ratings & Reviews"]]) {
    const file = `app/tenant/browse/[apartmentId]/${route}/loading.tsx`;
    const Loading = compile(file, { "./BackBtn": { default: "BackBtn" } }).default;
    const tree = nodes(Loading());
    assert.ok(tree.some(node => node.type === "BackBtn"));
    assert.ok(tree.some(node => node.type === "h1" && node.props.children === title));
    assert.ok(tree.some(node => node.props.role === "status" && node.props["aria-busy"]));
    assert.doesNotMatch(source(file), /ApartmentDetailSkeleton|createClient|fetch/);
  }
  assert.match(source("app/tenant/browse/[apartmentId]/loading.tsx"), /ApartmentDetailSkeleton/);
});

const adminDestinations = [
  ["dashboard", "Admin Overview"], ["analytics", "Analytics"], ["profile", "Profile"],
  ["profile/edit", "Edit Profile"], ["users/[id]", "User Details"],
  ["verification/users/[id]", "User Verification"],
  ["verification/documents/[id]", "Document Verification"],
  ["verification/apartments/[id]", "Apartment Verification"],
  ["verification/apartments/[id]/lease", "Lease Agreement"],
];

test("all nine Admin destinations have data-free destination boundaries and one labeled loading state", () => {
  for (const [route, title] of adminDestinations) {
    const file = `app/admin/${route}/loading.tsx`;
    const Loading = compile(file, {
      "../apartments/[id]/components/DetailPrimitives": { Section: "Section" },
    }).default;
    const tree = nodes(Loading());
    assert.ok(tree.some(node => node.type === "h1" && node.props.children === title), route);
    const statuses = tree.filter(node => node.props.role === "status");
    assert.equal(statuses.length, 1, route);
    assert.equal(statuses[0].props["aria-busy"], "true");
    assert.doesNotMatch(source(file), /AdminLoadingSkeleton|requireAdmin|createClient|fetch|await/);
  }
  assert.match(source("app/admin/loading.tsx"), /AdminLoadingSkeleton/);
});

test("Admin Dashboard leaves body loading to its existing streamed regions", () => {
  const Loading = compile("app/admin/dashboard/loading.tsx").default;
  assert.equal(nodes(Loading()).filter(node => node.type === "Skeleton").length, 0);
  assert.match(source("app/admin/dashboard/page.tsx"), /Suspense fallback=\{<RegionPlaceholder/);
});

test("analytics URL read is inside its own Suspense and uses the existing tab parser", () => {
  const Loading = compile("app/landlord/analytics/loading.tsx", {
    "./components/AnalyticsLoadingContent": { default: "AnalyticsLoadingContent" },
  }).default;
  const suspense = nodes(Loading()).find(node => node.type === "Suspense");
  assert.ok(suspense);
  assert.equal(suspense.props.children.type, "AnalyticsLoadingContent");
  assert.ok(nodes(suspense.props.fallback).some(node => node.props.role === "status"));
  assert.doesNotMatch(source("app/landlord/analytics/loading.tsx"), /useSearchParams|searchParams:/);
  for (const [raw, expected] of [["overview", "overview"], ["expenses", "expenses"], ["budget", "budget"], ["plan", "overview"], [null, "overview"]]) {
    const Content = compile("app/landlord/analytics/components/AnalyticsLoadingContent.tsx", {
      "next/navigation": { useSearchParams: () => new URLSearchParams(raw ? { tab: raw } : {}) },
      "@/lib/landlord-finance-params": { financeTabParam },
      "./AnalyticsSkeleton": { default: "AnalyticsSkeleton" },
    }).default;
    const tree = nodes(Content());
    assert.equal(tree.find(node => node.type === "AnalyticsSkeleton").props.tab, expected);
    assert.equal(tree.find(node => node.props.role === "status").props["aria-label"], `Loading ${expected} finance report`);
  }
});

test("finance drill-downs announce loading instead of hiding the entire fallback", () => {
  for (const route of ["budget-category", "category-expenses"]) {
    const Loading = compile(`app/landlord/analytics/${route}/loading.tsx`, {
      "./BudgetCategorySkeleton": { default: "Skeleton" },
      "./CategoryExpensesSkeleton": { default: "Skeleton" },
    }).default;
    const tree = nodes(Loading());
    assert.equal(tree[0].props["aria-hidden"], undefined);
    assert.ok(tree.some(node => node.props.role === "status" && node.props["aria-busy"]));
  }
});

test("skeleton fills have matching light/dark design tokens", () => {
  const css = source("app/globals.css");
  const fills = Object.fromEntries([":root", ".dark"].map(selector => [selector, cssBlock(css, `${selector} {`).match(/--skeleton-fill:\s*([^;]+);/)[1]]));
  const tokens = JSON.parse(readFileSync(new URL("../../../design-tokens.json", import.meta.url), "utf8"));
  assert.equal(fills[":root"], tokens.colors.webTheme.light.skeletonFill);
  assert.equal(fills[".dark"], tokens.colors.webTheme.dark.skeletonFill);
  assert.notEqual(fills[":root"], fills[".dark"]);
  assert.match(source("app/globals.css"), /--color-skeleton: var\(--skeleton-fill\)/);
});

test("OS and APT reduced motion disable all skeleton engines, including pseudo-elements", () => {
  const css = source("app/globals.css");
  const media = [...css.matchAll(/@media \(prefers-reduced-motion: reduce\)/g)]
    .map(match => cssBlock(css.slice(match.index), match[0]))
    .find(block => block.includes(".skeleton::after"));
  assert.ok(media);
  const selectors = media.slice(0, media.indexOf("{")).split(",").map(value => value.trim());
  for (const selector of [".skeleton", ".skeleton::before", ".skeleton::after", ".animate-pulse"]) assert.ok(selectors.includes(selector), selector);
  assert.match(media, /animation: none !important/);
  assert.match(source("app/globals.css"), /html\.apt-reduce-motion \.skeleton::after/);
  assert.match(source("app/providers.tsx"), /classList.toggle\("apt-reduce-motion", enabled\)/);
  assert.match(source("components/ui/skeleton.tsx"), /motion-reduce:animate-none/);
});

test("fixed light-only and obsolete fill utilities are absent from loading/skeleton files", () => {
  function walk(directory) {
    return readdirSync(path.join(root, directory), { withFileTypes: true }).flatMap(entry => {
      const file = `${directory}/${entry.name}`;
      return entry.isDirectory() ? walk(file) : [file];
    });
  }
  for (const file of walk("app").filter(file => file.endsWith(".tsx") && (/Skeleton/.test(path.basename(file)) || path.basename(file) === "loading.tsx"))) {
    assert.doesNotMatch(source(file), /bg-grey-300|bg-default-200|bg-default-300/, file);
  }
});
