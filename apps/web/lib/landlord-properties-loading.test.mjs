import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
import { translate } from "../../../packages/i18n/src/translate.ts";

const locale = {
  useTranslation: () => ({
    language: "en",
    pending: false,
    setLanguage: () => {},
    t: (key, vars) => translate("en", key, vars),
  }),
};

const compound = (name, parts) => Object.assign(() => {}, Object.fromEntries(parts.map(part => [part, `${name}.${part}`])));
const Table = compound("Table", ["ScrollContainer", "Content", "Header", "Column", "Body", "Row", "Cell"]);
const Dropdown = compound("Dropdown", ["Popover", "Menu", "Section", "Item", "SubmenuTrigger"]);

function load(file, extra = {}) {
  const jsx = (type, props) => ({ type, props });
  const dependencies = {
    "react/jsx-runtime": { jsx, jsxs: jsx, Fragment: "Fragment" },
    "react": {
      Suspense: "Suspense", useState: value => [value, () => {}],
      useCallback: callback => callback, useMemo: compute => compute(), useEffect: () => {}, useSyncExternalStore: () => false,
    },
    "@heroui/react": { Skeleton: "Skeleton", Card: compound("Card", ["Content"]), Chip: "Chip", Table, Dropdown, Button: "Button", Label: "Label", Separator: "Separator", Drawer: { Root: "Drawer.Root", Backdrop: "Drawer.Backdrop", Content: "Drawer.Content", Dialog: "Drawer.Dialog" }, useOverlayState: options => options },
    "@tabler/icons-react": new Proxy({}, { get: (_, key) => key }),
    "@/app/components/i18n/LocaleProvider": locale,
    "next/link": { default: "Link" },
    "next/image": { default: "Image" },
    "@/lib/public-apartment-image": { canOptimizePublicApartmentImage: () => false },
    "next-themes": { useTheme: () => ({ resolvedTheme: "light", setTheme: () => {} }) },
    "@/service/signOutService": { signOut: () => {} },
    "./SidebarLinkPending": { default: () => null },
    "./SidebarNotificationsItem": { default: "SidebarNotificationsItem" },
    "@/hooks/use-pending-navigation": { usePendingNavigation: () => ({ pendingHref: null, navigate: href => extra["next/navigation"].useRouter().push(href) }) },
    "@/app/components/notifications/NotificationsOverlay": { NOTIFICATIONS_QUERY_VALUE: "open" },
    "@/app/components/settings/SettingsOverlay": { SETTINGS_QUERY_VALUE: "open" },
    "@/app/components/profile/UserAvatar": { default: "UserAvatar" },
    "@/app/components/settings/ToggleSwitch": { default: "ToggleSwitch" },
    "@/hooks/use-notifications": { useNotifications: () => ({ notifications: [], unreadCount: 0 }) },
    "@/lib/sidebar-notification-activity": { getUnreadSidebarActivity: () => new Set() },
    "./PropertiesHeader": loadPropertiesHeader(),
    "./components/PropertiesSkeleton": { default: () => load("landlord/properties/components/PropertiesSkeleton.tsx").default() },
    "./components/PropertyDetailSkeleton": { default: () => load("landlord/properties/[apartmentId]/components/PropertyDetailSkeleton.tsx").default() },
    "./components/DescriptionSkeleton": { default: () => load("landlord/properties/[apartmentId]/description/components/DescriptionSkeleton.tsx").default() },
    "./components/ReviewsSkeleton": { default: () => load("landlord/properties/[apartmentId]/reviews/components/ReviewsSkeleton.tsx").default() },
    "./DescriptionSection": { default: function DescriptionSection(props) { return load("landlord/properties/[apartmentId]/description/components/DescriptionSection.tsx").default(props); } },
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
  const expand = typeof element.type === "function" && ["Sk", "FieldSkeleton", "DescriptionFieldSkeleton", "DescriptionSection", "ReadOnlyField", "EditSectionButton", "PropertiesHeader", "default", "MobileSidebarMenu"].includes(element.type.name);
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
  assert.ok(elements.filter(node => node.type === "Skeleton").every(node => node.props.className.includes("bg-skeleton!")));
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
  assert.ok(elements.filter(node => node.type === "Skeleton").every(node => node.props.className.includes("bg-skeleton!")));
});

