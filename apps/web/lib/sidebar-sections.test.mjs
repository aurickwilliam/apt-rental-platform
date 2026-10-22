import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const jsx = (type, props) => ({ type, props });
function compile(file, modules, globals = {}) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(readFileSync(new URL(file, import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2017, jsx: ts.JsxEmit.ReactJSX },
  }).outputText, { exports, require: name => modules[name] ?? { default: name }, ...globals });
  return exports;
}

const sectioned = [
  { href: "/landlord/dashboard", label: "Dashboard", icon: "LayoutDashboard", section: "Overview" },
  { href: "/landlord/properties", label: "My Properties", icon: "Building", section: "Rentals" },
  { href: "/landlord/applications", label: "Applications", icon: "FileCheck", section: "Rentals" },
  { href: "/landlord/payments", label: "Payments", icon: "CashBanknote", section: "Finance" },
];
const flat = sectioned.map(item => ({ href: item.href, label: item.label, icon: item.icon }));

function render({ navItems, collapsed = false, mobile = false }) {
  const sidebar = compile("../app/components/layout/AppSidebar.tsx", {
    react: {
      Fragment: "Fragment", Suspense: "Suspense", useCallback: fn => fn, useMemo: fn => fn(), useEffect: () => {},
      useState: value => [value, () => {}], useSyncExternalStore: (_subscribe, snapshot) => snapshot(),
    },
    "react/jsx-runtime": { jsx, jsxs: jsx, Fragment: "Fragment" },
    "next/link": { default: "Link" },
    "next/navigation": { usePathname: () => "/landlord/dashboard", useRouter: () => ({ push: () => {}, prefetch: () => {} }), useSearchParams: () => new URLSearchParams() },
    "next-themes": { useTheme: () => ({ resolvedTheme: "light" }) },
    "@tabler/icons-react": new Proxy({}, { get: (_, name) => String(name) }),
    "@heroui/react": { Button: "Button", Spinner: "Spinner", Label: "Label", Separator: "Separator", Dropdown: { Menu: "Dropdown.Menu", Item: "Dropdown.Item", Section: "Dropdown.Section", Popover: "Popover" } },
    "@/hooks/use-notifications": { useNotifications: () => ({ notifications: [], unreadCount: 0 }) },
    "@/lib/sidebar-notification-activity": { getUnreadSidebarActivity: () => new Set() },
    "@/hooks/use-pending-navigation": { usePendingNavigation: () => ({ pendingHref: null, navigate: () => {} }) },
    "./SidebarLinkPending": { default: "SidebarLinkPending" },
  }, { window: { localStorage: { getItem: () => String(collapsed) } }, URLSearchParams });
  const nodes = node => {
    if (!node || typeof node !== "object") return [];
    const children = typeof node.type === "function" ? node.type(node.props) : node.props?.children;
    return [node, ...[children].flat(Infinity).flatMap(nodes)];
  };
  const tree = mobile
    ? sidebar.MobileSidebarNavigation({ navItems, activePortal: "landlord", profileHref: "/landlord/profile", buttonLabel: "Open navigation" })
    : sidebar.AppSidebar({ navItems, userName: "User", userRole: "Landlord", activePortal: "landlord", collapsible: true });
  return nodes(tree);
}

const navLinks = all => all.filter(node => node.type === "Link" && /min-h-11/.test(node.props.className ?? ""));

test("expanded sidebar groups consecutive items with a separator between groups and no visible headings", () => {
  const all = render({ navItems: sectioned });
  const groups = all.filter(node => node.props?.role === "group");
  assert.deepEqual(groups.map(node => node.props["aria-label"]), ["Overview", "Rentals", "Finance"]);
  assert.equal(all.filter(node => node.type === "Separator").length >= 2, true);
  assert.equal(all.filter(node => node.type === "p" && /uppercase/.test(node.props.className ?? "")).length, 0);
  const rentals = groups.find(node => node.props["aria-label"] === "Rentals");
  const rentalLinks = [rentals.props.children].flat(Infinity).flatMap(function find(node) {
    if (!node || typeof node !== "object") return [];
    return [node, ...[node.props?.children].flat(Infinity).flatMap(find)];
  }).filter(node => node.type === "Link").map(node => node.props.href);
  assert.deepEqual(rentalLinks, ["/landlord/properties", "/landlord/applications"]);
});

