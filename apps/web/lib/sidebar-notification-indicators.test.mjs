import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
import * as audience from "./notification-audience.ts";

const jsx = (type, props) => ({ type, props });
function compile(file, modules, suffix = "") {
  const exports = {};
  const source = readFileSync(new URL(file, import.meta.url), "utf8") + suffix;
  vm.runInNewContext(ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2017, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText, {
    exports,
    require: name => modules[name] ?? { default: name },
    window: { localStorage: { getItem: () => modules.collapsed ? "true" : null } },
    URLSearchParams,
  });
  return exports;
}
const mapping = compile("./sidebar-notification-activity.ts", { "./notification-audience": audience });
function navItems(portal) {
  return compile(`../app/${portal}/layout.tsx`, {
    "react/jsx-runtime": { jsx, jsxs: jsx },
  }, `\nexport const TEST_NAV = ${portal.toUpperCase()}_NAV;`).TEST_NAV;
}
const nodes = element => {
  if (!element || typeof element !== "object") return [];
  const children = typeof element.type === "function" ? element.type(element.props) : element.props?.children;
  return [element, ...[children].flat(Infinity).flatMap(nodes)];
};
const dots = element => nodes(element).filter(n => n.type === "span" && n.props.className?.includes("size-2 rounded-full"));
const row = (screen, title, type, data = {}) => ({
  id: title, title, type, data: { screen, ...(screen === "chat" ? { recipientPortal: "tenant" } : {}), ...data }, is_read: false,
});
function sidebar({ portal = "tenant", collapsed = false, dark = false, mobile = false, rows = [], hiddenPassport = false } = {}) {
  const navigation = [];
  const prefetched = [];
  let writes = 0;
  const component = compile("../app/components/layout/AppSidebar.tsx", {
    collapsed,
    react: {
      Suspense: "Suspense", useMemo: fn => fn(), useCallback: fn => fn,
      useEffect: () => {}, useState: initial => [initial, () => {}],
      useSyncExternalStore: (_subscribe, snapshot) => snapshot(),
    },
    "react/jsx-runtime": { jsx, jsxs: jsx },
    "next/link": { default: "Link" }, "next/image": { default: "Image" },
    "next/navigation": {
      usePathname: () => `/${portal}/${portal === "tenant" ? "my-rental" : "dashboard"}`,
      useRouter: () => ({ push: href => navigation.push(href), prefetch: href => prefetched.push(href) }),
      useSearchParams: () => new URLSearchParams(),
    },
    "next-themes": { useTheme: () => ({ resolvedTheme: dark ? "dark" : "light", setTheme: () => {} }) },
    "@tabler/icons-react": new Proxy({}, { get: (_, key) => String(key) }),
    "@heroui/react": {
      Button: "Button", Label: "Label", Separator: "Separator",
      Dropdown: { Item: "Dropdown.Item", Section: "Dropdown.Section", Menu: "Dropdown.Menu", Popover: "Dropdown.Popover" },
    },
    "@/hooks/use-notifications": { useNotifications: () => ({
      notifications: rows, unreadCount: rows.filter(n => !n.is_read).length,
      markOneRead: () => writes++, markVisibleRead: () => writes++,
    }) },
    "@/lib/sidebar-notification-activity": mapping,
  });
  const nav = navItems(portal).filter(n => !hiddenPassport || n.activityKey !== "passport");
  const tree = mobile
    ? component.MobileSidebarNavigation({ navItems: nav, activePortal: portal, iconSet: "tabler", profileHref: `/${portal}/profile` })
    : component.AppSidebar({ navItems: nav, activePortal: portal, userName: "User", userRole: portal, collapsible: true, iconSet: "tabler" });
  const all = nodes(tree);
  const links = all.filter(n => mobile
    ? n.type === "Dropdown.Item" && n.props.id?.startsWith(`/${portal}/`)
    : n.type === "Link" && nav.some(item => item.href === n.props.href));
  return { links, all, navigation, prefetched, writes: () => writes };
}

test("desktop indicators are 8px, right-aligned and limited to relevant configured sections", () => {
  const result = sidebar({ rows: [row("payments", "Payment Successful", "payment"), row("chat", "Actor", "message", { event: "reaction" })] });
  const indicated = result.links.filter(link => dots(link).length);
  assert.deepEqual(indicated.map(n => n.props.href), ["/tenant/my-rental", "/tenant/messages"]);
  for (const link of indicated) {
    assert.match(link.props["aria-label"], /, Unread activity$/);
    assert.equal(dots(link)[0].props["aria-hidden"], "true");
    assert.match(dots(link)[0].props.className, /right-3 top-1\/2/);
  }
  assert.match(dots(indicated[0])[0].props.className, /bg-sidebar-primary-foreground/);
  assert.match(dots(indicated[1])[0].props.className, /bg-primary/);
});

