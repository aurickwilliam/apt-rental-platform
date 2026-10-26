import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
import { rankTenantLovedApartments } from "./tenant-loved-apartments.ts";
import { preferredPortal } from "../../../packages/supabase/src/portal-preference.ts";

function loadModule(file, overrides = {}, globals = {}) {
  const jsx = (type, props) => ({ type, props });
  const dependencies = {
    "react/jsx-runtime": { jsx, jsxs: jsx },
    "@heroui/react": { Button: "Button", buttonVariants: ({ className = "" }) => className, Skeleton: "Skeleton", Card: Object.assign("Card", { Content: "CardContent" }), Dropdown: Object.assign("Dropdown", { Popover: "Popover", Menu: "Menu", Item: "Item" }), Label: "Label" },
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
  return context.exports;
}

function load(...args) {
  return loadModule(...args).default;
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
  const tree = load("(main)/components/HeroSection.tsx", { "react": { Suspense: "Suspense" }, "./AppDownloadAction": { default: "AppDownloadAction" } })();
  const all = nodes(tree);
  assert.match(tree.props.className, /lg:grid-cols-2/);
  assert.equal(text(all.find(node => node.type === "h1")), "Find your place.Feel at home.");
  assert.equal(text(all.find(node => node.type === "span")), ".");
  const image = all.find(node => node.type === "Image");
  assert.equal(image.props.src, "/landing/hero-living-room.png");
  assert.equal(image.props.width, 1824);
  assert.equal(image.props.height, 1704);
  assert.equal(image.props.preload, true);
  assert.match(text(tree), /Verified listings in Caloocan, Malabon, Navotas, and Valenzuela/);
  const boundary = all.find(node => node.type === "Suspense");
  assert.equal(boundary.props.children.type, "AppDownloadAction");
  assert.equal(boundary.props.children.props.variant, "outline");
  assert.equal(boundary.props.children.props.hideWhenUnavailable, true);
});

test("marketing CTAs use the shared HeroUI landing button with the existing destinations", () => {
  const browse = load("(main)/components/StartBrowsingBtn.tsx")();
  assert.equal(browse.type, "LandingCta");
  assert.equal(browse.props.href, "/browse");
  assert.match(text(browse), /Explore apartments/);
  const owner = nodes(load("(main)/components/OwnerCtaSection.tsx")()).find(node => node.type === "LandingCta");
  assert.equal(owner.props.href, "/forowners");
});

test("landing button is a HeroUI Button that navigates with the router or a full page load", () => {
  const pushed = [];
  const assigned = [];
  const LandingCta = load("(main)/components/LandingCta.tsx", { "next/navigation": { useRouter: () => ({ push: href => pushed.push(href) }) } }, { window: { location: { assign: href => assigned.push(href) } } });
  const internal = LandingCta({ href: "/browse", children: "Go" });
  assert.equal(internal.type, "Button");
  assert.equal(internal.props.variant, "primary");
  assert.match(internal.props.className, /landing-cta landing-responsive-cta/);
  internal.props.onPress();
  assert.deepEqual(pushed, ["/browse"]);
  const download = LandingCta({ href: "/download", variant: "outline", isExternalRedirect: true, children: "Get" });
  assert.equal(download.props.variant, "outline");
  download.props.onPress();
  assert.deepEqual(assigned, ["/download"]);
  assert.deepEqual(pushed, ["/browse"]);
});

test("product rows show one apartment photo each, on alternating sides", () => {
  const Showcase = load("(main)/components/ProductShowcase.tsx");
  for (const reversed of [false, true]) {
    const image = { src: "/landing/showcase-modern-apartments.jpg", alt: "Modern brick apartment building with balconies" };
    const tree = Showcase({ number: "01", label: "Discover", title: "Title", paragraphs: ["Body"], image, reversed });
    const images = nodes(tree).filter(node => node.type === "Image");
    assert.equal(images.length, 1);
    assert.equal(images[0].props.src, image.src);
    assert(images[0].props.alt.length > 20 && images[0].props.fill && !images[0].props.preload);
    assert.match(tree.props.className, /lg:grid-cols-2/);
  }
});