test("collapsed rail keeps the group separators", () => {
  const all = render({ navItems: sectioned, collapsed: true });
  assert.equal(all.filter(node => node.type === "p" && /uppercase/.test(node.props.className ?? "")).length, 0);
  assert.equal(all.filter(node => node.type === "Separator").length >= 2, true);
  assert.equal(navLinks(all).length, sectioned.length);
});

test("items without a section render as one group with no labels or separators", () => {
  const all = render({ navItems: flat });
  assert.equal(all.filter(node => node.props?.role === "group").length, 0);
  assert.equal(all.filter(node => node.type === "p" && /uppercase/.test(node.props.className ?? "")).length, 0);
  assert.equal(navLinks(all).length, flat.length);
});

test("mobile menu renders one section per group, split by separators", () => {
  const all = render({ navItems: sectioned, mobile: true });
  const sections = all.filter(node => node.type === "Dropdown.Section").map(node => node.props["aria-label"]);
  assert.deepEqual(sections.slice(0, 3), ["Overview", "Rentals", "Finance"]);
  assert.equal(all.filter(node => node.type === "Dropdown.Item" && sectioned.some(item => item.href === node.props.id)).length, sectioned.length);
});

function renderNotificationsItem({ entry, unreadCount = 0, collapsed = false, pushed = [] }) {
  const item = compile("../app/components/layout/SidebarNotificationsItem.tsx", {
    "react/jsx-runtime": { jsx, jsxs: jsx },
    "@tabler/icons-react": { IconBell: "IconBell" },
    "@/app/components/notifications/NotificationsOverlay": { NOTIFICATIONS_QUERY_VALUE: "open" },
    "@/hooks/use-notification-display-preferences": { useNotificationDisplayPreferences: () => ({ preferences: { entry, drawerSide: "right" } }) },
    "@/hooks/use-notifications": { useNotifications: () => ({ unreadCount }) },
  }, { window: { location: { href: "http://localhost/landlord/dashboard?tab=1#top" }, history: { pushState: (_state, _title, url) => pushed.push(url) } }, URL });
  return item.default({ activePortal: "landlord", collapsed });
}

test("Notifications tab is hidden while the floating bell is the chosen entry point", () => {
  assert.equal(renderNotificationsItem({ entry: "bell", unreadCount: 3 }), null);
});

test("Notifications tab opens the drawer through the shared query param", () => {
  const pushed = [];
  const button = renderNotificationsItem({ entry: "sidebar", pushed });
  assert.equal(button.type, "button");
  assert.equal(button.props["aria-haspopup"], "dialog");
  button.props.onClick();
  assert.deepEqual(pushed, ["/landlord/dashboard?tab=1&notifications=open#top"]);
});

test("Notifications tab shows an unread dot, never a count, and a label-only collapsed rail", () => {
  const unread = renderNotificationsItem({ entry: "sidebar", unreadCount: 4 });
  assert.equal(unread.props["aria-label"], "Notifications, Unread activity");
  assert.equal([unread.props.children].flat(Infinity).filter(child => /size-2 rounded-full/.test(child?.props?.className ?? "")).length, 1);
  const collapsed = renderNotificationsItem({ entry: "sidebar", collapsed: true });
  assert.equal(collapsed.props.title, "Notifications");
  assert.equal([collapsed.props.children].flat(Infinity).some(child => child?.type === "span" && child.props.children === "Notifications"), false);
});
