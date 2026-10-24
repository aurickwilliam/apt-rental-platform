import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
import { apartmentReviewSelect } from "./apartment-review-query.ts";

function load(path, modules) {
  const source = readFileSync(new URL(path, import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  const context = { exports: {}, require(name) {
    assert.ok(name in modules, `Unexpected import: ${name}`);
    return modules[name];
  } };
  vm.runInNewContext(compiled, context);
  return context.exports;
}

test("review service omits anonymous tenancy joins, normalizes rows and deduplicates by account", async () => {
  let session = null;
  let failure = null;
  let release;
  const selects = [];
  const gate = new Promise(resolve => { release = resolve; });
  const client = {
    auth: { getSession: async () => ({ data: { session }, error: null }) },
    from(table) {
      assert.equal(table, "reviews");
      return { select(select) {
        selects.push(select);
        return { eq(column, value) {
          assert.equal(column, "apartment_id");
          assert.equal(value, "apartment-a");
          return { async order(column, options) {
            assert.equal(column, "created_at");
            assert.equal(options.ascending, false);
            await gate;
            return {
              data: [{ id: "review-a", ...(select.includes("tenancy:") ? { tenancy: { lease_start: "2026-01-01", lease_end: null } } : {}) }],
              error: failure,
            };
          } };
        } };
      } };
    },
  };
  const service = load("../service/reviewsService.ts", {
    "@repo/supabase/browser": { createClient: () => client },
    "@repo/utils": { isReviewStayEligible: () => true },
    "@/lib/apartment-review-query": { apartmentReviewSelect },
  });
  const a = service.fetchApartmentReviews("apartment-a");
  const b = service.fetchApartmentReviews("apartment-a");
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(selects.length, 1);
  assert.doesNotMatch(selects[0], /tenancy/);
  session = { user: { id: "account-a" } };
  const signedIn = service.fetchApartmentReviews("apartment-a");
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(selects.length, 2);
  assert.match(selects[1], /tenancy:tenancy_id/);
  release();
  const [rows, sharedRows, signedInRows] = await Promise.all([a, b, signedIn]);
  assert.equal(rows, sharedRows);
  assert.equal(rows[0].tenancy, null);
  assert.equal(signedInRows[0].tenancy.lease_start, "2026-01-01");
  await service.fetchApartmentReviews("apartment-a");
  assert.equal(selects.length, 3, "settled reads are not cached");
  failure = { code: "42501", message: "permission denied" };
  await assert.rejects(service.fetchApartmentReviews("apartment-a"), error => error === failure);
  failure = null;
  await service.fetchApartmentReviews("apartment-a");
  assert.equal(selects.length, 5, "Retry makes a new request after a failed read");
});

const jsx = (type, props) => ({ type, props });
function nodes(element) {
  if (!element || typeof element !== "object") return [];
  if (typeof element.type === "function") return nodes(element.type(element.props));
  return [element, ...[element.props?.children].flat(Infinity).flatMap(nodes)];
}
const defaultModule = value => ({ __esModule: true, default: value });

for (const view of ["ApartmentReviewsPreview", "ApartmentRatingsView"]) {
  test(`${view} separates failure from empty results and retries the read`, () => {
    let retries = 0;
    let state = {
      reviews: [], loading: false, error: "Failed to load reviews.", totalReviews: 0,
      ratingsCount: [], checkingEligibility: false, refresh: () => { retries++; },
    };
    const component = load(`../app/browse/[apartmentId]/components/${view}.tsx`, {
      "react/jsx-runtime": { jsx, jsxs: jsx },
      react: { useEffect() {}, useState: initial => [initial, () => {}] },
      "next/navigation": { useRouter: () => ({ push() {} }), useParams: () => ({ apartmentId: "apartment-a" }) },
      "next/image": defaultModule("Image"),
      "@heroui/react": {
        Button: "Button", Card: Object.assign(() => {}, { Content: "CardContent" }),
        Chip: {}, Dropdown: {}, Label: "Label", Separator: "Separator",
        useOverlayState: () => ({ isOpen: false, setOpen() {} }),
      },
      "@tabler/icons-react": {},
      "./ReviewCard": defaultModule("ReviewCard"),
      "./BackBtn": defaultModule("BackBtn"),
      "./RateApartmentModal": defaultModule("RateApartmentModal"),
      "./RatingBreakdown": defaultModule("RatingBreakdown"),
      "@/app/components/display/StatusChip": defaultModule("StatusChip"),
      "@/app/components/display/ErrorBanner": defaultModule("ErrorBanner"),
      "@/lib/status-tone": { statusToneFor() {} },
      "@/service/reviewsService": {},
      "@/hooks/use-apartment-reviews": { useApartmentReviews: () => state },
    }).default;
    const props = { apartmentId: "apartment-a" };
    let rendered = nodes(component(props));
    assert.equal(rendered.filter(node => node.type === "ErrorBanner").length, 1);
    assert.doesNotMatch(JSON.stringify(rendered), /No reviews yet/);
    rendered.find(node => node.type === "Button" && node.props.children === "Retry").props.onPress();
    assert.equal(retries, 1);
    state = { ...state, error: null };
    // Inspect the JSX tree without executing library primitives.
    const tree = component(props);
    const walk = element => !element || typeof element !== "object" ? [] :
      [element, ...[element.props?.children].flat(Infinity).flatMap(walk)];
    const empty = view === "ApartmentReviewsPreview" ? tree.type(tree.props) : tree;
    assert.match(JSON.stringify(walk(empty)), /No reviews yet/);
  });
}
