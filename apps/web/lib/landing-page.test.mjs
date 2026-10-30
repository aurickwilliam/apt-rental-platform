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
    "@heroui/react": { Accordion: "Accordion", AccordionBody: "AccordionBody", AccordionHeading: "AccordionHeading", AccordionIndicator: "AccordionIndicator", AccordionItem: "AccordionItem", AccordionPanel: "AccordionPanel", AccordionTrigger: "AccordionTrigger", Button: "Button", buttonVariants: ({ className = "" }) => className, Skeleton: "Skeleton", Card: Object.assign("Card", { Content: "CardContent" }), Dropdown: Object.assign("Dropdown", { Popover: "Popover", Menu: "Menu", Item: "Item" }), Label: "Label" },
    "@tabler/icons-react": new Proxy({}, { get: (_, name) => name }),
    "next/link": { default: "Link" },
    "next/image": { default: "Image" },
    "./mobile-demo/demo-fonts": { demoInter: { variable: "demo-inter" }, demoNunito: { variable: "demo-nunito" } },
    "./mobile-demo/LandingMobileDemo": { default: "LandingMobileDemo" },
    "./landing-design.module.css": { default: new Proxy({}, { get: (_, name) => name }) },
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

function homeHarness({ roles = [], signedIn = false, empty = false, error = null } = {}) {
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
      query.then = resolve => resolve({ data: empty ? [] : rows, error });
      return query;
    },
  };
  const Home = load("(landing)/page.tsx", {
    react: { Suspense: "Suspense" },
    "@repo/supabase/server": { createClient: async () => client },
    "next/headers": { cookies: async () => ({ get: () => ({ value: "landlord" }) }) },
    "next/navigation": { redirect: destination => { throw new Error(`redirect:${destination}`); } },
    "@/lib/portal-preference": { PORTAL_COOKIE: "portal", preferredPortal },
    "@/lib/tenant-loved-apartments": { rankTenantLovedApartments },
  });
  const Featured = load("(main)/components/FeaturedApartments.tsx", {
    "@/lib/tenant-loved-apartments": { rankTenantLovedApartments },
  }, { console: { error: () => {} } });
  return { Home, Featured, calls };
}

