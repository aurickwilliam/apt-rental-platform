import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { compile, hookRuntime } from "./test-support/hook-runtime.mjs";
import { terms, privacy } from "./test-support/legal-policy-runtime.mjs";
import * as portalPreference from "../../../packages/supabase/src/portal-preference.ts";
import { isPendingOnboarding } from "../../../packages/supabase/src/pending-onboarding.ts";

const routes = compile("lib/policy-routes.ts", { "@repo/supabase/portal-preference": portalPreference });
const jsx = { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }) };
const nodes = value => !value || typeof value !== "object" ? [] : [value, ...[value.props?.children].flat(Infinity).flatMap(nodes)];
const profile = { roles: ["tenant"], account_status: "verified", mobile_number: "09171234567", is_suspended: false };

test("policy links keep the active portal and validate direct-link portal preferences against held roles", () => {
  for (const [policy, path] of [["privacy", "pap"], ["terms", "tos"]]) {
    assert.equal(routes.policyHref(policy), `/${path}`);
    for (const portal of ["tenant", "landlord", "admin"]) assert.equal(routes.policyHref(policy, portal), `/${portal}/${path}`);
  }
  assert.equal(routes.policyPortal(["tenant", "landlord"], "tenant"), "tenant");
  assert.equal(routes.policyPortal(["tenant", "landlord"], "landlord"), "landlord");
  assert.equal(routes.policyPortal(["tenant"], "landlord"), "tenant");
  assert.equal(routes.policyPortal(["landlord"], "tenant"), "landlord");
  assert.equal(routes.policyPortal(["admin", "tenant"], "tenant"), "admin");
  assert.equal(routes.policyPortal([], "tenant"), null);
});

test("public policy requests redirect only settled signed-in accounts; onboarding and unknown states remain readable", async () => {
  let identity = { user: { id: "auth-1" }, profile, error: null };
  let selected = "tenant";
  const { redirectSignedInPolicy } = compile("lib/server-policy-navigation.ts", {
    "server-only": {},
    "next/headers": { cookies: async () => ({ get: () => ({ value: selected }) }) },
    "next/navigation": { redirect: href => { throw new Error(`REDIRECT:${href}`); } },
    "@repo/supabase/pending-onboarding": { isPendingOnboarding },
    "@/lib/server-identity": { getServerIdentity: async () => identity },
    "@/lib/portal-preference": portalPreference,
    "@/lib/policy-routes": routes,
  });
  for (const portal of ["tenant", "landlord", "admin"]) {
    identity = { user: { id: "auth-1" }, profile: { ...profile, roles: [portal] }, error: null };
    for (const [policy, path] of [["privacy", "pap"], ["terms", "tos"]]) {
      await assert.rejects(redirectSignedInPolicy(policy), new RegExp(`REDIRECT:/${portal}/${path}$`));
    }
  }
  identity = { user: { id: "auth-1" }, profile: { ...profile, roles: ["tenant", "landlord"] }, error: null };
  for (const portal of ["tenant", "landlord"]) {
    selected = portal;
    await assert.rejects(redirectSignedInPolicy("privacy"), new RegExp(`REDIRECT:/${portal}/pap$`));
  }
  identity.profile = { ...profile, roles: ["landlord"], account_status: "unverified" };
  await assert.rejects(redirectSignedInPolicy("privacy"), /REDIRECT:\/landlord\/pap$/);
  for (const unavailable of [
    { user: null, profile: null, error: null },
    { user: { id: "auth-1" }, profile: null, error: null },
    { user: { id: "auth-1" }, profile, error: new Error("Profile unavailable") },
    { user: { id: "auth-1" }, profile: { ...profile, is_suspended: true }, error: null },
    { user: { id: "auth-1" }, profile: { ...profile, account_status: "unverified", mobile_number: null }, error: null },
    { user: { id: "auth-1" }, profile: { ...profile, roles: [] }, error: null },
  ]) {
    identity = unavailable;
    assert.equal(await redirectSignedInPolicy("privacy"), undefined);
  }
});

test("each public/portal route uses the same policy body and preserves its own authorization", async () => {
  for (const [policy, path, component, meta] of [
    ["privacy", "pap", "PrivacyPolicyPage", "privacyPolicyMetadata"],
    ["terms", "tos", "TermsPolicyPage", "termsPolicyMetadata"],
  ]) {
    for (const portal of [null, "tenant", "landlord", "admin"]) {
      const calls = [];
      let denied = false;
      const authorize = (...args) => {
        calls.push(args);
        if (denied) throw new Error("Access denied");
      };
      const pageModule = compile(`app/${portal ?? "(main)"}/${path}/page.tsx`, {
        "react/jsx-runtime": jsx,
        [`@/app/components/legal/${component}`]: { default: component, [meta]: { title: policy } },
        "@/lib/server-policy-navigation": { redirectSignedInPolicy: authorize },
        "@/lib/server-identity": { requirePortalViewer: authorize },
        "@/app/admin/_lib/require-admin": { requireAdmin: authorize },
      });
      const body = await pageModule.default();
      assert.equal(body.type, component);
      assert.equal(body.props.layout, portal === null ? undefined : "portal");
      assert.deepEqual(calls, [portal === null ? [policy] : portal === "admin" ? [] : portal === "landlord" ? [portal, true] : [portal]]);
      assert.equal(pageModule.metadata.title, policy);
      denied = true;
      await assert.rejects(pageModule.default(), /Access denied/);
    }
  }
});