test("Description route loading mirrors all five sections and announces loading without fetching data", () => {
  const boundary = load("landlord/properties/[apartmentId]/description/loading.tsx").default();
  const tree = boundary.type();
  assert.equal(tree.props["aria-busy"], "true");
  assert.equal(tree.props["aria-label"], "Loading apartment description");
  const elements = nodes(tree);
  assert.equal(elements.find(node => node.type === "h1").props.children, "Apartment Description");
  const titles = elements.filter(node => node.type === "h2").map(node => node.props.children);
  assert.deepEqual(titles, ["Main Information", "Full Description", "Room / Unit Details", "Included Perks", "Lease Agreement"]);
  assert.ok(elements.some(node => node.props["aria-hidden"] === "true"));
  assert.equal(elements.find(node => node.props.className === "grid grid-cols-1 gap-2 sm:grid-cols-2 2xl:grid-cols-5").props.children.length, 5);
  assert.equal(elements.find(node => node.props.className === "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2").props.children.length, 8);
  assert.equal(elements.find(node => node.props.className === "grid flex-1 grid-cols-1 sm:grid-cols-2 gap-2").props.children.length, 2);
  assert.ok(elements.some(node => node.type === "Skeleton" && node.props.className.includes("min-h-40 w-full rounded-xl")));
  assert.ok(elements.filter(node => node.type === "Skeleton").every(node => node.props.className.includes("bg-skeleton!")));
});

function descriptionHarness({ tenant = { leaseStart: "2026-10-20", leaseEnd: "2027-10-20" }, amenities = ["wifi"], lease = "lease.pdf", description = "A welcoming apartment." } = {}) {
  const updates = [];
  const viewed = [];
  let stateIndex = 0;
  const { default: Client } = load("landlord/properties/[apartmentId]/description/components/DescriptionClient.tsx", {
    react: { useState: initial => { const index = stateIndex++; return [initial, value => updates.push({ index, value })]; } },
    "next/navigation": { useRouter: () => ({ push: () => {}, prefetch: () => {} }) },
    "@repo/utils": { formatPesoDisplay: value => `PHP ${value}` },
    "@/app/tenant/payment/utils": { formatLeaseDate: value => value ?? "—" },
    "../../components/to-property": { toProperty: apartment => ({ ...apartment, thumbnail: "/cover.jpg" }) },
    "../../components/use-lease-viewer": { useLeaseViewer: () => ({ viewing: false, viewLease: async path => { viewed.push(path); return null; } }) },
    "@/app/components/inputs/perks": { PERKS: { wifi: { name: "Wi-Fi", icon: "IconWifi" } } },
    "../../../components/modals/LeaseAgreementModal": { default: "LeaseAgreementModal" },
    "../../../components/modals/EditPropertyModal": { default: "EditPropertyModal" },
  });
  const elements = nodes(Client({ detail: {
    tenant,
    apartment: { id: "unit-1", name: "Cozy Cove", street_address: "123 Test St", city: "Caloocan", amenities, description,
      monthly_rent: 15000, security_deposit: 15000, advance_rent: 15000, type: "Studio", lease_duration: "1 Year",
      no_bedrooms: 1, no_bathrooms: 1, furnished_type: "Fully Furnished", floor_level: "6th-10th Floor", max_occupants: 2,
      area_sqm: 21, lease_agreement_url: lease },
  } }));
  return { elements, updates, viewed };
}

test("Description redesign keeps the photo, five summary tiles, eight specs, perk icons and four edit actions", async () => {
  const { elements, updates, viewed } = descriptionHarness();
  assert.equal(elements.find(node => node.type === "Image").props.src, "/cover.jpg");
  const fields = elements.filter(node => node.type?.name === "ReadOnlyField");
  assert.equal(fields.length, 13);
  assert.equal(fields.find(node => node.props.label === "Furnishing").props.value, "Fully Furnished");
  assert.ok(elements.some(node => node.type === "IconWifi" && node.props["aria-hidden"] === "true"));
  const edits = elements.filter(node => node.type === "Button" && node.props["aria-label"]?.startsWith("Edit"));
  assert.equal(edits.length, 4);
  edits.forEach(node => node.props.onPress());
  assert.ok(updates.every(update => update.index === 2 && update.value === true));
  const view = elements.find(node => node.type === "Button" && [node.props.children].flat().includes("View Lease Agreement"));
  assert.equal(view.props.isDisabled, false);
  view.props.onPress();
  await Promise.resolve();
  assert.deepEqual(viewed, ["lease.pdf"]);
  elements.find(node => node.type === "Button" && [node.props.children].flat().some(child => typeof child === "string" && child.includes("Upload Lease Agreement"))).props.onPress();
  assert.equal(updates.at(-1).index, 3);
  assert.equal(updates.at(-1).value, true);
});

