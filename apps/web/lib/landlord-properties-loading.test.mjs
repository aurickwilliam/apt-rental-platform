import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const compound = (name, parts) => Object.assign(() => {}, Object.fromEntries(parts.map(part => [part, `${name}.${part}`])));
const Table = compound("Table", ["ScrollContainer", "Content", "Header", "Column", "Body", "Row", "Cell"]);
const Dropdown = compound("Dropdown", ["Popover", "Menu", "Section", "Item", "SubmenuTrigger"]);

function load(file, extra = {}) {
  const jsx = (type, props) => ({ type, props });
  const dependencies = {
    "react/jsx-runtime": { jsx, jsxs: jsx, Fragment: "Fragment" },
    "react": {
      Suspense: "Suspense", useState: value => [value, () => {}],
      useCallback: callback => callback, useEffect: () => {}, useSyncExternalStore: () => false,
    },
    "@heroui/react": { Skeleton: "Skeleton", Table, Dropdown, Button: "Button", Label: "Label", Separator: "Separator" },
    "@tabler/icons-react": new Proxy({}, { get: (_, key) => key }),
    "next/link": { default: "Link" },
    "next/image": { default: "Image" },
    "next-themes": { useTheme: () => ({ resolvedTheme: "light", setTheme: () => {} }) },
    "@/app/(auth)/actions/sign-out": { signOut: () => {} },
    "@/app/components/notifications/NotificationsOverlay": { NOTIFICATIONS_QUERY_VALUE: "open" },
    "@/app/components/settings/SettingsOverlay": { SETTINGS_QUERY_VALUE: "open" },
    "@/app/components/profile/UserAvatar": { default: "UserAvatar" },
    "@/app/components/settings/ToggleSwitch": { default: "ToggleSwitch" },
    "@/hooks/use-notifications": { useNotifications: () => ({ unreadCount: 0 }) },
    "./PropertiesHeader": loadPropertiesHeader(),
    "./components/PropertiesSkeleton": { default: () => load("landlord/properties/components/PropertiesSkeleton.tsx").default() },
    ...extra,
  };
  const source = readFileSync(new URL(`../app/${file}`, import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const context = { exports: {}, require: name => {
    assert.ok(name in dependencies, `Unexpected dependency: ${name}`);
    return dependencies[name];
  } };
  vm.runInNewContext(compiled, context);
  return context.exports;
}

function loadPropertiesHeader() {
  return { default: function PropertiesHeader() {
    return load("landlord/properties/components/PropertiesHeader.tsx").default();
  } };
}

function nodes(element) {
  if (!element || typeof element !== "object") return [];
  const expand = typeof element.type === "function" && ["Sk", "PropertiesHeader", "default", "MobileSidebarMenu"].includes(element.type.name);
  const children = expand ? element.type(element.props) : element.props?.children;
  return [element, ...[children].flat(Infinity).flatMap(nodes)];
}

test("My Properties loading keeps its title, four stats, four actions and eight-column table", () => {
  const tree = load("landlord/properties/components/PropertiesSkeleton.tsx").default();
  assert.equal(tree.props["aria-busy"], "true");
  assert.equal(tree.props["aria-label"], "Loading properties");
  const elements = nodes(tree);
  assert.equal(elements.find(node => node.type === "h1").props.children, "My Properties");
  assert.ok(elements.some(node => node.props["aria-hidden"] === "true"));
  assert.equal(elements.find(node => node.props.className?.includes("lg:grid-cols-4")).props.children.length, 4);
  assert.equal(elements.find(node => node.props.className?.includes("xl:grid-cols-4")).props.children.length, 4);
  assert.deepEqual(elements.filter(node => node.type === "Table.Column").map(node => node.props.children), [
    "Photo", "Name", "Location", "Type", "Price", "Rating", "Status", "Actions",
  ]);
  assert.equal(elements.filter(node => node.type === "Table.Row").length, 5);
  assert.ok(elements.some(node => node.type === "Table.ScrollContainer" && node.props.className.includes("overflow-x-auto")));
  assert.ok(elements.filter(node => node.type === "Skeleton").every(node => node.props.className.includes("bg-grey-300!")));
});

test("My Properties route boundary renders its skeleton without fetching data", () => {
  const tree = load("landlord/properties/loading.tsx").default();
  const skeleton = tree.type();
  assert.equal(skeleton.props["aria-label"], "Loading properties");
});

const navItems = [
  { href: "/landlord/dashboard", label: "Dashboard", icon: "LayoutDashboard", prefetchOnIntent: true },
  { href: "/landlord/properties", label: "My Properties", icon: "Building", prefetchOnIntent: true },
  { href: "/landlord/messages", label: "Messages", icon: "Messages" },
];

function sidebarHarness(pathname = "/landlord/dashboard") {
  const prefetched = [];
  const pushed = [];
  const router = { prefetch: href => prefetched.push(href), push: href => pushed.push(href) };
  const components = load("components/layout/AppSidebar.tsx", {
    "next/navigation": { usePathname: () => pathname, useRouter: () => router, useSearchParams: () => new URLSearchParams() },
  });
  return { ...components, prefetched, pushed };
}

test("desktop overview links prefetch on pointer or keyboard intent and retain native links", () => {
  const harness = sidebarHarness();
  const elements = nodes(harness.AppSidebar({ navItems, userName: "Landlord", userRole: "Landlord", activePortal: "landlord" }));
  const properties = elements.find(node => node.type === "Link" && node.props.href === "/landlord/properties");
  properties.props.onMouseEnter();
  properties.props.onFocus();
  assert.deepEqual(harness.prefetched, ["/landlord/properties", "/landlord/properties"]);
  assert.equal(properties.props.onClick, undefined);
  assert.equal(elements.find(node => node.type === "Link" && node.props.href === "/landlord/messages").props.onFocus, undefined);
});

test("sidebar selection follows the route in either direction, not a click-only local state", () => {
  for (const pathname of ["/landlord/properties", "/landlord/dashboard", "/landlord/properties"]) {
    const harness = sidebarHarness(pathname);
    const links = nodes(harness.AppSidebar({ navItems, userName: "Landlord", userRole: "Landlord" }));
    assert.equal(links.find(node => node.type === "Link" && node.props["aria-current"] === "page").props.href, pathname);
  }
});

test("opening mobile menu warms only opted-in routes; selection uses client navigation", () => {
  const harness = sidebarHarness();
  const elements = nodes(harness.MobileSidebarNavigation({ navItems, activePortal: "landlord", userRoles: ["landlord"] }));
  const dropdown = elements.find(node => node.type === Dropdown);
  dropdown.props.onOpenChange(false);
  assert.deepEqual(harness.prefetched, []);
  dropdown.props.onOpenChange(true);
  assert.deepEqual(harness.prefetched, ["/landlord/dashboard", "/landlord/properties"]);
  elements.find(node => node.type === "Dropdown.Menu").props.onAction("/landlord/properties");
  assert.deepEqual(harness.pushed, ["/landlord/properties"]);
});
