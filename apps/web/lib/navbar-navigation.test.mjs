import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
import { translate } from "../../../packages/i18n/src/translate.ts";
import { PORTAL_COOKIE, preferredPortal } from "./portal-preference.ts";

const locale = {
  useTranslation: () => ({
    language: "en",
    pending: false,
    setLanguage: () => {},
    t: (key, vars) => translate("en", key, vars),
  }),
};

function renderNavbar({ roles, pathname = "/browse", cookie = "" }) {
  const pushes = [];
  const jsx = (type, props) => ({ type, props });
  const dropdown = { Popover: "Dropdown.Popover", Menu: "Dropdown.Menu", Item: "Dropdown.Item" };
  const modules = {
    react: { useState: (value) => [value, () => {}], useEffect: () => {} },
    "react/jsx-runtime": { jsx, jsxs: jsx, Fragment: "Fragment" },
    "next/navigation": { usePathname: () => pathname, useRouter: () => ({ push: (href) => pushes.push(href) }), useSearchParams: () => new URLSearchParams() },
    "next/link": { default: "Link" }, "next/image": { default: "Image" },
    "@heroui/react": { Dropdown: dropdown, Button: "Button", Label: "Label" },
    "@tabler/icons-react": {},
    "@/app/components/i18n/LocaleProvider": locale,
    "@/hooks/use-hydrated": { useHydrated: () => true },
    "./ThemeToggle": { default: "ThemeToggle" },
    "@/app/components/i18n/LanguageToggle": { default: "LanguageToggle" },
    "@/app/components/profile/UserAvatar": { default: "UserAvatar" },
    "@/hooks/use-user": { useUser: () => ({ user: roles ? { id: "auth-a", email: "test@example.com" } : null, profile: roles ? { roles } : null, loading: false }) },
    "@/service/signOutService": { signOut: () => {} },
    "@/app/components/settings/SettingsOverlay": { SETTINGS_QUERY_VALUE: "open" },
    "@/lib/portal-preference": { PORTAL_COOKIE, preferredPortal },
  };
  const exports = {};
  vm.runInNewContext(ts.transpileModule(readFileSync(new URL("../app/components/layout/AppNavbar.tsx", import.meta.url), "utf8"), {
    compilerOptions: { target: ts.ScriptTarget.ES2017, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText, { exports, require: (name) => { assert.ok(name in modules, name); return modules[name]; }, document: { cookie }, URLSearchParams });
  const nodes = (node) => !node || typeof node !== "object" ? [] : [node, ...[node.props?.children].flat(Infinity).flatMap(nodes)];
  return { nodes: nodes(exports.default()), pushes };
}

test("desktop public account navigation uses the client router and retains existing portal destination rules", () => {
  const cases = [
    { roles: ["tenant"], profile: "/tenant/profile", dashboard: "/tenant/my-rental" },
    { roles: ["landlord"], profile: "/landlord/profile", dashboard: "/landlord/dashboard" },
    { roles: ["tenant", "landlord"], cookie: "apt_portal=tenant", profile: "/tenant/profile", dashboard: "/tenant/my-rental" },
    { roles: ["tenant", "landlord"], cookie: "apt_portal=landlord", profile: "/landlord/profile", dashboard: "/landlord/dashboard" },
    { roles: ["tenant"], cookie: "apt_portal=landlord", profile: "/tenant/profile", dashboard: "/tenant/my-rental" },
    { roles: ["admin", "tenant", "landlord"], profile: "/admin/dashboard", dashboard: "/admin/dashboard" },
    { roles: ["tenant", "landlord"], pathname: "/tenant/browse", cookie: "apt_portal=landlord", profile: "/landlord/profile", dashboard: "/tenant/my-rental" },
    { roles: ["admin", "landlord"], pathname: "/landlord/profile", profile: "/landlord/profile", dashboard: "/admin/dashboard" },
  ];
  for (const item of cases) {
    const h = renderNavbar(item);
    const menu = h.nodes.find((node) => node.type === "Dropdown.Menu");
    assert.ok(menu);
    menu.props.onAction("profile");
    menu.props.onAction("dashboard");
    assert.deepEqual(h.pushes, [item.profile, item.dashboard]);
  }
});

test("signed-out navbar still offers sign-in/sign-up Links and no private account actions", () => {
  const h = renderNavbar({ roles: null });
  assert.ok(!h.nodes.some((node) => node.type === "Dropdown.Menu"));
  assert.ok(h.nodes.some((node) => node.type === "Link" && node.props.href === "/sign-in"));
  assert.ok(h.nodes.some((node) => node.type === "Link" && node.props.href === "/sign-up"));
  assert.deepEqual(h.pushes, []);
});
