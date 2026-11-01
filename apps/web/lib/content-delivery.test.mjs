import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { getImgProps } from "next/dist/shared/lib/get-img-props.js";
import imageConfigModule from "next/dist/shared/lib/image-config.js";
import imageLoaderModule from "next/dist/shared/lib/image-loader.js";
import { canOptimizePublicApartmentImage } from "./public-apartment-image.ts";
import { translate } from "../../../packages/i18n/src/translate.ts";
import { compile, hookRuntime, settle, deferred } from "./test-support/hook-runtime.mjs";

const locale = {
  useTranslation: () => ({
    language: "en",
    pending: false,
    setLanguage: () => {},
    t: (key, vars) => translate("en", key, vars),
  }),
};

const source = file => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
const origin = "https://listing-project.supabase.co";
const publicPhoto = `${origin}/storage/v1/object/public/apartment-images/apartment/photo.jpg`;
const jsx = (type, props, key) => ({ type, props, key });
const jsxRuntime = { jsx, jsxs: jsx, Fragment: "Fragment" };
const nodes = node => !node || typeof node !== "object" ? [] : [node, ...[node.props?.children].flat(Infinity).flatMap(nodes)];
// The public getImageProps export relies on Next's build-time config injection.
// Next 16.4 prepares config before getImgProps; 16.3 prepares it inside that call.
// Mirror the installed version's setup while exercising the app's real config.
const loadImageConfig = NODE_ENV => compile("next.config.ts", {}, { process: { env: { NODE_ENV } } }).default.images;
const imageOptions = { ...imageConfigModule.imageConfigDefault, ...loadImageConfig("production") };
const imageConfig = imageConfigModule.prepareImageConfig ? imageConfigModule.prepareImageConfig(imageOptions) : imageOptions;
const getImageProps = props => getImgProps(props, { imgConf: imageConfig, defaultLoader: imageLoaderModule.default ?? imageLoaderModule });

test("resized images stay cached for a month so Supabase originals are not re-pulled every few hours", () => {
  const thirtyDays = 60 * 60 * 24 * 30;
  assert.equal(imageOptions.minimumCacheTTL, thirtyDays);
  assert.ok(imageOptions.minimumCacheTTL > imageConfigModule.imageConfigDefault.minimumCacheTTL);
});

test("the image optimizer only accepts NAT64/local addresses in development, never in production", () => {
  assert.equal(loadImageConfig("development").dangerouslyAllowLocalIP, true);
  assert.notEqual(loadImageConfig("production").dangerouslyAllowLocalIP, true);
});

test("only known public apartment rasters opt into optimization, never signed or other private buckets", () => {
  for (const src of [publicPhoto, publicPhoto.replace(".jpg", "_thumb.webp"), "/images/apartment.jpg", "https://images.unsplash.com/photo-123?auto=format&fit=crop&w=800&q=80"]) {
    assert.equal(canOptimizePublicApartmentImage(src, origin), true, src);
  }
  for (const src of [
    `${origin}/storage/v1/object/sign/apartment-images/apartment/photo.jpg?token=private`,
    `${origin}/storage/v1/object/public/application-documents/private.jpg`,
    `${origin}/storage/v1/object/public/user-verification/private.jpg`,
    `${origin}/storage/v1/object/public/maintenance-images/private.jpg`,
    publicPhoto + "?token=private", publicPhoto + "?t=123", publicPhoto + "#fragment",
    publicPhoto.replace("apartment/photo", "apartment/%2e%2e/photo"),
    publicPhoto.replace("apartment/photo", "apartment/%252fphoto"),
    publicPhoto.replace("listing-project", "unconfigured-project"),
    publicPhoto.replace(".jpg", ".svg"), publicPhoto.replace(".jpg", ".gif"),
    "https://listing-project.supabase.co.evil.example/storage/v1/object/public/apartment-images/a.jpg",
    "https://user:password@listing-project.supabase.co/storage/v1/object/public/apartment-images/a.jpg",
    "https://images.unsplash.com:8443/photo-123", "https://images.unsplash.com/photo-123?token=private",
    "/images/../private.jpg", "/images/%2e%2e/private.jpg", "/api/private/photo.jpg", "//evil.example/photo.jpg",
    "https://picsum.photos/600/600", "blob:local-preview", "data:image/jpeg;base64,preview", "invalid", "",
  ]) assert.equal(canOptimizePublicApartmentImage(src, origin), false, src);
});

