import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

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

test("public and tenant search share HeroUI colors without changing field geometry or search navigation", () => {
  for (const basePath of ["/browse", "/tenant/browse"]) {
    let draft = "  Caloocan  ";
    const navigations = [];
    const { default: Search } = compile("app/browse/components/SearchContainer.tsx", {
      react: {
        useEffect() {}, useRef: value => ({ current: value }),
        useState: () => [draft, value => { draft = value; }],
        useTransition: () => [false, callback => callback()],
      },
      "next/navigation": {
        useRouter: () => ({ replace: href => navigations.push(href) }),
        useSearchParams: () => new URLSearchParams("page=3&verified=1"),
      },
      "@heroui/react": {
        Button: "Button", Spinner: "Spinner",
        InputGroup: { Prefix: "InputGroup.Prefix", Input: "InputGroup.Input" },
      },
      "@tabler/icons-react": { IconSearch: "IconSearch" },
    });
    const filterButton = jsx("ExistingFilterButton", {});
    const tree = nodes(Search({ basePath, filterButton }));
    const input = tree.find(node => node.type === "InputGroup.Input");
    const group = tree.find(node => node.props.className?.includes("focus-within:ring-2"));
    assert.ok(group);
    assert.doesNotMatch(group.props.className, /(?:^|\s)bg-white(?:\s|$)/);
    assert.doesNotMatch(group.props.className, /(?:^|\s)(?:bg-|text-)(?:black|white)(?:\s|$)/);
    assert.match(group.props.className, /flex-1 min-w-0 rounded-full/);
    assert.match(group.props.className, /focus-within:border-\[#376BF5\]/);
    assert.ok(group.props.className.includes("[&_input::placeholder]:text-muted-foreground"));
    assert.doesNotMatch(group.props.className, /text-gray-400/);
    assert.equal(input.props.placeholder, "Search by name or location...");
    assert.equal(input.props.disabled, undefined, "existing enabled state is unchanged");
    assert.ok(tree.includes(filterButton));
    input.props.onChange({ target: { value: "Malabon" } });
    assert.equal(draft, "Malabon");
    input.props.onKeyDown({ key: "Enter" });
    assert.deepEqual(navigations, [`${basePath}?verified=1&search=Caloocan`]);
  }
  assert.match(source("app/tenant/browse/page.tsx"), /BrowseShell/);
  assert.match(source("app/browse/components/BrowseShell.tsx"), /<SearchContainer basePath=\{basePath\}/);
});

test("temporary transition suppression is delegated to next-themes, not a new permanent CSS policy", () => {
  assert.doesNotMatch(source("app/providers.tsx"), /setTimeout|setInterval|document\.createElement|transition:\s*none/);
  assert.match(source("app/theme-init-script.ts"), /localStorage\.getItem\("theme"\)/);
  assert.match(source("app/theme-init-script.ts"), /prefers-color-scheme: dark/);
  assert.match(source("app/providers.tsx"), /classList\.toggle\("apt-reduce-motion", enabled\)/);
  assert.match(source("app/components/ui/ApartmentCard.tsx"), /transition-all duration-200/);
});
