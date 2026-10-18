import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const apartment = {
  id: "saved-apartment", name: "Irene's Housing", barangay: "Malanday", city: "Valenzuela",
  monthly_rent: 15000, average_rating: 5, no_bedrooms: 1, no_bathrooms: 1, area_sqm: 25,
  apartment_images: [{ url: "/photo.jpg", is_cover: true }],
};
const nodes = element => {
  if (!element || typeof element !== "object") return [];
  const sharedLayout = typeof element.type === "function" && [
    "FavoritesPageShell", "FavoritesPageHeader", "FavoritesCardsSkeleton", "FavoritesPageSkeleton", "FavoritesLoading",
  ].includes(element.type.name);
  const children = sharedLayout ? element.type(element.props) : element.props?.children;
  return [element, ...[children].flat(Infinity).flatMap(nodes)];
};
const text = element => nodes(element).flatMap(node => [node.props?.children].flat(Infinity)).filter(value => typeof value === "string").join(" ");

function loadComponent(file, modules = {}, exportName = "default") {
  const jsx = (type, props) => ({ type, props });
  const dependencies = {
    "react/jsx-runtime": { jsx, jsxs: jsx },
    "@tabler/icons-react": new Proxy({}, { get: (_, key) => key }),
    "@repo/utils": { formatPesoDisplay: value => `₱ ${value}` },
    "@heroui/react": { Button: "Button", Card: Object.assign(() => {}, { Content: "Content", Footer: "Footer" }), Skeleton: "Skeleton", toast: Object.assign(() => {}, { success: () => {}, danger: () => {} }) },
    "next/link": { default: "Link" },
    "next/image": { default: "Image" },
    ...modules,
  };
  const source = readFileSync(new URL(`../app/${file}`, import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const context = { exports: {}, require: name => {
    if (name === "./FavoritesPageLayout") return {
      FavoritesPageShell: loadComponent("tenant/favorites/components/FavoritesPageLayout.tsx", {}, "FavoritesPageShell"),
      FavoritesPageHeader: loadComponent("tenant/favorites/components/FavoritesPageLayout.tsx", {}, "FavoritesPageHeader"),
    };
    if (name === "./FavoritesSkeleton" || name === "./components/FavoritesSkeleton") return {
      default: loadComponent("tenant/favorites/components/FavoritesSkeleton.tsx"),
      FavoritesCardsSkeleton: loadComponent("tenant/favorites/components/FavoritesSkeleton.tsx", {}, "FavoritesCardsSkeleton"),
    };
    return dependencies[name] ?? { default: name };
  } };
  vm.runInNewContext(compiled, context);
  return context.exports[exportName];
}

function renderFavorites({ view = "grid", items = [apartment], loading = false, error = null } = {}) {
  const navigation = [];
  const toggles = [];
  const updates = [];
  const refreshes = [];
  const state = [view, items, false, null, null];
  let cursor = 0;
  const Component = loadComponent("tenant/favorites/components/FavoritesClient.tsx", {
    react: {
      useState: () => { const index = cursor++; return [state[index], value => updates.push([index, value])]; },
      useMemo: fn => fn(), useCallback: fn => fn, useEffect: () => {},
    },
    "next/navigation": { useRouter: () => ({ push: href => navigation.push(href) }) },
    "@/hooks/use-favorites": { useFavorites: () => ({
      favoriteApartmentIds: new Set(items.map(item => item.id)), loading, error,
      isFavorite: () => true, toggleFavorite: async id => { toggles.push(id); return false; },
      refreshFavorites: () => refreshes.push(true),
    }) },
  });
  const tree = Component();
  return { tree, all: nodes(tree), navigation, toggles, updates, refreshes };
}

test("Favorites has a portal-style header, roomy grid and unchanged apartment actions", async () => {
  const page = renderFavorites();
  assert.equal(page.all.find(node => node.type === "h1").props.children[1], "Favorites");
  assert.ok(text(page.tree).includes("Keep your saved apartments in one place."));
  assert.ok(text(page.tree).includes("1 saved apartment"));
  const grid = page.all.find(node => node.props.className?.startsWith("favorites-grid"));
  assert.match(grid.props.className, /@min-\[36rem\]\/favorites:grid-cols-2/);
  assert.match(grid.props.className, /@min-\[64rem\]\/favorites:grid-cols-3/);
  const card = grid.props.children[0];
  assert.equal(card.props.thumbnailUrl, "/photo.jpg");
  card.props.onPress();
  assert.deepEqual(page.navigation, ["/browse/saved-apartment"]);
  card.props.onFavoritePress();
  await Promise.resolve();
  assert.deepEqual(page.toggles, ["saved-apartment"]);
});

test("view controls expose their selected state and list cards keep real navigation links", () => {
  const page = renderFavorites({ view: "list" });
  const gridButton = page.all.find(node => node.props["aria-label"] === "Grid view");
  const listButton = page.all.find(node => node.props["aria-label"] === "List view");
  assert.equal(gridButton.props["aria-pressed"], false);
  assert.equal(listButton.props["aria-pressed"], true);
  gridButton.props.onPress();
  assert.deepEqual(page.updates, [[0, "grid"]]);
  const card = page.all.find(node => node.props.apartment?.id === apartment.id);
  assert.equal(card.props.href, "/browse/saved-apartment");
  const ListCard = loadComponent("tenant/favorites/components/FavoriteListCard.tsx");
  const all = nodes(ListCard({ ...card.props }));
  assert.equal(all.find(node => node.type === "Link").props.href, card.props.href);
  assert.equal(all.find(node => node.type === "Button").props["aria-label"], "Remove from favorites");
});

test("empty, error and loading states offer the right next step without a false saved count", () => {
  const empty = renderFavorites({ items: [] });
  assert.ok(text(empty.tree).includes("Your shortlist starts here"));
  empty.all.find(node => node.type === "Button" && text(node).includes("Browse apartments")).props.onPress();
  assert.deepEqual(empty.navigation, ["/tenant/browse"]);
  const error = renderFavorites({ error: "Could not connect" });
  assert.ok(text(error.tree).includes("Could not connect"));
  assert.ok(!text(error.tree).includes("1 saved apartment"));
  error.all.find(node => node.type === "Button" && node.props.children === "Try again").props.onPress();
  assert.equal(error.refreshes.length, 1);
  const loading = renderFavorites({ loading: true });
  const skeleton = loading.all.find(node => typeof node.type === "function" && node.props.viewMode);
  assert.ok(nodes(skeleton.type(skeleton.props)).some(node => node.props["aria-busy"] === "true"));
});

test("shared apartment card keyboard handling opens only the card, not its nested favorite control", () => {
  let opened = 0;
  let prevented = 0;
  const Card = loadComponent("components/ui/ApartmentCard.tsx");
  const tree = Card({ name: apartment.name, location: "Malanday, Valenzuela", price: 15000, rating: 5, thumbnailUrl: "/photo.jpg", onPress: () => opened++ });
  assert.equal(tree.props.tabIndex, 0);
  const target = {};
  for (const key of ["Enter", " "]) tree.props.onKeyDown({ key, target, currentTarget: target, preventDefault: () => prevented++ });
  tree.props.onKeyDown({ key: "Enter", target: {}, currentTarget: target, preventDefault: () => prevented++ });
  assert.equal(opened, 2);
  assert.equal(prevented, 2);
});

test("Favorites route fallback shares its header, toolbar and responsive card skeletons with client loading", () => {
  const Loading = loadComponent("tenant/favorites/loading.tsx");
  const tree = Loading();
  const all = nodes(tree);
  assert.ok(text(tree).includes("Favorites"));
  assert.ok(text(tree).includes("Keep your saved apartments in one place."));
  assert.ok(all.some(node => node.props.className?.includes("@container/favorites")));
  assert.ok(all.some(node => node.props["aria-label"] === "Loading favorites toolbar"));
  const cards = all.find(node => node.props["aria-label"] === "Loading saved apartments");
  assert.equal(cards.props["aria-busy"], "true");
  assert.equal(cards.props.children.length, 3);
  assert.match(cards.props.className, /@min-\[64rem\]\/favorites:grid-cols-3/);
  const clientLoading = renderFavorites({ view: "list", loading: true });
  const listCards = clientLoading.all.find(node => node.props["aria-label"] === "Loading saved apartments");
  assert.equal(listCards.props.children.length, 3);
  assert.match(listCards.props.children[0].props.className, /@min-\[36rem\]\/favorites:flex-row/);
});
