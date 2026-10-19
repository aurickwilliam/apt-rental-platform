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
    "@heroui/react": { Skeleton: "Skeleton", Card: compound("Card", ["Content"]), Table, Dropdown, Button: "Button", Label: "Label", Separator: "Separator" },
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
    "./components/PropertyDetailSkeleton": { default: () => load("landlord/properties/[apartmentId]/components/PropertyDetailSkeleton.tsx").default() },
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
  const expand = typeof element.type === "function" && ["Sk", "FieldSkeleton", "PropertiesHeader", "default", "MobileSidebarMenu"].includes(element.type.name);
  const children = expand ? element.type(element.props) : element.props?.children;
  return [element, ...[children].flat(Infinity).flatMap(nodes)];
}

test("My Properties loading keeps its title, four stats, four actions and eight-column table", () => {
  const tree = load("landlord/properties/components/PropertiesSkeleton.tsx").default();
  assert.equal(tree.props["aria-busy"], "true");
  assert.equal(tree.props["aria-label"], "Loading properties");
  const elements = nodes(tree);
  assert.ok([elements.find(node => node.type === "h1").props.children].flat().includes("My Properties"));
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

test("Apartment detail boundary uses an accessible, responsive skeleton with rounded gallery and four stats", () => {
  const boundary = load("landlord/properties/[apartmentId]/loading.tsx").default();
  const tree = boundary.type();
  assert.equal(tree.props["aria-busy"], "true");
  assert.equal(tree.props["aria-label"], "Loading apartment details");
  const elements = nodes(tree);
  assert.ok(elements.some(node => node.props["aria-hidden"] === "true"));
  assert.equal(elements.find(node => node.props.className?.includes("lg:grid-cols-4")).props.children.length, 4);
  assert.ok(elements.some(node => node.type === "Skeleton" && node.props.className.includes("h-64 sm:h-80 w-full rounded-xl")));
  assert.equal(elements.find(node => node.props.className === "flex gap-2 overflow-x-auto p-1").props.children.length, 3);
  assert.equal(elements.find(node => node.props.className === "grid grid-cols-2 sm:grid-cols-4 gap-3").props.children.length, 8);
  assert.ok(elements.filter(node => node.type === "Skeleton").every(node => node.props.className.includes("bg-grey-300!")));
});

test("Property rows prefetch on hover and keyboard focus without changing row activation", () => {
  const property = { id: "unit-1", name: "Test apartment" };
  const intended = [];
  const opened = [];
  const tree = load("landlord/properties/components/PropertiesTable.tsx", {
    "./propertyConstants": { STATUS_COLOR: {} },
    "@/app/components/display/StatusChip": { default: "StatusChip" },
  }).default({ properties: [property], onRowIntent: item => intended.push(item.id), onRowClick: item => opened.push(item.id) });
  const elements = nodes(tree);
  const row = elements.find(node => node.type === "Table.Row");
  row.props.onMouseEnter();
  tree.props.onFocusCapture({ target: { closest: () => ({ dataset: { propertyId: "unit-1" } }) } });
  assert.deepEqual(intended, ["unit-1", "unit-1"]);
  assert.deepEqual(opened, []);
  elements.find(node => node.type === "Table.Content").props.onRowAction("unit-1");
  assert.deepEqual(opened, ["unit-1"]);
});

function galleryHarness(initialImages) {
  const state = [];
  let cursor = 0;
  const { default: Gallery } = load("landlord/properties/[apartmentId]/components/PropertyPhotoGallery.tsx", {
    react: {
      useState: initial => {
        const index = cursor++;
        if (!(index in state)) state[index] = initial;
        return [state[index], value => { state[index] = value; }];
      },
    },
    "@/app/components/display/PhotoGalleryModal": { default: "PhotoGalleryModal" },
  });
  return (images = initialImages) => {
    cursor = 0;
    return nodes(Gallery({ name: "Cozy Cove", images }));
  };
}

test("Property gallery starts with the cover, selects thumbnails, and opens the shared full-size viewer", () => {
  const photos = [
    { id: "room", url: "/room.jpg", url_thumb: "/room-thumb.jpg", is_cover: false },
    { id: "cover", url: "/cover.jpg", is_cover: true },
  ];
  const render = galleryHarness(photos);
  let elements = render();
  assert.equal(elements.find(node => node.type === "Image").props.src, "/cover.jpg");
  const thumbs = elements.filter(node => node.type === "Button" && node.props["aria-pressed"] !== undefined);
  assert.equal(thumbs.length, 2);
  assert.equal(thumbs[0].props["aria-pressed"], true);
  thumbs[1].props.onPress();
  elements = render();
  assert.equal(elements.find(node => node.type === "Image").props.src, "/room.jpg");
  elements.find(node => node.type === "Button" && node.props["aria-label"].startsWith("Open photo")).props.onPress();
  const viewer = render().find(node => node.type === "PhotoGalleryModal");
  assert.equal(viewer.props.isOpen, true);
  assert.equal(viewer.props.activeIndex, 1);
  viewer.props.onActiveIndexChange(0);
  assert.equal(render().find(node => node.type === "Image").props.src, "/cover.jpg");
});

test("Property gallery handles deleted selections, a single photo, and an empty gallery", () => {
  const photos = [
    { id: "cover", url: "/cover.jpg", is_cover: true },
    { id: "room", url: "/room.jpg", is_cover: false },
  ];
  const render = galleryHarness(photos);
  render().filter(node => node.type === "Button" && node.props["aria-pressed"] !== undefined)[1].props.onPress();
  const single = render([photos[0]]);
  assert.equal(single.find(node => node.type === "Image").props.src, "/cover.jpg");
  assert.equal(single.some(node => node.props["aria-label"] === "Choose property photo"), false);
  const empty = render([]);
  assert.equal(empty.some(node => node.type === "PhotoGalleryModal"), false);
  assert.ok(empty.some(node => node.type === "p" && node.props.children.includes("No property photos yet")));
});

test("Edit Property uses a wider scoped dialog and equal-width footer actions", () => {
  const source = readFileSync(new URL("../app/landlord/properties/components/modals/EditPropertyModal.tsx", import.meta.url), "utf8");
  const styles = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(source, /<Modal\.Dialog className="edit-property-modal">/);
  assert.match(source, /<Modal\.Container size="lg" scroll="inside">/);
  assert.match(source, /<Modal\.Footer className="edit-property-modal-footer">/);
  assert.match(styles, /\.edit-property-modal\s*\{\s*max-width: 56rem;/);
  assert.match(styles, /\.edit-property-modal \.edit-property-modal-footer\s*\{[^}]*grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
});

const navItems = [
  { href: "/landlord/dashboard", label: "Dashboard", icon: "LayoutDashboard", prefetchOnIntent: true },
  { href: "/landlord/properties", label: "My Properties", icon: "Building", prefetchOnIntent: true },
  { href: "/landlord/applications", label: "Applications", icon: "FileCheck", prefetchOnIntent: true },
  { href: "/landlord/maintenance-requests", label: "Maintenance", icon: "Tool", prefetchOnIntent: true },
  { href: "/landlord/payments", label: "Payments", icon: "CashBanknote", prefetchOnIntent: true },
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
  const applications = elements.find(node => node.type === "Link" && node.props.href === "/landlord/applications");
  applications.props.onFocus();
  assert.equal(harness.prefetched.at(-1), "/landlord/applications");
  const maintenance = elements.find(node => node.type === "Link" && node.props.href === "/landlord/maintenance-requests");
  maintenance.props.onMouseEnter();
  maintenance.props.onFocus();
  assert.equal(harness.prefetched.at(-1), "/landlord/maintenance-requests");
  const payments = elements.find(node => node.type === "Link" && node.props.href === "/landlord/payments");
  payments.props.onMouseEnter();
  payments.props.onFocus();
  assert.equal(harness.prefetched.at(-1), "/landlord/payments");
  assert.equal(elements.find(node => node.type === "Link" && node.props.href === "/landlord/messages").props.onFocus, undefined);
});

test("sidebar selection follows the route in either direction, not a click-only local state", () => {
  for (const pathname of ["/landlord/properties", "/landlord/payments", "/landlord/maintenance-requests", "/landlord/applications", "/landlord/dashboard", "/landlord/payments"]) {
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
  assert.deepEqual(harness.prefetched, ["/landlord/dashboard", "/landlord/properties", "/landlord/applications", "/landlord/maintenance-requests", "/landlord/payments"]);
  elements.find(node => node.type === "Dropdown.Menu").props.onAction("/landlord/properties");
  assert.deepEqual(harness.pushed, ["/landlord/properties"]);
});