test("both showcase rows use different apartment photos", () => {
  const rows = nodes(load("(main)/components/ProductShowcaseSection.tsx", { "./ProductShowcase": { default: "ProductShowcase" } })()).filter(node => node.type === "ProductShowcase");
  assert.equal(rows.length, 2);
  assert.deepEqual(rows.map(row => row.props.image.src), ["/landing/showcase-modern-apartments.jpg", "/landing/showcase-townhouse-apartments.jpg"]);
});

test("renting steps are ordered", () => {
  const steps = nodes(load("(main)/components/RentalStepsSection.tsx")());
  assert.equal(steps.filter(node => node.type === "ol").length, 1);
  assert.equal(steps.filter(node => node.type === "li").length, 3);
  assert.deepEqual(steps.filter(node => node.type === "h3").map(text), ["Discover", "Apply", "Settle in"]);
});

test("APT Mobile streams the Android download action behind a skeleton", () => {
  const mobile = nodes(load("(main)/components/AppSection.tsx", { "react": { Suspense: "Suspense" }, "./AppDownloadAction": { default: "AppDownloadAction" } })());
  const boundary = mobile.find(node => node.type === "Suspense");
  assert.equal(boundary.props.fallback.type, "Skeleton");
  assert.equal(boundary.props.children.type, "AppDownloadAction");
});

test("download button links to the permalink only when an APK is published", () => {
  const Button = load("(main)/components/AppDownloadButton.tsx");
  const available = Button({ isAvailable: true });
  assert.equal(available.type, "LandingCta");
  assert.equal(available.props.href, "/download");
  assert.equal(available.props.isExternalRedirect, true);
  assert.match(text(available), /Download for Android/);
  const unavailable = Button({ isAvailable: false });
  assert.match(text(unavailable), /Android coming soon/);
  assert(!nodes(unavailable).some(node => node.type === "LandingCta"));
  assert.equal(Button({ isAvailable: false, hideWhenUnavailable: true }), null);
});

function apkClient(result) {
  const calls = [];
  const query = {};
  for (const method of ["select", "eq"]) query[method] = (...args) => { calls.push([method, ...args]); return query; };
  query.maybeSingle = async () => result;
  return { calls, client: { from: table => { calls.push(["from", table]); return query; } } };
}

test("the published APK link is read for android and only https links count", async () => {
  const { fetchAndroidApkUrl } = loadModule("../lib/android-apk-url.ts", {
    "@repo/utils": { APP_RELEASE_PLATFORM: "android", isSecureDownloadUrl: value => value.startsWith("https://") },
  });
  const published = apkClient({ data: { apk_url: " https://github.com/o/r/releases/latest/download/apt.apk " }, error: null });
  assert.equal(await fetchAndroidApkUrl(published.client), "https://github.com/o/r/releases/latest/download/apt.apk");
  assert(published.calls.some(call => JSON.stringify(call) === JSON.stringify(["eq", "platform", "android"])));
  assert.equal(await fetchAndroidApkUrl(apkClient({ data: { apk_url: "http://example.com/apt.apk" }, error: null }).client), null);
  assert.equal(await fetchAndroidApkUrl(apkClient({ data: null, error: null }).client), null);
  assert.equal(await fetchAndroidApkUrl(apkClient({ data: null, error: new Error("boom") }).client), null);
});

test("APT Mobile shows the real My Rental screen as a large phone image", () => {
  const image = nodes(load("(main)/components/AppSection.tsx", { "react": { Suspense: "Suspense" }, "./AppDownloadAction": { default: "AppDownloadAction" } })()).find(node => node.type === "Image");
  assert.equal(image.props.src, "/landing/app-mobile-my-rental.png");
  assert.equal(image.props.width, 990);
  assert.equal(image.props.height, 1165);
  assert(image.props.alt.length > 20 && !image.props.preload);
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
  assert.deepEqual(all.filter(node => node.type === "Link" && ["Browse Apartments", "For owners"].includes(text(node))).map(node => [text(node), node.props.href]), [
    ["Browse Apartments", "/browse"], ["For owners", "/forowners"], ["Browse Apartments", "/browse"], ["For owners", "/forowners"],
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
