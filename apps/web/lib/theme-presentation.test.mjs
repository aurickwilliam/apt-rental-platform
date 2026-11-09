import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
import { translate } from "../../../packages/i18n/src/index.ts";

const source = file => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
const jsx = (type, props) => ({ type, props: props ?? {} });

function compile(file, dependencies) {
  const compiled = ts.transpileModule(source(file), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const context = { exports: {}, URLSearchParams, require: name => {
    if (name === "react/jsx-runtime") return { jsx, jsxs: jsx };
    assert.ok(name in dependencies, `Unexpected dependency: ${name}`);
    return dependencies[name];
  } };
  vm.runInNewContext(compiled, context);
  return context.exports;
}

function nodes(node) {
  if (Array.isArray(node)) return node.flatMap(nodes);
  if (!node || typeof node !== "object") return [];
  return [node, ...nodes(node.props?.children)];
}

test("theme provider suppresses only theme-change transitions while preserving its configuration and children", () => {
  const { Providers } = compile("app/providers.tsx", {
    react: {},
    "@heroui/react": { Toast: { Provider: "ToastProvider" } },
    "next-themes": { ThemeProvider: "NextThemesProvider" },
    "@/components/ui/tooltip": { TooltipProvider: "TooltipProvider" },
    "@/lib/reduced-motion": {},
    "./components/layout/ResourceCacheLifecycle": { default: "ResourceCacheLifecycle" },
  });
  const child = jsx("ExistingPage", {});
  const tree = Providers({ children: child });
  assert.equal(tree.type, "NextThemesProvider");
  assert.equal(tree.props.attribute, "class");
  assert.equal(tree.props.defaultTheme, "light");
  assert.equal(tree.props.disableTransitionOnChange, true);
  assert.equal(tree.props.enableSystem, undefined, "next-themes retains its enabled System default");
  assert.equal(tree.props.forcedTheme, undefined);
  const rendered = nodes(tree);
  assert.ok(rendered.includes(child));
  assert.ok(rendered.some(node => node.type === "ResourceCacheLifecycle"));
  assert.ok(rendered.some(node => node.type?.name === "ReducedMotionPreference"));
});

function renderSearch({ basePath, params = "page=3&verified=1", draft = "  Caloocan  ", filterButton = jsx("ExistingFilterButton", {}), hasFilterRail = false }) {
  let current = draft;
  const navigations = [];
  const { default: Search } = compile("app/browse/components/SearchContainer.tsx", {
    react: {
      useEffect() {}, useRef: value => ({ current: value }),
      useState: () => [current, value => { current = value; }],
      useTransition: () => [false, callback => callback()],
      useOptimistic: value => [value, () => {}],
    },
    "next/navigation": {
      useRouter: () => ({ replace: href => navigations.push(href) }),
      useSearchParams: () => new URLSearchParams(params),
    },
    "@heroui/react": {
      Button: "Button", Spinner: "Spinner",
      InputGroup: { Prefix: "InputGroup.Prefix", Input: "InputGroup.Input", Suffix: "InputGroup.Suffix" },
    },
    "next/image": { default: "Image" },
    "@/hooks/use-recent-apartment-searches": {
      useRecentApartmentSearches: () => ({ recent: [], clear() {} }),
      useRememberRecentApartment: () => () => {},
    },
    "@/lib/recent-apartment-searches": { recentApartmentHref: (base, id) => `${base}/${id}` },
    "@/lib/public-apartment-image": { canOptimizePublicApartmentImage: () => true },
    "@/app/components/i18n/LocaleProvider": { useTranslation: () => ({ language: "en", t: (key, vars) => translate("en", key, vars) }) },
    "@tabler/icons-react": {
      IconArrowRight: "IconArrowRight", IconSearch: "IconSearch", IconMap2: "IconMap2", IconPhoto: "IconPhoto", IconX: "IconX",
    },
    "@repo/constants": { CAMANAVA_CITIES: ["Caloocan", "Malabon", "Navotas", "Valenzuela"] },
    "../lib/browse-layout": compile("app/browse/lib/browse-layout.ts", {}),
    "./CityChips": { default: "CityChips" },
  });
  return { tree: nodes(Search({ basePath, filterButton, hasFilterRail, mapHref: `${basePath}/map` })), navigations, filterButton, draft: () => current };
}

test("public and tenant search share one bar that keeps HeroUI colors and search navigation", () => {
  for (const basePath of ["/browse", "/tenant/browse"]) {
    const { tree, navigations, filterButton, draft } = renderSearch({ basePath });
    const input = tree.find(node => node.type === "InputGroup.Input");
    const group = tree.find(node => node.type?.Input === "InputGroup.Input");
    // The bar owns the border and focus ring; the field inside it is borderless.
    const bar = tree.find(node => node.props.className?.includes("focus-within:ring-2"));
    assert.ok(bar && group && bar !== group);
    assert.match(bar.props.className, /rounded-full/);
    assert.match(bar.props.className, /\bh-12\b/);
    assert.match(bar.props.className, /focus-within:border-\[#376BF5\]/);
    assert.doesNotMatch(bar.props.className, /(?:^|\s)(?:bg-|text-)(?:black|white)(?:\s|$)/);
    assert.match(group.props.className, /border-0/);
    assert.ok(group.props.className.includes("[&_input::placeholder]:text-muted-foreground"));
    assert.doesNotMatch(group.props.className, /text-gray-400/);
    assert.equal(input.props.placeholder, "Search by name or location...");
    assert.equal(input.props.disabled, undefined, "existing enabled state is unchanged");
    assert.ok(tree.includes(filterButton), "the filter entry sits inside the bar");
    assert.ok(tree.some(node => node.props["aria-label"] === "Search on the map"));

    input.props.onChange({ target: { value: "Malabon" } });
    assert.equal(draft(), "Malabon");
    input.props.onKeyDown({ key: "Enter" });
    const arrow = tree.find(node => node.type === "Button" && node.props["aria-label"] === "Search");
    arrow.props.onPress();
    assert.deepEqual(navigations, [`${basePath}?verified=1&search=Caloocan`, `${basePath}?verified=1&search=Caloocan`]);
  }
  assert.match(source("app/tenant/browse/page.tsx"), /BrowseShell/);
  assert.match(source("app/browse/components/BrowseShell.tsx"), /<SearchContainer basePath=\{basePath\}/);
});

test("with the filter rail beside results the bar's filter button is for phones only", () => {
  const { tree, filterButton } = renderSearch({ basePath: "/browse", hasFilterRail: true });
  const wrapper = tree.find(node => node.props.className === "md:hidden");
  assert.ok(wrapper, "the filter button sits in a phones-only wrapper");
  assert.ok(nodes(wrapper).includes(filterButton));
  const plain = renderSearch({ basePath: "/browse" });
  assert.ok(!plain.tree.some(node => node.props.className === "md:hidden"), "without a rail the button shows at every size");
  assert.ok(plain.tree.includes(plain.filterButton));
});

test("city chips write the drawer's locations filter, one city at a time", () => {
  const chips = ({ params }) => {
    const { tree, navigations } = renderSearch({ basePath: "/browse", params });
    return { chip: tree.find(node => node.type === "CityChips"), navigations };
  };

  let { chip, navigations } = chips({ params: "page=3&verified=1" });
  assert.equal(chip.props.selected, null);
  assert.equal(chip.props.isCustom, false);
  chip.props.onSelect("Caloocan");
  assert.deepEqual(navigations, ["/browse?verified=1&locations=Caloocan"], "paging resets and other filters stay");

  ({ chip, navigations } = chips({ params: "locations=Caloocan" }));
  assert.equal(chip.props.selected, "Caloocan");
  chip.props.onSelect("Caloocan");
  chip.props.onSelect(null);
  assert.deepEqual(navigations, ["/browse?", "/browse?"], "the current city and All cities both clear it");
  ({ chip, navigations } = chips({ params: "locations=Caloocan" }));
  chip.props.onSelect("Navotas");
  assert.deepEqual(navigations, ["/browse?locations=Navotas"]);

  ({ chip } = chips({ params: "locations=Malabon%2CNavotas" }));
  assert.equal(chip.props.selected, null);
  assert.equal(chip.props.isCustom, true, "a multi-city drawer filter marks no chip as current");
});

test("temporary transition suppression is delegated to next-themes, not a new permanent CSS policy", () => {
  assert.doesNotMatch(source("app/providers.tsx"), /setTimeout|setInterval|document\.createElement|transition:\s*none/);
  assert.match(source("app/theme-init-script.ts"), /localStorage\.getItem\("theme"\)/);
  assert.match(source("app/theme-init-script.ts"), /prefers-color-scheme: dark/);
  assert.match(source("app/providers.tsx"), /classList\.toggle\("apt-reduce-motion", enabled\)/);
  assert.match(source("app/components/ui/ApartmentCard.tsx"), /transition-all duration-200/);
});
