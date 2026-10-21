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
const nav = [
  { href: "/tenant/my-rental", label: "My Rental", icon: "Home", activityKey: "rental" },
  { href: "/tenant/favorites", label: "Favorites", icon: "Heart" },
  { href: "/tenant/messages", label: "Messages", icon: "MessageCircle", activityKey: "messages" },
];
function harness({ collapsed = false, mobile = false } = {}) {
  let pathname = "/tenant/my-rental";
  let pendingHref = null;
  let linkContext = null;
  const pushes = [];
  const pending = compile("../app/components/layout/SidebarLinkPending.tsx", {
    "react/jsx-runtime": { jsx, jsxs: jsx },
    "next/link": { useLinkStatus: () => ({ pending: pendingHref === linkContext }) },
  });
  const sidebar = compile("../app/components/layout/AppSidebar.tsx", {
    react: {
      Suspense: "Suspense", useCallback: fn => fn, useMemo: fn => fn(), useEffect: () => {},
      useState: value => [value, () => {}], useSyncExternalStore: (_subscribe, snapshot) => snapshot(),
    },
    "react/jsx-runtime": { jsx, jsxs: jsx },
    "next/link": { default: "Link" },
    "next/navigation": { usePathname: () => pathname, useRouter: () => ({ push: href => pushes.push(href), prefetch: () => {} }), useSearchParams: () => new URLSearchParams() },
    "next-themes": { useTheme: () => ({ resolvedTheme: "light" }) },
    "@tabler/icons-react": new Proxy({}, { get: (_, name) => String(name) }),
    "@heroui/react": { Button: "Button", Spinner: "Spinner", Label: "Label", Separator: "Separator", Dropdown: { Menu: "Dropdown.Menu", Item: "Dropdown.Item", Section: "Dropdown.Section", Popover: "Popover" } },
    "@/hooks/use-notifications": { useNotifications: () => ({ notifications: [], unreadCount: 2 }) },
    "@/lib/sidebar-notification-activity": { getUnreadSidebarActivity: () => new Set(["messages"]) },
    "@/hooks/use-pending-navigation": { usePendingNavigation: () => ({ pendingHref, navigate: href => { pushes.push(href); pendingHref = href; } }) },
    "./SidebarLinkPending": pending,
  }, { window: { localStorage: { getItem: () => String(collapsed) } }, URLSearchParams });
  function nodes(node) {
    if (!node || typeof node !== "object") return [];
    const previous = linkContext;
    if (node.type === "Link") linkContext = node.props.href;
    const children = typeof node.type === "function" ? node.type(node.props) : node.props?.children;
    const result = [node, ...[children].flat(Infinity).flatMap(nodes)];
    linkContext = previous;
    return result;
  }
  const render = () => nodes(mobile
    ? sidebar.MobileSidebarNavigation({ navItems: nav, activePortal: "tenant", profileHref: "/tenant/profile", buttonLabel: "Open navigation" })
    : sidebar.AppSidebar({ navItems: nav, userName: "User", userRole: "Tenant", activePortal: "tenant", collapsible: true }));
  return { render, pushes, pending: href => { pendingHref = href; }, commit: href => { pathname = href; pendingHref = null; } };
}

test("sidebar keeps the real route selected and distinguishes immediate pending feedback from the hover background", () => {
  const h = harness();
  h.pending("/tenant/favorites");
  const all = h.render();
  const links = all.filter(node => node.type === "Link");
  const favorites = links.find(node => node.props.href === "/tenant/favorites");
  const rental = links.find(node => node.props.href === "/tenant/my-rental" && node.props["aria-current"]);
  assert.equal(rental.props["aria-current"], "page");
  assert.match(rental.props.className, /bg-sidebar-primary /);
  assert.equal(favorites.props["aria-current"], undefined);
  assert.match(favorites.props.className, /hover:bg-primary\/10/);
  assert.equal(favorites.props.onClick, undefined, "Next Link keeps keyboard/modifier/native navigation semantics");
  assert.equal(favorites.props.onKeyDown, undefined);
  assert.equal(all.filter(node => node.props["data-navigation-pending"]).length, 1);
  assert.ok(all.some(node => node.props.className?.includes("bottom-1 h-0.5")));
  h.commit("/tenant/favorites");
  const settled = h.render();
  assert.equal(settled.filter(node => node.props["data-navigation-pending"]).length, 0);
  assert.equal(settled.find(node => node.type === "Link" && node.props.href === "/tenant/favorites").props["aria-current"], "page");
});

test("switching destinations, cancellation and failure clear old link feedback without moving unread dots or faking active routes", () => {
  for (const collapsed of [false, true]) {
    const h = harness({ collapsed });
    for (const destination of ["/tenant/favorites", "/tenant/messages", null]) {
      h.pending(destination);
      const all = h.render();
      assert.equal(all.filter(node => node.props["data-navigation-pending"]).length, destination ? 1 : 0);
      const dots = all.filter(node => node.props.className?.includes("size-2 rounded-full"));
      assert.equal(dots.length, 1);
      assert.match(dots[0].props.className, collapsed ? /right-0\.5 top-0\.5/ : /right-3 top-1\/2/);
      assert.equal(all.find(node => node.type === "Link" && node.props.href === "/tenant/messages").props["aria-current"], undefined);
    }
  }
});

test("mobile menu/keyboard actions retain pathname semantics and expose visible pending feedback without disabling navigation", () => {
  const h = harness({ mobile: true });
  const menu = h.render().find(node => node.type === "Dropdown.Menu");
  menu.props.onAction("/tenant/messages");
  assert.deepEqual(h.pushes, ["/tenant/messages"]);
  const pending = h.render();
  const button = pending.find(node => node.type === "Button" && node.props["aria-label"] === "Open navigation");
  assert.equal(button.props["aria-busy"], true);
  assert.equal(button.props.isDisabled, undefined);
  assert.ok(JSON.stringify(button).includes("Opening…"));
  assert.equal(pending.find(node => node.type === "Dropdown.Item" && node.props.id === "/tenant/messages").props["aria-current"], undefined);
  h.commit("/tenant/messages");
  assert.equal(h.render().find(node => node.type === "Button" && node.props["aria-label"] === "Open navigation").props["aria-busy"], undefined);
});

test("dropdown pending navigation delegates its lifetime to React transitions, not a timer or permanent selected state", () => {
  let optimistic = null;
  const pushes = [];
  const transitions = [];
  const hook = compile("../hooks/use-pending-navigation.ts", {
    react: {
      useCallback: fn => fn,
      useOptimistic: initial => { assert.equal(initial, null); return [optimistic, value => { optimistic = value; }]; },
      useTransition: () => [false, fn => { transitions.push(fn); fn(); }],
    },
    "next/navigation": { useRouter: () => ({ push: href => pushes.push(href) }) },
  });
  hook.usePendingNavigation().navigate("/tenant/favorites");
  assert.equal(hook.usePendingNavigation().pendingHref, "/tenant/favorites");
  hook.usePendingNavigation().navigate("/tenant/messages");
  assert.equal(hook.usePendingNavigation().pendingHref, "/tenant/messages");
  // React restores the null base on completion/interruption/error.
  optimistic = null;
  assert.equal(hook.usePendingNavigation().pendingHref, null);
  assert.deepEqual(pushes, ["/tenant/favorites", "/tenant/messages"]);
  assert.equal(transitions.length, 2);
});