test("shared policy bodies retain their hero, contents and all sections without adding either navigation shell", () => {
  const base = "@/app/(main)/components/legal/";
  for (const [component, data, path] of [["PrivacyPolicyPage", privacy, "pap"], ["TermsPolicyPage", terms, "tos"]]) {
    const page = compile(`app/components/legal/${component}.tsx`, {
      "./PolicyBackButton": { default: "PolicyBackButton" },
      "react/jsx-runtime": jsx,
      "@tabler/icons-react": { IconShieldCheck: "IconShieldCheck" },
      ...Object.fromEntries(["LegalBlocks", "LegalBulletList", "LegalHero", "LegalSection", "LegalTableOfContents"].map(name => [`${base}${name}`, { default: name }])),
      [`@/app/(main)/${path}/data/${path}-sections`]: data,
    }).default;
    const all = nodes(page());
    assert.equal(all.filter(node => node.type === "LegalSection").length, data.SECTIONS.length);
    assert.equal(all.filter(node => node.type === "LegalTableOfContents").length, 1);
    assert.equal(all.filter(node => node.type === "LegalHero").length, 1);
    assert.equal(all.find(node => node.type === "LegalHero").props.navigation.type, "PolicyBackButton");
    assert.equal(all.some(node => ["AppNavbar", "Footer", "AppSidebar"].includes(node.type)), false);
    assert.equal(all.find(node => node.type === "LegalTableOfContents").props.layout, "public");
    const portalBody = nodes(page({ layout: "portal" }));
    assert.equal(portalBody.find(node => node.type === "LegalTableOfContents").props.layout, "portal");
  }
  for (const portal of ["tenant", "landlord", "admin"]) {
    const source = readFileSync(new URL(`../app/${portal}/layout.tsx`, import.meta.url), "utf8");
    assert.match(source, /<AppSidebar/);
    assert.match(source, /<MobileSidebarNavigation/);
    assert.doesNotMatch(source, /AppNavbar|<Footer/);
  }
});

test("Settings Help and Security links use the passed portal, not account-role priority", () => {
  const runtime = hookRuntime();
  const Help = compile("app/components/settings/tabs/HelpTab.tsx", {
    react: runtime.react, "react/jsx-runtime": jsx, "next/link": { default: "Link" },
    "@tabler/icons-react": {}, "@heroui/react": {},
    "../SettingsRow": { default: "SettingsRow" }, "../ComingSoonChip": { default: "ComingSoonChip" },
    "@/lib/policy-routes": routes,
  }).default;
  const Security = compile("app/components/settings/tabs/SecurityTab.tsx", {
    "react/jsx-runtime": jsx, "next/link": { default: "Link" },
    "@tabler/icons-react": {}, "@heroui/react": {},
    "@/hooks/use-email-change-eligibility": {}, "@/hooks/use-password-sign-in-status": {},
    "../SettingsRow": { default: "SettingsRow" }, "../StatusChip": { default: "StatusChip" },
    "./AdminTwoStep": { default: "AdminTwoStep" }, "@/lib/policy-routes": routes,
  }).default;
  for (const activePortal of [null, "tenant", "landlord", "admin"]) {
    const helpLinks = nodes(runtime.render(() => Help({ activePortal, isAdmin: true }))).filter(node => node.type === "Link");
    assert.equal(helpLinks.find(node => node.props.children === "Terms and Conditions").props.href, routes.policyHref("terms", activePortal));
    assert.equal(helpLinks.find(node => node.props.children === "Privacy Policy").props.href, routes.policyHref("privacy", activePortal));
    const privacyLink = nodes(Security({ isAdmin: true, activePortal })).find(node => node.type === "Link");
    assert.equal(privacyLink.props.href, routes.policyHref("privacy", activePortal));
  }
  const modal = readFileSync(new URL("../app/components/settings/SettingsModal.tsx", import.meta.url), "utf8");
  assert.match(modal, /<HelpTab[^>]*activePortal=\{resolvedPortal\}/);
  assert.match(modal, /<SecurityTab[^>]*activePortal=\{resolvedPortal\}/);
});