test("collapsed rails keep the dot away from the icon and retain accessible labels", () => {
  const result = sidebar({ collapsed: true, rows: [row("chat", "Actor", "message")] });
  const link = result.links.find(n => n.props.href === "/tenant/messages");
  assert.equal(link.props["aria-label"], "Messages, Unread activity");
  assert.equal(link.props.title, "Messages, Unread activity");
  assert.match(dots(link)[0].props.className, /right-0.5 top-0.5/);
  assert.equal(link.props["aria-current"], undefined);
});

test("indicator placement and theme tokens do not shift when read state changes", () => {
  const n = row("chat", "Actor", "message");
  for (const dark of [false, true]) {
    const before = sidebar({ dark, rows: [n] }).links;
    const after = sidebar({ dark, rows: [{ ...n, is_read: true }] }).links;
    assert.deepEqual(before.map(n => n.props.className), after.map(n => n.props.className));
    assert.equal(before.flatMap(dots).length, 1);
    assert.equal(after.flatMap(dots).length, 0);
  }
});

test("mobile web uses the same section dots without acknowledging navigation", () => {
  const result = sidebar({ mobile: true, rows: [row("chat", "Actor", "message")] });
  const link = result.links.find(n => n.props.id === "/tenant/messages");
  assert.equal(dots(link).length, 1);
  assert.match(dots(link)[0].props.className, /bg-primary/);
  assert.equal(link.props["aria-label"], "Messages, Unread activity");
  result.all.find(n => n.type === "Dropdown.Menu").props.onAction("/tenant/messages");
  assert.deepEqual(result.navigation, ["/tenant/messages"]);
  assert.equal(result.writes(), 0);
});

test("Passport activity never restores a hidden navigation item", () => {
  for (const mobile of [false, true]) {
    const result = sidebar({ mobile, hiddenPassport: true, rows: [row("passport", "Passport document rejected", "system", { documentId: "doc" })] });
    assert.equal(result.links.some(n => (n.props.href ?? n.props.id).endsWith("/passport")), false);
    assert.equal(result.links.flatMap(dots).length, 0);
  }
});

test("landlord properties and admin review submissions illuminate only their intended section", () => {
  for (const mobile of [false, true]) {
    const landlord = sidebar({ mobile, portal: "landlord", rows: [row("verification", "Apartment verification approved", "system", { apartmentId: "apt" })] });
    assert.deepEqual(landlord.links.filter(n => dots(n).length).map(n => n.props.href ?? n.props.id), ["/landlord/properties"]);
    const admin = sidebar({ mobile, portal: "admin", rows: [row("passportReview", "New passport document submitted", "system", { documentId: "doc" })] });
    assert.deepEqual(admin.links.filter(n => dots(n).length).map(n => n.props.href ?? n.props.id), ["/admin/verification"]);
  }
});

test("landlord route prefetch and unread indicators coexist on expanded and collapsed links", () => {
  for (const collapsed of [false, true]) {
    const result = sidebar({ portal: "landlord", collapsed, rows: [row("verification", "Apartment verification approved", "system", { apartmentId: "apt" })] });
    const properties = result.links.find(link => link.props.href === "/landlord/properties");
    assert.equal(dots(properties).length, 1);
    assert.equal(properties.props["aria-label"], "My Properties, Unread activity");
    properties.props.onMouseEnter();
    properties.props.onFocus();
    assert.deepEqual(result.prefetched, ["/landlord/properties", "/landlord/properties"]);
    assert.deepEqual(result.navigation, []);
    assert.equal(result.writes(), 0);
  }
});

test("opening landlord mobile navigation prefetches main's routes without reading notifications", () => {
  const result = sidebar({ portal: "landlord", mobile: true, rows: [row("verification", "Apartment verification approved", "system", { apartmentId: "apt" })] });
  const dropdown = result.all.find(node => typeof node.props.onOpenChange === "function");
  dropdown.props.onOpenChange(true);
  assert.deepEqual(result.prefetched, ["/landlord/profile", "/landlord/dashboard", "/landlord/properties", "/landlord/applications", "/landlord/maintenance-requests", "/landlord/payments"]);
  const properties = result.links.find(link => link.props.id === "/landlord/properties");
  assert.equal(dots(properties).length, 1);
  assert.equal(result.writes(), 0);
});