test("installed Next Image emits responsive optimizer variants at the supported default quality; private URLs remain direct", () => {
  // The Unsplash source needs no environment or remote fixture to exercise the real installed API.
  const src = "https://images.unsplash.com/photo-123?w=800";
  const card = getImageProps({ src, width: 600, height: 600, alt: "Apartment", sizes: "(max-width: 640px) 50vw, 25vw", unoptimized: !canOptimizePublicApartmentImage(src) }).props;
  assert.match(card.src, /\/_next\/image\?/);
  assert.match(card.srcSet, /640w/);
  assert.match(card.srcSet, /1200w/);
  assert.match(card.srcSet, /q=75/);
  assert.equal(card.width, 600); assert.equal(card.height, 600);
  const privateSrc = `${origin}/storage/v1/object/sign/user-verification/id.jpg?token=private`;
  const privateImage = getImageProps({ src: privateSrc, width: 600, height: 600, alt: "Private", unoptimized: !canOptimizePublicApartmentImage(privateSrc, origin) }).props;
  assert.equal(privateImage.src, privateSrc); assert.equal(privateImage.srcSet, undefined);
  const fallback = getImageProps({ src: "https://picsum.photos/600/600", width: 600, height: 600, alt: "Fallback", unoptimized: !canOptimizePublicApartmentImage("https://picsum.photos/600/600") }).props;
  assert.equal(fallback.src, "https://picsum.photos/600/600");
});

test("public card and rental hero preserve source selection, geometry, null fallback and existing loading priority", () => {
  const policy = { canOptimizePublicApartmentImage: src => canOptimizePublicApartmentImage(src, origin) };
  const common = {
    "react/jsx-runtime": jsxRuntime, react: hookRuntime().react,
    "next/image": { default: "Image" }, "next/link": { default: "Link" },
    "@/lib/public-apartment-image": policy,
    "@/app/components/display/StatusChip": { default: "StatusChip" },
    "@tabler/icons-react": new Proxy({}, { get: (_, key) => key }),
    "@repo/utils": { formatPesoDisplay: value => String(value) },
    "@heroui/react": { Card: { Footer: "Card.Footer" }, Button: "Button" },
    "@/app/components/i18n/LocaleProvider": {
      useTranslation: () => ({
        language: "en",
        t: (key, vars) => translate("en", key, vars),
      }),
    },
  };
  const Card = compile("app/components/ui/ApartmentCard.tsx", common).default;
  const card = nodes(Card({ thumbnailUrl: publicPhoto.replace(".jpg", "_thumb.jpg"), name: "Unit", price: 5000, rating: 0, priority: true }));
  const image = card.find(node => node.type === "Image");
  assert.match(image.props.src, /_thumb\.jpg$/); assert.equal(image.props.unoptimized, false); assert.equal(image.props.priority, true);
  assert.match(image.props.className, /object-cover/); assert.match(image.props.className, /aspect-square/);
  // Listings without a resolvable photo keep the card's shape: a decorative
  // fallback image (the card itself is labelled "View {name}").
  assert.equal(image.props.alt, "");
  assert.equal(typeof image.props.onError, "function");
  const missingPhoto = nodes(Card({ thumbnailUrl: "", name: "Unit", price: 5000, rating: 0 })).find(node => node.type === "Image");
  assert.equal(missingPhoto.props.src, "/images/house-check.png");
  const Hero = compile("app/tenant/my-rental/components/RentalHero.tsx", common).default;
  const heroImage = nodes(Hero({ name: "Unit", address: "Address", imageUrl: publicPhoto, descriptionHref: "/browse/a" })).find(node => node.type === "Image");
  assert.equal(heroImage.props.fill, true); assert.equal(heroImage.props.unoptimized, false);
  assert.equal(heroImage.props.sizes, "(max-width: 1024px) 100vw, 66vw");
  assert.equal(nodes(Hero({ name: "Unit", imageUrl: null })).some(node => node.type === "Image"), false);
  for (const file of ["app/components/passport/ValidIdCard.tsx", "app/components/passport/PassportDocumentThumbnail.tsx"]) {
    assert.match(source(file), /unoptimized/); assert.doesNotMatch(source(file), /public-apartment-image/);
  }
  assert.match(source("app/browse/lib/fetch-browse-results.ts"), /url_thumb/);
  assert.match(source("service/favoritesService.ts"), /url_thumb/);
});

