import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const componentSource = name => readFileSync(new URL(`../app/tenant/my-rental/${name}`, import.meta.url), "utf8");
const nodes = element => !element || typeof element !== "object" ? [] :
  [element, ...[element.props?.children].flat(Infinity).flatMap(nodes)];

function renderRental({ paid = false } = {}) {
  const jsx = (type, props) => ({ type, props });
  const noOp = () => {};
  const tenancy = {
    id: "tenancy", lease_start: "2026-10-20", lease_end: "2027-10-20", rent_due_day: 5,
    signed_lease_path: null,
    apartment: { id: "apartment", name: "Cozy Cove", apartment_images: [] },
    landlord: { first_name: "Test", last_name: "Owner" },
  };
  const Table = Object.assign(noOp, Object.fromEntries(
    ["ScrollContainer", "Content", "Header", "Column", "Body", "Row", "Cell"].map(name => [name, `Table.${name}`]),
  ));
  const modules = {
    react: { useState: initial => [initial, noOp], useMemo: fn => fn(), useEffect: noOp, useRef: value => ({ current: value }) },
    "react/jsx-runtime": { jsx, jsxs: jsx, Fragment: "Fragment" },
    "@heroui/react": {
      Button: "Button", Link: "Link", Spinner: "Spinner", Table,
      Modal: Object.fromEntries(["Backdrop", "Container", "Dialog", "Header", "Heading", "Body"].map(name => [name, `Modal.${name}`])),
      useOverlayState: () => ({ isOpen: false, setOpen: noOp }), toast: { info: noOp },
    },
    "@tabler/icons-react": new Proxy({}, { get: (_, key) => key }),
    "@repo/utils": {
      formatPesoDisplay: amount => `₱ ${amount}`,
      getCurrentRentStatus: () => ({ monthlyRent: 15500, isFullyPaid: paid, periodStart: "2026-11-01", dueDate: "2026-11-05" }),
      nextPaymentPeriod: () => ({ periodStart: "2026-12-01", dueDate: "2026-12-05" }),
    },
    "@/hooks/use-tenancy": { useTenancy: () => ({ tenancy, payments: [], loading: false, error: null, refetch: noOp }) },
    "@/hooks/use-tenant-applications": { useTenantApplications: () => ({ applications: [], loading: false, error: null }) },
    "@/hooks/use-maintenance-request-history": { useMaintenanceRequestHistory: () => ({ requests: [], loading: false, error: null }) },
    "@/hooks/use-signed-lease-viewer": { useSignedLeaseViewer: () => ({ viewSignedLease: noOp, viewing: false }) },
    "../maintenance/data/maintenance-data": { CATEGORIES: [] },
  };
  const compiled = ts.transpileModule(componentSource("page.tsx"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const context = { exports: {}, require: name => modules[name] ?? { default: name } };
  vm.runInNewContext(compiled, context);
  return nodes(context.exports.default());
}

test("quick action links and button fill the same equal-height grid cells", () => {
  const all = renderRental();
  const grid = all.find(node => node.props.className?.includes("rental-quick-actions"));
  assert.match(grid.props.className, /auto-rows-fr/);
  assert.match(grid.props.className, /@min-\[28rem\]\/dashboard:grid-cols-2/);
  assert.match(grid.props.className, /@min-\[44rem\]\/dashboard:grid-cols-4/);
  const tiles = grid.props.children;
  assert.equal(tiles.length, 4);
  assert.equal(tiles[1].type, "button", "signed lease remains an action rather than navigation");
  assert.equal(typeof tiles[1].props.onClick, "function");
  assert.equal(tiles[0].props.href, "/tenant/browse/apartment");
  assert.equal(tiles[2].props.href, "/tenant/payment/history");
  assert.equal(tiles[3].props.href, "/tenant/maintenance");
  for (const tile of tiles) {
    assert.match(tile.props.className, /h-full min-h-20 w-full min-w-0/);
    assert.match(tile.props.className, /focus-visible:outline-2/);
    assert.equal(tile.props.children.type, "Fragment", "content is directly inside each tile, not a shrink-wrapped inner box");
  }
});

test("paid and unpaid layouts respond to content width and contain table scrolling", () => {
  for (const paid of [false, true]) {
    const all = renderRental({ paid });
    assert.ok(all.some(node => node.props.className?.includes("@container/rental")));
    assert.equal(all.filter(node => node.props.className?.includes("@min-[64rem]/rental:grid-cols-[minmax(0,2fr)_minmax(20rem,1fr)]")).length, 2);
    assert.ok(all.some(node => node.props.className?.includes("@container/rent")));
    const scroll = all.find(node => node.type === "Table.ScrollContainer");
    assert.match(scroll.props.className, /max-w-full overflow-x-auto/);
    assert.match(all.find(node => node.type === "Table.Content").props.className, /min-w-\[32rem\]/);
    assert.ok(all.some(node => node.props.className?.includes(paid ? "@min-[32rem]/rent:grid-cols-2" : "@min-[36rem]/rent:grid-cols-3")));
  }
});

test("loading states mirror container-based card and quick action layouts", () => {
  const skeleton = componentSource("components/MyRentalSkeleton.tsx");
  assert.ok(skeleton.includes("@container/rental"));
  for (const rule of ["@min-[64rem]/rental:grid-cols-[minmax(0,2fr)_minmax(20rem,1fr)]", "@min-[28rem]/dashboard:grid-cols-2", "@min-[44rem]/dashboard:grid-cols-4"]) {
    assert.ok(skeleton.includes(rule), `skeleton retains ${rule}`);
  }
  assert.match(componentSource("components/DashboardCard.tsx"), /@container\/dashboard min-w-0/);
  assert.match(componentSource("components/MiniCalendar.tsx"), /mx-auto w-full max-w-sm/);
  assert.match(componentSource("components/MiniCalendar.tsx"), /aspect-square w-full max-w-10/);
});
