import assert from "node:assert/strict";
import test from "node:test";
import { compile, hookRuntime } from "./test-support/hook-runtime.mjs";
import * as rows from "../../../packages/utils/src/browseRows.ts";
import * as preferences from "./tenant-preferences.ts";

const jsx = (type, props) => ({ type, props: props ?? {} });
const jsxRuntime = { jsx, jsxs: jsx, Fragment: "Fragment" };
const sectionMetadata = compile("app/browse/lib/recommended-section.ts", {});
const matching = compile("lib/card-preference-matches.ts", { "@repo/utils": rows, "./tenant-preferences": preferences });
const apt = { id: "same", name: "Home", city: "Caloocan", location: "Caloocan", price: 15000, bedrooms: 2, amenities: ["parking"] };
const nodes = node => {
  if (Array.isArray(node)) return node.flatMap(nodes);
  if (!node || typeof node !== "object") return [];
  return [node, ...nodes(typeof node.type === "function" ? node.type(node.props) : node.props.children)];
};
const text = node => typeof node === "string" || typeof node === "number" ? String(node) : Array.isArray(node) ? node.map(text).join("") : text(node?.props?.children ?? "");

test("section ID gates cards and previews, including the same matching apartment outside Recommended", () => {
  const runtime = hookRuntime();
  const rules = matching.cardPreferenceRules({ selectedCities: ["Caloocan"], budgetMin: 10000, budgetMax: 20000 });
  let preview = null;
  const Browse = compile("app/browse/components/BrowseSectionsList.tsx", {
    react: { ...runtime.react, memo: component => component, useTransition: () => [false, fn => fn()] },
    "react/jsx-runtime": jsxRuntime,
    "next/link": { default: "Link" }, "next/dynamic": { default: () => "Preview" },
    "next/navigation": { useRouter: () => ({ push() {} }) },
    "@heroui/react": { Button: "Button", toast: {} },
    "@tabler/icons-react": new Proxy({}, { get: (_, key) => key }),
    "../../components/ui/ApartmentCard": { default: "ApartmentCard" },
    "@/app/components/ui/AuthPromptModal": { default: "AuthPrompt" },
    "@/hooks/use-favorites": { useFavorites: () => ({ isFavorite: () => false, toggleFavorite() {} }) },
    "@/hooks/use-recent-apartment-searches": { useRememberRecentApartment: () => () => {} },
    "@/hooks/use-card-preference-rules": { useCardPreferenceRules: () => rules },
    "@/lib/card-preference-matches": matching,
    "../lib/recommended-section": sectionMetadata,
    "./BrowsePageSkeleton": {},
    "./use-hover-preview": {
      previewAnchor: () => ({ left: 0, top: 0, width: 224, height: 300 }), previewPosition: () => ({}),
      useHoverPreview: () => ({ preview, handleHoverCard: (apartment, rect, sectionId) => { preview = { apartment, rect, sectionId }; } }),
    },
  }).default;
  const sections = [
    { id: sectionMetadata.RECOMMENDED_SECTION_ID, title: "Renamed recommendation heading", apartments: [apt] },
    { id: "city:Caloocan", title: "Apartments in Caloocan", apartments: [apt] },
    { id: "other", title: "Recommended for You", apartments: [apt] },
  ];
  const read = () => runtime.render(() => nodes(Browse({ sections })));
  const cards = read().filter(node => node.type === "ApartmentCard");
  assert.deepEqual([...cards[0].props.matchLabels], ["Preferred city", "Within budget"]);
  for (const card of cards.slice(1)) assert.equal(card.props.matchLabels.length, 0);
  for (const [index, card] of cards.entries()) {
    card.props.onPreviewHover({});
    const expanded = read().find(node => node.type === "Preview");
    assert.equal(expanded.props.matchLabels.length, index === 0 ? 2 : 0);
    assert.equal(preview.sectionId, sections[index].id);
  }
});

test("generic search/filter grids supply no preference context to their cards or previews", () => {
  const runtime = hookRuntime();
  const Grid = compile("app/browse/components/RenderApartments.tsx", {
    react: { ...runtime.react, memo: component => component }, "react/jsx-runtime": jsxRuntime,
    "next/dynamic": { default: () => "Preview" },
    "next/navigation": { useRouter: () => ({ push() {} }), useSearchParams: () => new URLSearchParams("city=Caloocan&q=Home") },
    "@heroui/react": { Pagination: "Pagination", toast: {} },
    "@tabler/icons-react": new Proxy({}, { get: (_, key) => key }),
    "../../components/ui/ApartmentCard": { default: "ApartmentCard" },
    "@/app/components/ui/AuthPromptModal": { default: "AuthPrompt" },
    "@/app/components/display/EmptyState": { default: "EmptyState" },
    "@/hooks/use-favorites": { useFavorites: () => ({ isFavorite: () => false, toggleFavorite() {} }) },
    "@/hooks/use-recent-apartment-searches": { useRememberRecentApartment: () => () => {} },
    "../lib/browse-layout": { BROWSE_GRID_CLASS: "grid" },
    "./use-hover-preview": { previewAnchor() {}, previewPosition: () => ({}), useHoverPreview: () => ({ preview: { apartment: apt, rect: {} } }) },
  }).default;
  const tree = runtime.render(() => nodes(Grid({ apartment: [apt], page: 1, pageSize: 25, totalCount: 1 })));
  assert.equal(tree.find(node => node.type === "ApartmentCard").props.matchLabels, undefined);
  assert.equal(tree.find(node => node.type === "Preview").props.matchLabels, undefined);
});

test("compact cards show two chips plus an accessible count; expanded summary preserves every match", () => {
  const Chips = compile("app/components/ui/PreferenceMatchChips.tsx", {
    "react/jsx-runtime": jsxRuntime,
    "@tabler/icons-react": { IconCircleCheck: "IconCircleCheck" },
  }).default;
  const labels = ["Preferred city", "Within budget", "Preferred bedrooms", "Matches amenities"];
  const tree = nodes(Chips({ labels }));
  const items = tree.filter(node => node.type === "li");
  assert.deepEqual(items.map(text), ["Preferred city", "Within budget", "+2 more"]);
  assert.match(items[2].props["aria-label"], /Preferred bedrooms, Matches amenities/);
  const summary = Chips({ labels, summary: true });
  assert.match(text(summary), /Matches 4 of your preferences/);
  assert.match(text(summary), /City · Budget · Bedrooms · Amenities/);
  assert.equal(nodes(summary).some(node => node.type === "ul"), false);
  assert.ok(nodes(summary).some(node => node.type === "IconCircleCheck" && node.props.size === 14));
  assert.match(text(Chips({ labels: ["Preferred city"], summary: true })), /Matches 1 of your preferences/);
  assert.equal(Chips({ labels: [] }), null, "no empty spacing when preferences are absent");
  assert.equal(Chips({ labels: [], summary: true }), null);
  assert.ok(!text(Chips({ labels: labels.slice(0, 2) })).includes("more"));
});