test("Description redesign handles vacant units, missing lease, empty description and no perks", () => {
  const { elements } = descriptionHarness({ tenant: null, amenities: [], lease: null, description: "" });
  assert.equal(elements.filter(node => node.type?.name === "ReadOnlyField").length, 11);
  assert.ok(elements.some(node => node.type === "p" && node.props.children === "No perks added yet."));
  assert.ok(elements.some(node => node.type === "p" && node.props.children === "No description added yet."));
  const view = elements.find(node => node.type === "Button" && [node.props.children].flat().includes("View Lease Agreement"));
  assert.equal(view.props.isDisabled, true);
});

test("Description navigation warms both routes on pointer and keyboard intent", () => {
  const detail = readFileSync(new URL("../app/landlord/properties/[apartmentId]/components/PropertyDetailClient.tsx", import.meta.url), "utf8");
  const description = readFileSync(new URL("../app/landlord/properties/[apartmentId]/description/components/DescriptionClient.tsx", import.meta.url), "utf8");
  for (const event of ["onMouseEnter", "onFocus"]) {
    assert.ok(detail.includes(`${event}={() => router.prefetch(\`/landlord/properties/\${apartment.id}/description\`)}`));
  }
  for (const event of ["onHoverStart", "onFocus"]) {
    assert.ok(description.includes(`${event}={() => router.prefetch(\`/landlord/properties/\${apartment.id}\`)}`));
  }
  assert.ok(description.includes('onPress={() => router.push(`/landlord/properties/${apartment.id}`)}'));
});

function reviewsHarness(reviews) {
  let sort = "Most Recent";
  const prefetched = [];
  const pushed = [];
  const { default: Client } = load("landlord/properties/[apartmentId]/reviews/components/ReviewsClient.tsx", {
    react: { useMemo: compute => compute(), useState: () => [sort, value => { sort = value; }] },
    "next/navigation": { useRouter: () => ({ prefetch: href => prefetched.push(href), push: href => pushed.push(href) }) },
    "@/app/browse/[apartmentId]/components/ReviewCard": { default: "ReviewCard" },
    "@/app/browse/[apartmentId]/components/RatingBreakdown": { default: "RatingBreakdown" },
  });
  return { render: () => nodes(Client({ apartmentId: "unit-1", apartmentName: "Cozy Cove", reviews })), prefetched, pushed };
}

test("Reviews empty state fills the page and never presents a zero rating as tenant feedback", () => {
  const { render, prefetched, pushed } = reviewsHarness([]);
  const elements = render();
  assert.ok(elements[0].props.className.includes("w-full min-w-0"));
  assert.equal(elements[0].props.className.includes("max-w-5xl"), false);
  assert.ok(elements.some(node => node.type === "p" && node.props.children === "No ratings yet"));
  assert.ok(elements.some(node => node.type === "h3" && node.props.children === "No reviews yet"));
  assert.equal(elements.some(node => node.type === "RatingBreakdown"), false);
  assert.equal(elements.some(node => node.type === "Dropdown.Menu"), false);
  const back = elements.find(node => node.type === "Button");
  back.props.onHoverStart();
  back.props.onFocus();
  back.props.onPress();
  assert.deepEqual(prefetched, ["/landlord/properties/unit-1", "/landlord/properties/unit-1"]);
  assert.deepEqual(pushed, ["/landlord/properties/unit-1"]);
});

test("Reviews retain accurate ratings, all sort options and shared card photo/comment data", () => {
  const reviews = [
    { id: "old", name: "Older tenant", rating: 5, date: "2026-01-01", review: "Great", images: ["photo.jpg"], stayPeriod: "1 year" },
    { id: "new", name: "Newer tenant", rating: 2, date: "2026-10-01", review: "Needs work", images: [], stayPeriod: "6 months" },
  ];
  const { render } = reviewsHarness(reviews);
  let elements = render();
  const summary = elements.find(node => node.type === "RatingBreakdown");
  assert.equal(summary.props.layout, "stacked");
  assert.equal(summary.props.overallRate, 3.5);
  assert.equal(summary.props.totalReviews, 2);
  assert.equal(summary.props.no5Star, 1);
  assert.equal(summary.props.no2Star, 1);
  const names = () => render().filter(node => node.type === "ReviewCard").map(node => node.props.reviewerName);
  assert.deepEqual(names(), ["Newer tenant", "Older tenant"]);
  elements.find(node => node.type === "Dropdown.Menu").props.onAction("Highest Rating");
  assert.deepEqual(names(), ["Older tenant", "Newer tenant"]);
  elements = render();
  const card = elements.find(node => node.type === "ReviewCard");
  assert.deepEqual(card.props.images, ["photo.jpg"]);
  assert.equal(card.props.reviewText, "Great");
  assert.equal(card.props.stayPeriod, "1 year");
  elements.find(node => node.type === "Dropdown.Menu").props.onAction("Lowest Rating");
  assert.deepEqual(names(), ["Newer tenant", "Older tenant"]);
  assert.deepEqual(reviews.map(review => review.id), ["old", "new"]);
});

