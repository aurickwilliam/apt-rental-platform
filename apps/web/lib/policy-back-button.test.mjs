import assert from "node:assert/strict";
import test from "node:test";
import { compile } from "./test-support/hook-runtime.mjs";
import { translate } from "../../../packages/i18n/src/index.ts";

const jsx = { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }) };
const nodes = value => !value || typeof value !== "object" ? [] : [value, ...[value.props?.children].flat(Infinity).flatMap(nodes)];

function backButton(browser = {}) {
  const calls = [];
  const Back = compile("app/browse/[apartmentId]/components/BackBtn.tsx", {
    "react/jsx-runtime": jsx,
    "next/navigation": { useRouter: () => ({ back: () => calls.push("back"), replace: href => calls.push(href) }) },
    "@heroui/react": { Button: "Button" },
    "@tabler/icons-react": { IconArrowLeft: "IconArrowLeft" },
    "@/app/components/i18n/LocaleProvider": { useTranslation: () => ({ language: "en", t: (key, vars) => translate("en", key, vars) }) },
  }, {
    URL,
    window: { location: { href: "https://apt.example/tenant/pap", origin: "https://apt.example" }, history: { length: browser.length ?? 2 }, navigation: browser.navigation },
    document: { referrer: browser.referrer ?? "" },
  }).default;
  return { Back, calls };
}

test("policy Back uses same-origin SPA history and keeps the existing accessible outline button", () => {
  const h = backButton({ navigation: { currentEntry: { index: 1 }, entries: () => [{ url: "https://apt.example/tenant/my-rental?settings=open" }, { url: "https://apt.example/tenant/pap" }] } });
  const button = h.Back({ fallbackHref: "/tenant/my-rental" });
  assert.equal(button.type, "Button");
  assert.equal(button.props.type, "button");
  assert.equal(button.props.variant, "outline");
  assert.ok(button.props.children.includes("Back"));
  assert.equal(nodes(button).find(node => node.type === "IconArrowLeft").props["aria-hidden"], "true");
  button.props.onPress();
  assert.deepEqual(h.calls, ["back"]);
});

test("direct visits and external or unavailable previous entries stay inside APT using the fallback", () => {
  for (const browser of [
    { length: 1, referrer: "https://apt.example/tenant/my-rental" },
    { referrer: "" },
    { referrer: "https://outside.example/" },
    { navigation: { currentEntry: { index: 0 }, entries: () => [{ url: "https://apt.example/tenant/pap" }] } },
    { navigation: { currentEntry: { index: 1 }, entries: () => [{ url: "https://outside.example/" }, { url: "https://apt.example/tenant/pap" }] } },
    { navigation: { currentEntry: { index: 1 }, entries: () => [{}, { url: "https://apt.example/tenant/pap" }] } },
  ]) {
    const h = backButton(browser);
    h.Back({ fallbackHref: "/tenant/my-rental" }).props.onPress();
    assert.deepEqual(h.calls, ["/tenant/my-rental"]);
  }
});

test("older browsers use a same-origin referrer and existing apartment callers keep their original back behavior", () => {
  const h = backButton({ referrer: "https://apt.example/landlord/dashboard" });
  h.Back({ fallbackHref: "/landlord/dashboard" }).props.onPress();
  assert.deepEqual(h.calls, ["back"]);
  const original = backButton({ length: 1 });
  original.Back().props.onPress();
  assert.deepEqual(original.calls, ["back"]);
});

test("Terms and Privacy choose a direct-visit fallback from their current portal, including public readers", () => {
  let pathname;
  const PolicyBack = compile("app/components/legal/PolicyBackButton.tsx", {
    "react/jsx-runtime": jsx,
    "next/navigation": { usePathname: () => pathname },
    "@/app/browse/[apartmentId]/components/BackBtn": { default: "BackBtn" },
  }).default;
  for (const [prefix, fallback] of [["", "/"], ["/tenant", "/tenant/my-rental"], ["/landlord", "/landlord/dashboard"], ["/admin", "/admin/dashboard"]]) {
    for (const policy of ["pap", "tos"]) {
      pathname = `${prefix}/${policy}`;
      assert.equal(PolicyBack().props.fallbackHref, fallback);
    }
  }
});

test("hero navigation and the Legal badge share a centered row, with Back on the left", () => {
  const Hero = compile("app/(main)/components/legal/LegalHero.tsx", {
    "react/jsx-runtime": jsx, "@heroui/react": { Chip: { Label: "Chip.Label" } },
    "@tabler/icons-react": {},
  }).default;
  const props = { eyebrow: "Legal", title: "Privacy", titleAccent: "Policy", description: "Policy", meta: { version: "1.1", lastUpdated: "November 6, 2026", jurisdiction: "Philippines" } };
  const all = nodes(Hero({ ...props, navigation: { type: "Back", props: {} } }));
  const row = all.find(node => node.props?.className === "flex items-center gap-3");
  assert.equal(row.props.children[0].type, "Back");
  assert.ok(nodes(row.props.children[1]).some(node => node.type === "Chip.Label"));
  assert.ok(all.findIndex(node => node.type === "Back") < all.findIndex(node => node.type === "Chip.Label"));
  assert.equal(nodes(Hero(props)).some(node => node.props?.className === "mb-4"), false);
});
