import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
import { rankTenantLovedApartments } from "./tenant-loved-apartments.ts";
import { preferredPortal } from "../../../packages/supabase/src/portal-preference.ts";

function load(file, overrides = {}, globals = {}) {
  const jsx = (type, props) => ({ type, props });
  const dependencies = {
    "react/jsx-runtime": { jsx, jsxs: jsx },
    "@heroui/react": { Button: "Button", buttonVariants: ({ className = "" }) => className, Skeleton: "Skeleton", Dropdown: Object.assign("Dropdown", { Popover: "Popover", Menu: "Menu", Item: "Item" }), Label: "Label" },
    "@tabler/icons-react": new Proxy({}, { get: (_, name) => name }),
    "next/link": { default: "Link" },
    "next/image": { default: "Image" },
    ...overrides,
  };
  const source = readFileSync(new URL(`../app/${file}`, import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const context = { exports: {}, console, require: name => dependencies[name] ?? { default: name.split("/").at(-1) }, ...globals };
  vm.runInNewContext(compiled, context);
  return context.exports.default;
}

function nodes(element) {
  if (!element || typeof element !== "object") return [];
  return [element, ...[element.props?.children].flat(Infinity).flatMap(nodes)];
}

function text(element) {
  if (typeof element === "string") return element;
  if (!element || typeof element !== "object") return "";
  return [element.props?.children].flat(Infinity).map(text).join("");
}

function homeHarness({ roles = [], signedIn = false } = {}) {
  const calls = [];
  const rows = [{ id: "listing-1", name: "A home", city: "Navotas", monthly_rent: 12500, average_rating: 4.5, no_ratings: 10, created_at: "2026-10-01", apartment_images: [{ url: "https://example.test/cover.webp", is_cover: true }] }];
  const client = {
    auth: { getUser: async () => ({ data: { user: signedIn ? { id: "auth-1" } : null } }) },
    from(table) {
      calls.push(["from", table]);
      const query = {};
      for (const method of ["select", "eq", "is", "limit", "order"]) {
        query[method] = (...args) => { calls.push([method, ...args]); return query; };
      }
      query.single = async () => ({ data: { roles } });
      query.then = resolve => resolve({ data: rows, error: null });
      return query;
    },
  };
  const Home = load("(main)/page.tsx", {
    "@repo/supabase/server": { createClient: async () => client },
    "next/headers": { cookies: async () => ({ get: () => ({ value: "landlord" }) }) },
    "next/navigation": { redirect: destination => { throw new Error(`redirect:${destination}`); } },
    "@/lib/portal-preference": { PORTAL_COOKIE: "portal", preferredPortal },
    "@/lib/tenant-loved-apartments": { rankTenantLovedApartments },
  });
  return { Home, calls };
}

test("landing keeps the verified, available, bounded query and real carousel data", async () => {
  const { Home, calls } = homeHarness();
  const tree = await Home();
  for (const expected of [["from", "apartments"], ["eq", "is_hidden_by_admin", false], ["is", "deleted_at", null], ["eq", "status", "available"], ["eq", "is_verified", true], ["limit", 100], ["order", "created_at", { ascending: false }]]) {
    assert(calls.some(call => JSON.stringify(call) === JSON.stringify(expected)));
  }
  const all = nodes(tree);
  const carousel = all.find(node => node.type === "ApartmentCarousel");
  assert.equal(carousel.props.apartment[0].id, "listing-1");
  assert.equal(carousel.props.apartment[0].price, 12500);
  assert.equal(carousel.props.apartment[0].rating, 4.5);
  assert.equal(carousel.props.apartment[0].image, "https://example.test/cover.webp");
  assert.deepEqual(all.filter(node => typeof node.type === "string" && /Section$/.test(node.type)).map(node => node.type), ["HeroSection", "ProductShowcaseSection", "RentalStepsSection", "OwnerCtaSection", "AppSection"]);
  assert(!all.some(node => "apkAvailable" in (node.props ?? {})));
});

for (const [roles, destination] of [
  [["admin", "landlord"], "/admin/dashboard"],
  [["landlord"], "/landlord/dashboard"],
  [["tenant"], "/tenant/my-rental"],
  [["tenant", "landlord"], "/landlord/dashboard"],
]) {
  test(`landing preserves the ${roles.join("/")} redirect`, async () => {
    const { Home, calls } = homeHarness({ signedIn: true, roles });
    await assert.rejects(Home(), { message: `redirect:${destination}` });
    assert(!calls.some(call => call[0] === "from" && call[1] === "apartments"));
  });
}

test("hero uses the original image, two desktop columns, and a single blue period", () => {
  const tree = load("(main)/components/HeroSection.tsx")();
  const all = nodes(tree);
  assert.match(tree.props.className, /lg:grid-cols-2/);
  assert.equal(text(all.find(node => node.type === "h1")), "Find your place.Feel at home.");
  assert.equal(text(all.find(node => node.type === "span")), ".");
  const image = all.find(node => node.type === "Image");
  assert.equal(image.props.src, "/landing/hero-living-room.png");
  assert.equal(image.props.width, 1824);
  assert.equal(image.props.height, 1704);
  assert.equal(image.props.preload, true);
  assert(!text(tree).includes("Download"));
});

test("marketing CTAs render single links to the existing destinations", () => {
  const browse = load("(main)/components/StartBrowsingBtn.tsx")();
  assert.equal(browse.type, "Link");
  assert.equal(browse.props.href, "/browse");
  assert.match(text(browse), /Explore apartments/);
  const owner = nodes(load("(main)/components/OwnerCtaSection.tsx")()).find(node => node.type === "Link");
  assert.equal(owner.props.href, "/forowners");
});

test("product rows reuse the approved originals without adding fake screenshots", () => {
  const Showcase = load("(main)/components/ProductShowcase.tsx");
  for (const reversed of [false, true]) {
    const tree = Showcase({ number: "01", label: "Discover", title: "Title", paragraphs: ["Body"], reversed });
    const images = nodes(tree).filter(node => node.type === "Image");
    assert.deepEqual(images.map(node => node.props.src), ["/landing/showcase-discover-web.png", "/landing/showcase-discover-phone.png"]);
    assert(images.every(node => node.props.alt.length > 20 && !node.props.preload));
    assert.match(tree.props.className, /lg:grid-cols-2/);
  }
});

test("renting steps are ordered and Android remains coming soon without a download action", () => {
  const steps = nodes(load("(main)/components/RentalStepsSection.tsx")());
  assert.equal(steps.filter(node => node.type === "ol").length, 1);
  assert.equal(steps.filter(node => node.type === "li").length, 3);
  assert.deepEqual(steps.filter(node => node.type === "h3").map(text), ["Discover", "Apply", "Settle in"]);
  const mobile = load("(main)/components/AppSection.tsx")();
  assert.match(text(mobile), /Android coming soon/);
  assert(!nodes(mobile).some(node => ["Button", "Link", "AppDownloadButton"].includes(node.type)));
  const preview = load("(main)/components/MobileAppPreview.tsx")();
  assert.match(preview.props["aria-label"], /Sample/);
  assert.match(text(preview), /Sample interface/);
});

function navbarHarness({ open = false, signedIn = false } = {}) {
  const pushes = [];
  const stateChanges = [];
  const effects = [];
  const Navbar = load("components/layout/AppNavbar.tsx", {
    react: { useState: () => [open, value => stateChanges.push(value)], useEffect: callback => effects.push(callback) },
    "@/hooks/use-hydrated": { useHydrated: () => true },
    "@/hooks/use-user": { useUser: () => ({ loading: false, user: signedIn ? { email: "demo@example.test" } : null, profile: signedIn ? { roles: ["tenant"] } : null }) },
    "next/navigation": { usePathname: () => "/about", useSearchParams: () => new URLSearchParams("existing=keep"), useRouter: () => ({ push: path => pushes.push(path) }) },
    "@/lib/portal-preference": { PORTAL_COOKIE: "portal", preferredPortal },
    "@/app/components/settings/SettingsOverlay": { SETTINGS_QUERY_VALUE: "open" },
    "@/service/signOutService": { signOut: () => pushes.push("signout") },
  }, { URLSearchParams, document: { cookie: "" } });
  return { tree: Navbar(), pushes, stateChanges, effects };
}

test("public navbar labels, destinations, theme and mobile menu stay available", () => {
  const { tree, stateChanges } = navbarHarness({ open: true });
  const all = nodes(tree);
  assert.equal(tree.type, "header");
  assert.deepEqual(all.filter(node => node.type === "Link" && ["Apartments", "For owners"].includes(text(node))).map(node => [text(node), node.props.href]), [
    ["Apartments", "/browse"], ["For owners", "/forowners"], ["Apartments", "/browse"], ["For owners", "/forowners"],
  ]);
  const signUp = all.filter(node => node.type === "Link" && text(node).includes("Get started"));
  assert.equal(signUp.length, 2);
  assert(signUp.every(node => node.props.href === "/sign-up"));
  assert.equal(all.filter(node => node.type === "ThemeToggle").length, 2);
  const toggle = all.find(node => node.props?.["aria-controls"] === "public-mobile-menu");
  assert.equal(toggle.props["aria-expanded"], true);
  assert(all.some(node => node.props?.id === "public-mobile-menu"));
  signUp[1].props.onClick();
  assert.deepEqual(stateChanges, [false]);
});

test("public navbar retains account actions and settings query parameters", () => {
  const { tree, pushes } = navbarHarness({ signedIn: true });
  const menu = nodes(tree).find(node => node.type === "Menu");
  menu.props.onAction("settings");
  menu.props.onAction("dashboard");
  menu.props.onAction("profile");
  menu.props.onAction("logout");
  assert.deepEqual(pushes, ["/about?existing=keep&settings=open", "/tenant/my-rental", "/tenant/profile", "signout"]);
});

test("loading matches the responsive hero and contains no interactive placeholders", () => {
  const tree = load("(main)/loading.tsx")();
  assert.equal(tree.props["aria-busy"], "true");
  const all = nodes(tree);
  assert(all.some(node => node.props?.className?.includes("lg:grid-cols-2")));
  assert(!all.some(node => ["Button", "Link", "button", "a"].includes(node.type)));
});