test("landing keeps the verified, available, bounded query and real carousel data", async () => {
  const { Home, Featured, calls } = homeHarness();
  const tree = await Home();
  const all = nodes(tree);
  assert(!calls.some(call => call[0] === "from" && call[1] === "apartments"), "listings must not block the marketing shell");
  const region = all.find(node => node.type === "FeaturedApartments");
  const carousel = await Featured(region.props);
  for (const expected of [["from", "apartments"], ["eq", "is_hidden_by_admin", false], ["is", "deleted_at", null], ["eq", "status", "available"], ["eq", "is_verified", true], ["limit", 100], ["order", "created_at", { ascending: false }]]) {
    assert(calls.some(call => JSON.stringify(call) === JSON.stringify(expected)));
  }
  assert.equal(carousel.type, "ApartmentCarousel");
  assert.equal(carousel.props.apartment[0].id, "listing-1");
  assert.equal(carousel.props.apartment[0].price, 12500);
  assert.equal(carousel.props.apartment[0].rating, 4.5);
  assert.equal(carousel.props.apartment[0].image, "https://example.test/cover.webp");
  assert.deepEqual(all.filter(node => typeof node.type === "string" && /Section$/.test(node.type)).map(node => node.type), ["HeroSection", "ProductShowcaseSection", "RentalStepsSection", "OwnerCtaSection", "AppSection", "TeamSection", "FaqSection", "ContactSection"]);
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
  assert.equal(image.props.sizes, "(min-width: 1280px) 592px, (min-width: 1024px) calc(50vw - 48px), calc(100vw - 48px)");
  const reveals = all.filter(node => node.type === "LandingReveal");
  assert.equal(reveals.find(node => node.props.name === "hero-headline").props.duration, 0.6);
  assert.equal(reveals.find(node => node.props.name === "hero-image").props.duration, 0.72);
  assert.equal(reveals.find(node => node.props.name === "hero-actions").props.delay, 0.16);
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

test("product chapters retain one real composition each, with paired discovery and management layouts", () => {
  const Showcase = load("(main)/components/ProductShowcase.tsx");
  for (const reversed of [false, true]) {
    const image = { src: "/landing/showcase-discover-details.png", alt: "APT apartment browsing and property details composition" };
    const tree = Showcase({ number: "01", label: "Discover", title: "Title", paragraphs: ["Body"], image, reversed });
    const images = nodes(tree).filter(node => node.type === "Image");
    assert.equal(images.length, 1);
    assert.equal(images[0].props.src, image.src);
    assert(images[0].props.alt.length > 20 && images[0].props.fill && !images[0].props.preload);
    assert.equal(images[0].props.loading, "lazy");
    assert.match(images[0].props.className, /object-contain/);
    assert.doesNotMatch(images[0].props.className, /object-cover|scale-|rotate-|bg-/);
    assert.equal(tree.type, "article");
    assert.equal(tree.props.className, reversed ? "manageChapter" : "discoverChapter");
    assert.equal(tree.props["data-product-chapter"], reversed ? "manage" : "discover");
    const panel = nodes(tree).find(node => node.props?.className?.includes("aspect-[10/9]"));
    assert.match(panel.props.className, /bg-muted\/40/);
    assert(nodes(tree).some(node => node.props?.className === (reversed ? "manageMedia" : "discoverMedia")));
  }
});

test("product showcases use scoped artwork while preserving their copy and alternating layout", () => {
  const rows = nodes(load("(main)/components/ProductShowcaseSection.tsx", { "./ProductShowcase": { default: "ProductShowcase" } })()).filter(node => node.type === "ProductShowcase");
  assert.equal(rows.length, 2);
  assert.equal(rows[0].props.media.type, "DiscoverShowcase");
  assert.equal(rows[1].props.media.type, "LiveManageShowcase");
  assert.deepEqual(rows.map(row => row.props.title), ["Find a place that fits.", "Stay connected. Stay in control."]);
  assert.deepEqual(rows.map(row => row.props.reversed ?? false), [false, true]);
  assert.equal(rows[0].props.paragraphs.length, 1);
  assert.equal(rows[0].props.paragraphs[0], "Explore available apartments, review property details, and submit your rental application in one place.");
  assert.equal(rows[0].props.image, undefined);
  assert.equal(rows[1].props.image, undefined);
  assert.equal(rows[1].props.paragraphs.length, 2);
});

test("Discover image padding can be reduced without changing the other showcase's presentation", () => {
  const Showcase = load("(main)/components/ProductShowcase.tsx");
  const props = { number: "01", label: "Discover", title: "Title", paragraphs: ["Body"] };
  const discover = nodes(Showcase({ ...props, image: { src: "/landing/showcase-discover-details.png", alt: "APT browsing and details", className: "object-contain p-2" } }));
  const manage = nodes(Showcase({ ...props, image: { src: "/landing/showcase-live-manage-dual-phone.png", alt: "APT rental dashboard" }, reversed: true }));
  assert.equal(discover.find(node => node.type === "Image").props.className, "object-contain p-2");
  assert.equal(manage.find(node => node.type === "Image").props.className, "object-contain p-4 sm:p-6");
  assert.equal(discover.filter(node => node.type === "Image").length, 1);
  assert.equal(manage.filter(node => node.type === "Image").length, 1);
});

test("thriving introduction enters over 1400ms while showcase copy and rental heading retain 700ms", () => {
  const section = nodes(load("(main)/components/ProductShowcaseSection.tsx")());
  const introduction = section.find(node => node.props?.name === "thriving-heading");
  assert.equal(introduction.props.duration, 1.4);
  assert.equal(introduction.props.delay ?? 0, 0);
  const Showcase = load("(main)/components/ProductShowcase.tsx");
  for (const number of ["01", "02"]) {
    const reveals = nodes(Showcase({ number, label: "Label", title: "Title", paragraphs: ["First", "Second"], image: { src: "/test.png", alt: "Test" } }))
      .filter(node => node.type === "LandingReveal");
    assert(reveals.filter(node => node.props.name !== `${number}-image`).every(node => node.props.duration === 0.7));
    assert.equal(reveals.find(node => node.props.name === `${number}-title`).props.delay, 0.07);
  }
  const journey = nodes(load("(main)/components/RentalStepsSection.tsx")());
  assert.equal(journey.find(node => node.props?.name === "rental-heading").props.duration, 0.7);
});

test("How It Works orders Discover, Apply, Move in, and Manage around one blue process card", () => {
  const tree = load("(main)/components/RentalStepsSection.tsx")();
  const steps = nodes(tree);
  assert.equal(tree.props.id, "how-it-works");
  assert.equal(steps.filter(node => node.type === "ol").length, 1);
  assert.equal(steps.filter(node => node.type === "li").length, 4);
  assert.deepEqual(steps.filter(node => node.type === "h3").map(text), ["Discover", "Apply", "Move in", "Manage"]);
  const process = steps.find(node => node.type === "ol");
  assert.equal(process.props.role, "list");
  assert.equal(process.props.className, "processCard");
  assert.deepEqual(steps.filter(node => node.props?.className === "processMarker").map(text), ["01", "02", "03", "04"]);
  assert.equal(steps.filter(node => typeof node.type === "function" && node.type.name === "JourneyConnector").length, 2);

  const phone = steps.filter(node => node.type === "Image" && node.props.src === "/landing/app-mobile-my-rental.png");
  assert.equal(phone.length, 1);
  assert.deepEqual([phone[0].props.width, phone[0].props.height], [990, 1165]);
  assert.equal(phone[0].props.className, "phoneImage");

  const map = steps.find(node => node.type === "Image" && node.props.src === "/landing/showcase-browse-layer.png");
  assert.equal(map.props.fill, true);
  assert.match(map.props.alt, /map/i);
  assert.equal(map.props.loading, "lazy");
  assert.equal(map.props.sizes, "(min-width: 1280px) 307px, (min-width: 1024px) 24vw, (min-width: 640px) calc(100vw - 124px), calc(100vw - 108px)");
  assert.doesNotMatch(text(process), /without leaving APT/);
  assert.match(text(process), /Track rent, message your landlord/);

  const reveals = steps.filter(node => node.props?.name?.startsWith("rental-"));
  assert.deepEqual(reveals.map(node => [node.props.name, node.props.delay ?? 0, node.props.duration]), [
    ["rental-heading", 0, 0.7],
    ["rental-discovery", 0.08, 0.6],
    ["rental-process", 0.14, 0.6],
    ["rental-preview", 0.2, 0.6],
  ]);
});

test("Our Team renders the four real members with circular portraits and approved links", () => {
  const teamMembers = [
    { name: "Aurick William Lorenzo", role: "Lead Developer", image: "/images/orik.jpg", github: "https://github.com/aurickwilliam", linkedin: "https://www.linkedin.com/in/aurick-william-lorenzo-ba83a73a6/?skipRedirect=true" },
    { name: "Mhart Aaron Navales", role: "Full Stack Yearner", image: "/images/ron.jpg", github: "https://github.com/Kaironnnn", linkedin: null },
    { name: "Michael Jann Mateo", role: "Project Manager", image: "/images/mija.jpg", github: "https://github.com/YuriPatriotic", linkedin: null },
    { name: "Charle Fulgencio", role: "Project Coordinator", image: "/images/charle.jpg", github: "https://github.com/KhromaUnus", linkedin: null },
  ];
  const tree = load("(main)/components/TeamSection.tsx", { "../about/data/AboutData": { teamMembers } })();
  const all = nodes(tree);
  assert.equal(tree.props.id, "team");
  assert.equal(all.filter(node => node.type === "article").length, 4);
  assert.deepEqual(all.filter(node => node.type === "h3").map(text), teamMembers.map(member => member.name));
  assert.deepEqual(all.filter(node => node.props?.className === "teamRole").map(text), teamMembers.map(member => member.role));
  assert.deepEqual(all.filter(node => node.type === "Image").map(node => node.props.src), teamMembers.map(member => member.image));
  assert(all.filter(node => node.type === "Image").every(node => node.props.fill === true));
  assert.equal(
    all.filter(node => {
      if (node.type !== "a") return false;
      try {
        const href = new URL(node.props.href);
        return href.protocol === "https:" && href.hostname === "github.com";
      } catch {
        return false;
      }
    }).length,
    4,
  );
  assert.equal(all.filter(node => node.type === "a" && node.props.href.includes("linkedin.com")).length, 1);
  assert(all.filter(node => node.type === "a").every(node => node.props.target === "_blank" && node.props.rel === "noopener noreferrer"));

  const source = readFileSync(new URL("../app/(main)/components/TeamSection.tsx", import.meta.url), "utf8");
  const data = readFileSync(new URL("../app/(main)/about/data/AboutData.ts", import.meta.url), "utf8");
  assert.doesNotMatch(source, /member\.bio/);
  assert.match(source, /from "\.\.\/about\/data\/AboutData"/);
  for (const member of teamMembers) assert(data.includes(member.name), `${member.name} must come from AboutData`);
  assert(data.includes("Full Stack Yearner"));
});

test("FAQs render six questions in two balanced HeroUI accordion columns", () => {
  const tree = load("(main)/components/FaqSection.tsx")();
  const all = nodes(tree);
  assert.equal(tree.props.id, "faqs");
  const accordions = all.filter(node => node.type === "Accordion");
  assert.equal(accordions.length, 2);
  for (const accordion of accordions) {
    assert.equal(nodes(accordion).filter(node => node.type === "AccordionItem").length, 3);
  }
  assert.deepEqual(all.filter(node => node.type === "AccordionTrigger").map(text), [
    "How do I pay my rent?",
    "How do I submit a maintenance request?",
    "How do I review my lease agreement?",
    "How do I contact my landlord?",
    "How do I list my property?",
    "How do I verify my account?",
  ]);
  assert.equal(all.filter(node => node.type === "AccordionIndicator").length, 6);
  const answers = all.filter(node => node.type === "AccordionBody").map(text);
  assert.equal(answers.length, 6);
  assert(answers.every(answer => answer.length > 60));
  const source = readFileSync(new URL("../app/(main)/components/FaqSection.tsx", import.meta.url), "utf8");
  assert.match(source, /AccordionHeading/);
  assert.doesNotMatch(source, /support@apt-rental\.ph|24\/7|guarantee|refund/i);
});

test("Contact uses only the verified office address, Facebook page, and the FAQ link", () => {
  const tree = load("(main)/components/ContactSection.tsx")();
  const all = nodes(tree);
  assert.equal(tree.props.id, "contact");
  assert.equal(all.filter(node => node.type === "article").length, 3);
  assert.deepEqual(all.filter(node => node.type === "h3").map(text), ["Office", "Facebook", "Quick answers"]);
  assert.match(text(tree), /109 Samson Road corner Caimito Road, Caloocan, Philippines/);
  assert(all.some(node => node.type === "a" && node.props.href === "https://www.facebook.com/profile.php?id=61583486606822"));
  assert(all.some(node => node.type === "a" && node.props.href === "#faqs"));
  assert(!all.some(node => /^(?:mailto|tel):/.test(node.props?.href ?? "")));
  const source = readFileSync(new URL("../app/(main)/components/ContactSection.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(source, /support@apt-rental\.ph|Monday|9:00 AM|contact form/i);
});

test("the shared footer points FAQ and Contact at the landing sections instead of dead routes", () => {
  const footer = readFileSync(new URL("../app/components/layout/Footer.tsx", import.meta.url), "utf8");
  assert.equal((footer.match(/href="\/#faqs"/g) ?? []).length, 2);
  assert.equal((footer.match(/href="\/#contact"/g) ?? []).length, 2);
  assert.doesNotMatch(footer, /href="\/faq"/);
  assert.doesNotMatch(footer, /href="\/contact"/);
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

test("APT Mobile embeds the shared walkthrough while preserving its copy, surface and download action", () => {
  const tree = load("(main)/components/AppSection.tsx", { "react": { Suspense: "Suspense" }, "./AppDownloadAction": { default: "AppDownloadAction" } })();
  const all = nodes(tree);
  assert.equal(tree.props.className, "mb-16 grid overflow-hidden rounded-2xl bg-secondary sm:mb-24 md:grid-cols-[1fr_auto]");
  assert.equal(tree.props.children[0].props.className, "p-6 sm:p-10 md:self-center md:py-14 lg:pl-14");
  assert.match(text(tree), /APT Mobile/);
  assert.match(text(tree), /A simpler way to stay connected\./);
  assert.match(text(tree), /Your rental conversations, records, and important updates can stay within reach while you are on the go\./);
  assert.equal(all.filter(node => node.type === "LandingMobileDemo").length, 1);
  assert.equal(all.find(node => node.type === "LandingMobileDemo").props.fontClassName, "demo-inter demo-nunito");
  assert.equal(all.filter(node => node.type === "AppDownloadAction").length, 1);
  assert(!all.some(node => node.type === "Image"));
  const original = readFileSync(new URL("../public/landing/app-mobile-my-rental.png", import.meta.url));
  assert.equal(original.toString("ascii", 1, 4), "PNG", "retain the original asset for reference");
});

test("FAQ answers distinguish test checkout, apartment-related messages, and verification approval", () => {
  const answers = nodes(load("(main)/components/FaqSection.tsx")())
    .filter(node => node.type === "AccordionBody").map(text);
  assert.match(answers[0], /Online checkout currently runs in test mode and does not process real money/);
  assert.match(answers[0], /Cash payments stay pending until the property owner confirms them/);
  assert.match(answers[3], /Apartment-related conversations/);
  assert.doesNotMatch(answers[3], /Each conversation stays tied/);
  assert.match(answers[5], /if approved, your verified status appears/);
  assert.doesNotMatch(answers[5], /once reviewed/);
});

test("FAQ keyboard focus outlines the clipping row instead of changing global focus tokens", () => {
  const css = readFileSync(new URL("../app/(main)/components/landing-design.module.css", import.meta.url), "utf8");
  assert.match(css, /\.faqRow\s*\{[^}]*overflow: hidden/);
  assert.match(css, /\.faqRow:has\(\.faqTrigger:focus-visible\),\s*\.faqRow:has\(\.faqTrigger\[data-focus-visible="true"\]\)\s*\{\s*outline: 2px solid var\(--primary\);\s*outline-offset: 3px;/);
  assert.doesNotMatch(css, /--(?:focus|heroui-focus)\s*:/);
});

function navbarHarness({ open = false, signedIn = false, pathname = "/about", menuToggle = null, globals = {} } = {}) {
  const pushes = [];
  const stateChanges = [];
  const effects = [];
  const Navbar = load("components/layout/AppNavbar.tsx", {
    react: { useState: () => [open, value => stateChanges.push(value)], useEffect: callback => effects.push(callback), useRef: () => ({ current: menuToggle }) },
    "@/hooks/use-hydrated": { useHydrated: () => true },
    "@/hooks/use-user": { useUser: () => ({ loading: false, user: signedIn ? { email: "demo@example.test" } : null, profile: signedIn ? { roles: ["tenant"] } : null }) },
    "next/navigation": { usePathname: () => pathname, useSearchParams: () => new URLSearchParams("existing=keep"), useRouter: () => ({ push: path => pushes.push(path) }) },
    "@/lib/portal-preference": { PORTAL_COOKIE: "portal", preferredPortal },
    "@/app/components/settings/SettingsOverlay": { SETTINGS_QUERY_VALUE: "open" },
    "@/service/signOutService": { signOut: () => pushes.push("signout") },
  }, { URLSearchParams, document: { cookie: "" }, ...globals });
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

test("landing navbar adds the four section links and keeps the compact menu until the wide layout", () => {
  const { tree } = navbarHarness({ open: true, pathname: "/" });
  const all = nodes(tree);
  assert.deepEqual(all.filter(node => node.type === "a").map(node => [text(node), node.props.href]), [
    ["How it works", "#how-it-works"],
    ["Team", "#team"],
    ["FAQs", "#faqs"],
    ["Contact", "#contact"],
    ["How it works", "#how-it-works"],
    ["Team", "#team"],
    ["FAQs", "#faqs"],
    ["Contact", "#contact"],
  ]);

  const toggle = all.find(node => node.props?.["aria-controls"] === "public-mobile-menu");
  assert.match(toggle.props.className, /landing-menu-toggle/);
  const menu = all.find(node => node.props?.id === "public-mobile-menu");
  assert.match(menu.props.className, /xl:hidden/);
  assert.match(menu.props.className, /landing-mobile-menu/);
  const nav = all.find(node => node.type === "nav" && node.props["aria-label"] === "Main navigation");
  assert.match(nav.props.className, /xl:flex/);
  assert.match(nav.props.className, /gap-4/);
});

test("unrelated public pages keep the original navbar without landing section links", () => {
  const { tree } = navbarHarness({ open: true, pathname: "/forowners" });
  const all = nodes(tree);
  assert.equal(all.filter(node => node.type === "a").length, 0);
  const toggle = all.find(node => node.props?.["aria-controls"] === "public-mobile-menu");
  assert.doesNotMatch(toggle.props.className, /landing-menu-toggle/);
  const menu = all.find(node => node.props?.id === "public-mobile-menu");
  assert.match(menu.props.className, /md:hidden/);
  assert.doesNotMatch(menu.props.className, /landing-mobile-menu/);
  assert.equal(menu.props.onKeyDown, undefined);
  const nav = all.find(node => node.type === "nav" && node.props["aria-label"] === "Main navigation");
  assert.match(nav.props.className, /md:flex/);
});

test("loading matches the responsive hero and contains no interactive placeholders", () => {
  const tree = load("(main)/loading.tsx")();
  assert.equal(tree.props["aria-busy"], "true");
  const all = nodes(tree);
  assert(all.some(node => node.props?.className?.includes("lg:grid-cols-2")));
  assert(!all.some(node => ["Button", "Link", "button", "a"].includes(node.type)));
});

for (const [pathname, breakpoint] of [["/", 1280], ["/forowners", 768]]) {
  test(`navbar ${pathname} retires its compact menu at ${breakpoint}px and removes its listener`, () => {
    const listeners = new Map();
    const queries = [];
    const media = {
      addEventListener: (name, listener) => listeners.set(name, listener),
      removeEventListener: (name, listener) => {
        assert.equal(listeners.get(name), listener);
        listeners.delete(name);
      },
    };
    const { effects, stateChanges } = navbarHarness({
      pathname, open: true,
      globals: { window: { matchMedia: query => { queries.push(query); return media; } } },
    });
    const cleanup = effects[0]();
    assert.deepEqual(queries, [`(min-width: ${breakpoint}px)`]);
    listeners.get("change")({ matches: false });
    assert.deepEqual(stateChanges, []);
    listeners.get("change")({ matches: true });
    listeners.get("change")({ matches: false });
    assert.deepEqual(stateChanges, [false], "returning below desktop never reopens the menu");
    cleanup();
    assert.equal(listeners.size, 0);
  });
}

test("landing Escape closes the menu and returns focus to its existing toggle", () => {
  let focusCount = 0;
  const events = [];
  const { tree, stateChanges } = navbarHarness({ pathname: "/", open: true, menuToggle: { focus: () => focusCount++ } });
  const menu = nodes(tree).find(node => node.props?.id === "public-mobile-menu");
  menu.props.onKeyDown({ key: "Tab" });
  assert.deepEqual(stateChanges, []);
  menu.props.onKeyDown({ key: "Escape", preventDefault: () => events.push("prevent"), stopPropagation: () => events.push("stop") });
  assert.deepEqual(stateChanges, [false]);
  assert.equal(focusCount, 1);
  assert.deepEqual(events, ["prevent", "stop"]);
});

test("landing anchors still close the menu before measuring and scrolling the section", () => {
  const scheduled = [];
  const calls = [];
  const { tree, stateChanges } = navbarHarness({
    pathname: "/", open: true,
    globals: {
      window: { history: { replaceState: (...args) => calls.push(args) }, setTimeout: callback => scheduled.push(callback) },
      document: { getElementById: id => {
        assert.deepEqual(stateChanges, [false]);
        assert.equal(id, "team");
        return { scrollIntoView: options => calls.push(options) };
      } },
    },
  });
  const menu = nodes(tree).find(node => node.props?.id === "public-mobile-menu");
  const team = nodes(menu).find(node => node.props?.href === "#team");
  team.props.onClick({ preventDefault: () => calls.push("prevent") });
  assert.deepEqual(stateChanges, [false]);
  assert.equal(scheduled.length, 1);
  scheduled[0]();
  assert.equal(JSON.stringify(calls), JSON.stringify(["prevent", [null, "", "#team"], { block: "start" }]));
});

test("only the landing menu gets a dynamic viewport cap and non-shrinking scrollable controls", () => {
  const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(css, /\.public-navbar \.landing-mobile-menu\s*\{\s*max-height: calc\(100dvh - 5rem - 1px\);\s*overflow-y: auto;\s*overscroll-behavior-y: contain;/);
  assert.match(css, /\.public-navbar \.landing-mobile-menu > \*\s*\{\s*flex-shrink: 0;/);
});

for (const [options, state] of [[{ empty: true }, "empty"], [{ error: new Error("query failed") }, "error"]]) {
  test(`featured apartments expose a genuine ${state} state without fabricated cards`, async () => {
    const { Home, Featured } = homeHarness(options);
    const region = nodes(await Home()).find(node => node.type === "FeaturedApartments");
    const result = await Featured(region.props);
    assert.equal(result.type, "FeaturedApartmentsState");
    assert.equal(result.props.state, state);
  });
}

test("hero keeps its approved content and coordinates short, low-distance entrances", () => {
  const Hero = load("(main)/components/HeroSection.tsx", { react: { Suspense: "Suspense" } });
  const all = nodes(Hero());
  const reveals = all.filter(node => node.props?.name?.startsWith("hero-"));
  assert.deepEqual(reveals.map(({ props }) => [props.name, props.delay ?? 0, props.duration, props.distance, props.scaleFrom ?? 1]), [
    ["hero-headline", 0, 0.6, 16, 1],
    ["hero-description", 0.08, 0.6, 16, 1],
    ["hero-actions", 0.16, 0.6, 12, 1],
    ["hero-trust", 0.2, 0.6, 12, 1],
    ["hero-image", 0.24, 0.72, 0, 0.985],
  ]);
  assert(reveals.every(({ props }) => (props.delay ?? 0) + props.duration <= 1));
  assert.equal(text(all.find(node => node.type === "h1")), "Find your place.Feel at home.");
  assert.match(text(all.find(node => node.props?.name === "hero-description")), /Discover apartments, connect with property owners, and manage your rental journey in one place\./);
  assert.equal(all.filter(node => node.type === "StartBrowsingBtn").length, 1);
  assert.equal(all.filter(node => node.type === "AppDownloadAction").length, 1);
  const image = all.find(node => node.type === "Image");
  assert.equal(image.props.src, "/landing/hero-living-room.png");
  assert.equal(image.props.preload, true);
  assert.deepEqual([image.props.width, image.props.height], [1824, 1704]);
});

test("landing typography uses the loaded Nunito Bold and stays local without changing motion", () => {
  const css = readFileSync(new URL("../app/(main)/components/landing-design.module.css", import.meta.url), "utf8");
  const root = readFileSync(new URL("../app/layout.tsx", import.meta.url), "utf8");
  assert.match(root, /weight: \["400", "500", "600", "700"\]/);
  assert.match(css, /font-weight: 700;/);
  assert.match(css, /font-synthesis: none;/);
  assert.doesNotMatch(css, /font-weight: (800|900);|@font-face|@import/);
  assert.doesNotMatch(css, /(?:animation|transition|transform|opacity)\s*:/);
  assert.match(css, /\.heroTitle\s*\{[^}]*font-size: clamp\(2\.625rem,[^}]*4\.5rem\)/);
  assert.match(css, /\.showcaseTitle\s*\{[^}]*max-width: 14ch;/);
  assert.match(css, /\.stepsPanel\s*\{[^}]*border-radius: 28px/);
  assert.match(css, /\.journeyBoard\s*\{[^}]*display: grid/);
  assert.match(css, /grid-template-columns: minmax\(0, 0\.92fr\) 40px minmax\(0, 1\.16fr\) 40px minmax\(0, 0\.82fr\)/);
  assert.match(css, /\.processCard\s*\{[^}]*list-style: none/);
  assert.match(css, /\.processStep:not\(:last-child\)::after/);
  assert.match(css, /\.faqGrid\s*\{[^}]*display: grid/);
  assert.match(css, /\.faqGrid\s*\{[^}]*grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(css, /\.teamGrid\s*\{[^}]*grid-template-columns: repeat\(4, minmax\(0, 1fr\)\)/);
  assert.match(css, /\.contactCards\s*\{[^}]*grid-template-columns: repeat\(3, minmax\(0, 1fr\)\)/);
  assert.match(css, /\.discoverChapter\s*\{[^}]*width: 100%;[^}]*gap: 32px/);
  assert.match(css, /\.discoverChapter\s*\{[^}]*grid-template-columns: 1\.12fr 0\.88fr/);
  assert.match(css, /\.discoverChapter \.showcaseCopy\s*\{[^}]*grid-column: 2/);
  assert.match(css, /\.discoverMedia\s*\{[^}]*grid-column: 1/);
  assert.match(css, /\.manageChapter\s*\{[^}]*display: grid/);
  assert.doesNotMatch(css, /\.manageChapter\s*\{[^}]*(?:background|padding|border-radius):/);
  assert.doesNotMatch(css, /\.manageMedia::before/);
  assert.match(css, /\.connectorLine\s*\{[^}]*width: 1px/);
  assert.match(css, /\.owner \.ownerCard\s*\{[^}]*background: var\(--secondary\)/);
  const hero = nodes(load("(main)/components/HeroSection.tsx", { react: { Suspense: "Suspense" } })());
  assert.match(hero.find(node => node.type === "h1").props.className, /heroTitle/);
  const products = nodes(load("(main)/components/ProductShowcase.tsx")({ number: "01", label: "Discover", title: "Title", paragraphs: ["Body"] }));
  assert.match(products.find(node => node.type === "h3").props.className, /showcaseTitle/);
  assert.match(products.find(node => node.type === "p").props.className, /eyebrow/);
});

test("featured loading and loaded headings share the same marketing typography", () => {
  const state = nodes(load("(main)/components/FeaturedApartmentsState.tsx")({ state: "loading" }));
  const carousel = readFileSync(new URL("../app/(main)/components/ApartmentCarousel.tsx", import.meta.url), "utf8");
  assert.match(state.find(node => node.type === "h2").props.className, /listingTitle/);
  assert.match(carousel, /design\.listingTitle/);
  assert.match(carousel, /design\.featuredHeader/);
});

test("only listings suspend; the root route reuses public chrome without the shared page skeleton", async () => {
  const tree = await homeHarness().Home();
  const region = nodes(tree).find(node => node.type === "Suspense");
  assert.equal(region.props.fallback.type, "FeaturedApartmentsState");
  assert.equal(region.props.fallback.props.state, "loading");
  assert.equal(region.props.children.type, "FeaturedApartments");
  const layout = readFileSync(new URL("../app/(landing)/layout.tsx", import.meta.url), "utf8");
  assert.match(layout, /import AppNavbar from "\.\.\/components\/layout\/AppNavbar"/);
  assert.match(layout, /box-content h-20 border-b border-transparent/);
  assert.match(layout, /<Footer \/>/);
  assert.match(layout, /<SettingsOverlay \/>/);
  const rootPage = readFileSync(new URL("../app/(landing)/page.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(rootPage, /Skeleton|aria-busy|setTimeout/);
});

test("loading placeholders are confined to real listing requests and reserve the card layout", () => {
  const State = load("(main)/components/FeaturedApartmentsState.tsx");
  const pending = State({ state: "loading" });
  assert.equal(pending.props["aria-busy"], true);
  assert.match(text(pending), /Loading featured apartments/);
  assert(nodes(pending).some(node => node.type === "Skeleton"));
  assert(!nodes(pending).some(node => node.type === "ApartmentCarousel" || node.type === "Image"));
  for (const state of ["error", "empty"]) {
    const settled = State({ state });
    assert.equal(settled.props["aria-busy"], false);
    assert(!nodes(settled).some(node => node.type === "Skeleton"));
    assert(nodes(settled).some(node => node.props?.role === (state === "error" ? "alert" : "status")));
  }
});