test("Reviews skeleton mirrors the full-width summary and list without showing a false empty count", () => {
  const boundary = load("landlord/properties/[apartmentId]/reviews/loading.tsx").default();
  const tree = boundary.type();
  assert.equal(tree.props["aria-busy"], "true");
  assert.equal(tree.props["aria-label"], "Loading property reviews");
  const elements = nodes(tree);
  assert.ok(elements[0].props.className.includes("w-full min-w-0"));
  assert.equal(elements.find(node => node.type === "h1").props.children, "Property Reviews");
  assert.equal(elements.find(node => node.props.className === "grid min-w-0 grid-cols-1 items-start gap-4 2xl:grid-cols-2").props.children.length, 4);
  assert.ok(elements.some(node => node.props["aria-hidden"] === "true"));
  assert.ok(elements.filter(node => node.type === "Skeleton").every(node => node.props.className.includes("bg-skeleton!")));
});

test("Property reviews link prefetches on pointer and keyboard intent", () => {
  const detail = readFileSync(new URL("../app/landlord/properties/[apartmentId]/components/PropertyDetailClient.tsx", import.meta.url), "utf8");
  for (const event of ["onMouseEnter", "onFocus"]) {
    assert.ok(detail.includes(`${event}={() => router.prefetch(\`/landlord/properties/\${apartment.id}/reviews\`)}`));
  }
});

test("Shared rating breakdown keeps its default layout while supporting a stacked landlord summary", () => {
  const { default: Breakdown } = load("browse/[apartmentId]/components/RatingBreakdown.tsx", {
    "@heroui/react": { Meter: compound("Meter", ["Track", "Fill"]) },
    "@/app/components/display/StarRating": { default: "StarRating" },
  });
  const props = { overallRate: 4, totalReviews: 1, no5Star: 0, no4Star: 1, no3Star: 0, no2Star: 0, no1Star: 0 };
  assert.ok(Breakdown(props).props.className.includes("sm:flex-row"));
  const stacked = Breakdown({ ...props, layout: "stacked" });
  assert.equal(stacked.props.className.includes("sm:flex-row"), false);
  assert.ok(stacked.props.children.every(child => !child.props.className.includes("sm:w-")));
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
  { href: "/landlord/dashboard", labelKey: "nav.dashboard", icon: "LayoutDashboard", prefetchOnIntent: true },
  { href: "/landlord/properties", labelKey: "nav.properties", icon: "Building", prefetchOnIntent: true },
  { href: "/landlord/applications", labelKey: "nav.applications", icon: "FileCheck", prefetchOnIntent: true },
  { href: "/landlord/maintenance-requests", labelKey: "nav.maintenance", icon: "Tool", prefetchOnIntent: true },
  { href: "/landlord/payments", labelKey: "nav.payments", icon: "CashBanknote", prefetchOnIntent: true },
  { href: "/landlord/messages", labelKey: "nav.messages", icon: "Messages" },
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
  const drawer = elements.find(node => node.type === "Drawer.Root");
  drawer.props.state.onOpenChange(false);
  assert.deepEqual(harness.prefetched, []);
  drawer.props.state.onOpenChange(true);
  assert.deepEqual(harness.prefetched, ["/landlord/dashboard", "/landlord/properties", "/landlord/applications", "/landlord/maintenance-requests", "/landlord/payments"]);
  const labelOf = node => [node.props.children].flat(Infinity).filter(child => typeof child === "string").join("");
  elements.find(node => node.type === "Button" && node.props.className?.includes("button--bare") && labelOf(node) === "My Properties").props.onClick();
  assert.deepEqual(harness.pushed, ["/landlord/properties"]);
});