function lazyRuntime() {
  const definitions = [];
  const dynamic = (loader, options) => {
    let pending;
    const component = function LazyUI() {};
    component.load = () => pending ??= loader();
    component.options = options;
    definitions.push(component);
    return component;
  };
  const mount = async tree => { for (const node of nodes(tree)) if (node.type?.load) await node.type.load(); };
  return { dynamic, definitions, mount };
}

test("Settings and Notifications download no unopened UI and retain their mounted instances on close/reopen", async () => {
  for (const kind of ["settings", "notifications"]) {
    const runtime = hookRuntime(), lazy = lazyRuntime(); let query = new URLSearchParams(), imports = 0;
    const modules = {
      react: runtime.react, "react/jsx-runtime": jsxRuntime, "next/dynamic": { default: lazy.dynamic },
      "next/navigation": { useSearchParams: () => query },
      "@/app/components/i18n/LocaleProvider": locale,
    };
    for (const name of kind === "settings" ? ["SettingsModal", "ChangePasswordModal", "ChangeEmailModal"] : ["NotificationDrawer"]) {
      Object.defineProperty(modules, `./${name}`, { enumerable: true, get: () => { imports++; return { default: name }; } });
    }
    const Component = compile(`app/components/${kind}/${kind === "settings" ? "SettingsOverlay" : "NotificationsOverlay"}.tsx`, modules).default;
    const render = () => runtime.render(() => Component({ initialRoles: ["tenant"], activePortal: "tenant" }));
    assert.equal(render(), null); runtime.flush(); assert.equal(imports, 0);
    query = new URLSearchParams(`${kind}=open`); render(); const opened = render();
    await lazy.mount(opened); const firstImports = imports;
    assert.equal(imports, kind === "settings" ? 3 : 1);
    const main = nodes(opened).find(node => node.props?.[kind === "settings" ? "initialRoles" : "activePortal"]);
    assert.equal(main.props.activePortal, "tenant");
    query = new URLSearchParams(); const closed = render();
    assert.notEqual(closed, null); await lazy.mount(closed); assert.equal(imports, firstImports);
    query = new URLSearchParams(`${kind}=open`); const reopened = render(); await lazy.mount(reopened);
    assert.equal(imports, firstImports); assert.equal(nodes(reopened).find(node => node.type === main.type).type, main.type);
    runtime.unmount();
  }
  assert.doesNotMatch(source("app/components/notifications/NotificationsOverlay.tsx"), /useNotifications|\.channel\(|subscribe\(/);
  assert.match(source("hooks/use-notifications.ts"), /NotificationFeedStore|getNotificationFeed/);
});

test("property editor chunk loads only after selection; exact resource key, draft lifecycle and mutation callbacks are preserved", async () => {
  const runtime = hookRuntime(), lazy = lazyRuntime(); let imports = 0, clients = 0;
  const modules = {
    react: runtime.react, "react/jsx-runtime": jsxRuntime, "next/navigation": { useRouter: () => ({ push() {}, prefetch() {} }) },
    "next/dynamic": { default: lazy.dynamic }, "./PropertiesTable": { default: "PropertiesTable" },
    "@/app/components/display/RouteLoadingStatus": { default: "RouteLoadingStatus" },
    "@repo/supabase/browser": { createClient: () => { clients++; return {}; } },
    "./modals/DeletePropertyModal": { default: "DeletePropertyModal" },
  };
  Object.defineProperty(modules, "./PropertyDetailsSheet", { enumerable: true, get: () => { imports++; return { default: "PropertyDetailsSheet" }; } });
  const Component = compile("app/landlord/properties/components/PropertiesTableSection.tsx", modules).default;
  const property = { id: "owner-unit", name: "Unit" }, properties = [property];
  const render = () => runtime.render(() => Component({ properties }));
  let tree = render(); runtime.flush(); await lazy.mount(tree); assert.equal(imports, 0);
  nodes(tree).find(node => node.type === "PropertiesTable").props.onEditClick(property);
  tree = render(); await lazy.mount(tree); assert.equal(imports, 1); assert.equal(clients, 0, "opening the editor must not issue a new owner/property query in the parent");
  let sheet = nodes(tree).find(node => node.type?.load);
  assert.equal(sheet.key, property.id); assert.equal(sheet.props.openEditMode, true); assert.equal(sheet.props.selected, property);
  const mountedType = sheet.type;
  assert.equal(nodes(render()).find(node => node.type?.load).type, mountedType);
  sheet.props.onUpdate({ ...property, name: "Updated" }); sheet = nodes(render()).find(node => node.type?.load);
  assert.equal(sheet.props.selected.name, "Updated"); assert.equal(sheet.key, property.id);
  sheet.props.onClose(); assert.equal(nodes(render()).some(node => node.type?.load), false);
  nodes(render()).find(node => node.type === "PropertiesTable").props.onEditClick(property);
  await lazy.mount(render()); assert.equal(imports, 1); assert.equal(clients, 0);
  runtime.unmount();
});

test("Passport resolves verification before reading the linked wallet without a third read", async () => {
  const verification = deferred(), calls = [];
  const row = { id: "passport-id", user_id: "owner", verification_id: "verification", is_verified: true, is_primary: true, storage_path: "owner/verification/id-front.jpg", storage_path_back: "owner/verification/id-back.jpg" };
  const client = { from(table) {
    const call = { table, filters: [] }; calls.push(call);
    const q = { select: () => q, eq: (...args) => { call.filters.push(args); return q; }, order: () => q, limit: () => q,
      maybeSingle: () => table === "user_verifications" ? verification.promise : Promise.resolve({ data: row, error: null }),
      then: (yes, no) => Promise.resolve({ data: [row], error: null }).then(yes, no),
      insert: () => assert.fail("Already-linked verification must not be inserted again"), update: () => assert.fail("Unchanged linked verification must not be upgraded"),
    }; return q;
  } };
  const service = compile("service/passportService.ts", { "@repo/supabase/browser": { createClient: () => client }, "@repo/constants": {}, "@repo/passport": {}, "@/lib/passport-upload": {} });
  let ready = false;
  const pending = service.fetchPassportDocumentsWithVerification("owner").then(value => { ready = true; return value; });
  await settle();
  assert.equal(ready, false);
  assert.deepEqual(calls.map(call => call.table), ["user_verifications"], "the wallet query must not start while verification is pending");
  verification.resolve({ data: { id: "verification", id_front_path: row.storage_path, id_back_path: row.storage_path_back }, error: null });
  const rows = await pending; assert.equal(rows[0], row);
  assert.deepEqual(calls.map(call => call.table), ["user_verifications", "passport_documents"]);
  for (const call of calls) assert.ok(call.filters.some(([key, value]) => key === "user_id" && value === "owner"));
});

test("Passport links a missing or stale approved ID before publishing any wallet rows", async () => {
  const linked = { id: "passport-id", user_id: "owner", verification_id: "verification", is_verified: true, is_primary: true, storage_path: "owner/verification/id-front.jpg", storage_path_back: "owner/verification/id-back.jpg" };
  for (const stale of [false, true]) {
    const events = [];
    const initialRow = stale ? { ...linked, is_verified: false, is_primary: false, storage_path: "owner/passport/old-front.jpg" } : null;
    const verificationRow = { id: "verification", id_type: "philsys", id_front_path: linked.storage_path, id_back_path: linked.storage_path_back };
    let walletReads = 0;
    const client = { from(table) {
      events.push(`${table}:start`);
      const q = {
        select: () => q,
        eq: (key, value) => { assert.ok(["user_id", "id", "status", "verification_id"].includes(key), key); if (key === "user_id") assert.equal(value, "owner"); if (key === "verification_id") assert.equal(value, verificationRow.id); return q; },
        order: () => q, limit: () => q,
        maybeSingle: async () => { events.push(`${table}:maybeSingle`); return table === "user_verifications" ? { data: verificationRow, error: null } : { data: null, error: null }; },
        then: (yes, no) => { walletReads++; events.push(`${table}:wallet-${walletReads}`); return Promise.resolve({ data: walletReads === 1 ? (initialRow ? [initialRow] : []) : [linked], error: null }).then(yes, no); },
        insert: payload => { events.push(`${table}:insert`); assert.equal(payload.verification_id, verificationRow.id); assert.equal(payload.storage_path, linked.storage_path); return { select: () => ({ single: async () => ({ data: linked, error: null }) }) }; },
        update: payload => { events.push(`${table}:update`); assert.equal(payload.storage_path, linked.storage_path); assert.equal(payload.is_verified, true); return { eq: () => ({ select: () => ({ single: async () => ({ data: linked, error: null }) }) }) }; },
      };
      return q;
    } };
    const service = compile("service/passportService.ts", { "@repo/supabase/browser": { createClient: () => client }, "@repo/constants": {}, "@repo/passport": {}, "@/lib/passport-upload": {} });
    const rows = await service.fetchPassportDocumentsWithVerification("owner");
    assert.deepEqual(rows, [linked]);
    assert.equal(walletReads, 2, "a link write is followed by a fresh authoritative wallet read");
    const write = stale ? "passport_documents:update" : "passport_documents:insert";
    assert.ok(events.indexOf(write) > events.indexOf("passport_documents:wallet-1"));
    assert.ok(events.indexOf(write) < events.indexOf("passport_documents:wallet-2"), "link write settles before the published wallet read");
    assert.equal(events.includes(stale ? "passport_documents:insert" : "passport_documents:update"), false);
    if (stale) {
      assert.equal(events.includes("passport_documents:maybeSingle"), false, "the snapshot already holds the stale row");
    } else {
      const recheck = events.indexOf("passport_documents:maybeSingle");
      assert.ok(recheck > events.indexOf("passport_documents:wallet-1"));
      assert.ok(recheck < events.indexOf(write), "a missing link is re-checked immediately before insert");
    }
  }
});

test("Passport guard reuses layout identity but retains every portal/status denial and never caches between requests", async () => {
  const access = compile("lib/passport-access.ts", {});
  for (const portal of ["tenant", "landlord"]) {
    for (const scenario of ["verified", "pending", "unverified", "rejected", "wrong-role", "signed-out", "rls-hidden", "query-error"]) {
      let requestCache = new Map(), authReads = 0, profileReads = 0;
      const profile = scenario === "rls-hidden" ? null : { id: "internal-owner", roles: [scenario === "wrong-role" ? "admin" : portal], account_status: scenario, mobile_number: "phone" };
      const cache = fn => (...args) => {
        if (!requestCache.has(fn)) requestCache.set(fn, new Map());
        const entries = requestCache.get(fn), key = JSON.stringify(args);
        if (!entries.has(key)) entries.set(key, fn(...args));
        return entries.get(key);
      };
      const navigation = { redirect: target => { throw new Error(`redirect:${target}`); } };
      const client = {
        auth: { getUser: async () => { authReads++; return { data: { user: scenario === "signed-out" ? null : { id: "auth-owner" } }, error: null }; } },
        from(table) {
          assert.equal(table, "users"); profileReads++;
          const q = { select: () => q, eq: (key, value) => { assert.equal(key, "user_id"); assert.equal(value, "auth-owner"); return q; },
            maybeSingle: async () => ({ data: profile, error: scenario === "query-error" ? { message: "Profile unavailable" } : null }) };
          return q;
        },
      };
      const identity = compile("lib/server-identity.ts", { "server-only": {}, react: { cache }, "next/navigation": navigation,
        "@repo/supabase/server": { createClient: async () => client }, "@repo/supabase/pending-onboarding": {},
        "@repo/utils": compile("../../packages/utils/src/landlordAccess.ts", {}),
        "@/lib/landlord-verification-access": compile("lib/landlord-verification-access.ts", {}) });
      const guard = compile("app/components/passport/requirePassportViewer.ts", { react: { cache }, "next/navigation": navigation, "@/lib/server-identity": identity, "@/lib/passport-access": access }).requirePassportViewer;
      await identity.getServerIdentity();
      if (scenario === "verified") {
        const [layout, page] = await Promise.all([guard(portal), guard(portal)]);
        assert.equal(layout.userId, "internal-owner"); assert.equal(page.userId, "internal-owner");
      } else {
        const target = scenario === "pending" ? new RegExp(`/` + portal + `/profile`)
          : ["unverified", "rejected"].includes(scenario) ? /\/verify/
            : scenario === "signed-out" ? /\/sign-in/ : scenario === "query-error" ? /Profile unavailable/ : /\/browse/;
        await assert.rejects(guard(portal), target);
      }
      assert.equal(authReads, 1); assert.equal(profileReads, scenario === "signed-out" ? 0 : 1);
      requestCache = new Map(); await identity.getServerIdentity();
      assert.equal(authReads, 2, "another server request must validate Auth again");
    }
  }
  assert.doesNotMatch(source("app/components/passport/requirePassportViewer.ts"), /fetchPassportDocuments|linkApprovedVerification|createSignedUrl|unstable_cache/);
});
