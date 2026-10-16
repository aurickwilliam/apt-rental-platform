import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const jsx = (type, props) => ({ type, props });
const nodes = element => !element || typeof element !== "object" ? [] :
  [element, ...[element.props?.children].flat(Infinity).flatMap(nodes)];
const Card = Object.assign(() => {}, { Header: "Header", Title: "Title", Content: "Content", Footer: "Footer" });
function load(name, overrides = {}, globals = {}) {
  const modules = {
    react: { useState: initial => [initial, () => {}] },
    "react/jsx-runtime": { jsx, jsxs: jsx },
    "next/navigation": { useRouter: () => ({ push: () => assert.fail("preview navigated") }) },
    "next/dynamic": { default: () => "ApplyModal" },
    "@heroui/react": { Card, Button: "Button", Separator: "Separator", Modal: Object.assign(() => {}, { Backdrop: "Backdrop", Container: "Container", Dialog: "Dialog", CloseTrigger: "Close", Header: "Header", Heading: "Heading", Body: "Body", Footer: "Footer" }), useOverlayState: () => ({ isOpen: false, open() {}, close() {}, setOpen() {} }) },
    "@repo/utils": { formatPesoDisplay: value => `₱ ${value}` },
    "@tabler/icons-react": { IconFlag: "Flag", IconFileText: "File" },
    "./MaintenanceHistoryButton": { default: "Maintenance" },
    "@/lib/apartment-availability": { isApartmentUnavailable: () => false },
    ...overrides,
  };
  const context = { exports: {}, require: key => modules[key], ...globals };
  vm.runInNewContext(ts.transpileModule(readFileSync(new URL(`../app/browse/[apartmentId]/components/${name}.tsx`, import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText, context);
  return context.exports.default;
}

test("PriceCard preview disables tenant actions and omits mobile fixed bar", () => {
  const PriceCard = load("PriceCard");
  const props = { price: 5000, securityDeposit: 10000, advancePayment: 5000 };
  const preview = nodes(PriceCard({ ...props, isPreview: true }));
  const actions = preview.filter(node => node.type === "Button" && ["Apply Now", "Report"].includes(node.props.children));
  // Report includes an icon, so find it by its fullWidth prop as well.
  const footer = preview.find(node => node.type === "Footer");
  assert.equal(nodes(footer).filter(node => node.type === "Button" && node.props.isDisabled).length, 2);
  actions[0].props.onPress();
  assert.ok(!preview.some(node => node.props?.className?.includes("fixed")));
  assert.ok(preview.some(node => node.props?.children === "₱ 20000"));
  assert.ok(nodes(PriceCard(props)).some(node => node.props?.className?.includes("fixed")), "published layout is unchanged");
});

test("local draft leases never initialize Supabase or an external document viewer", async () => {
  const revoked = [];
  const opened = [];
  const downloads = [];
  const cleanups = [];
  const Lease = load("LeaseAgreementCard", {
    react: { useState: initial => [initial, () => {}], useRef: () => ({ current: null }), useEffect: fn => cleanups.push(fn()) },
    "@repo/supabase": { createBrowserClient: () => assert.fail("draft lease made a backend call") },
  }, {
    URL: { createObjectURL: () => "blob:local-lease", revokeObjectURL: url => revoked.push(url) },
    window: { open: url => opened.push(url) },
    document: { createElement: () => { const link = { click() { downloads.push(link.download); } }; return link; } },
  });
  for (const name of ["lease.pdf", "lease.docx"]) {
    const tree = nodes(Lease({ leaseDetailsUrl: "", localFile: { name } }));
    await tree.find(node => node.type === "Button").props.onPress();
  }
  assert.deepEqual(opened, ["blob:local-lease"]);
  assert.deepEqual(downloads, ["lease.docx"]);
  cleanups.forEach(cleanup => cleanup());
  assert.deepEqual(revoked, ["blob:local-lease", "blob:local-lease"]);
});
