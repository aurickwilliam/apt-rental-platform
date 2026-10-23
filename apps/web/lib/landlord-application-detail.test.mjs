import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";
import { buildApplicationDocumentList } from "./application-documents.ts";

const compound = (name, parts) => Object.assign(() => {}, Object.fromEntries(parts.map(part => [part, `${name}.${part}`])));
const Card = compound("Card", []);
const Modal = compound("Modal", ["Backdrop", "Container", "Dialog", "Header", "Heading", "Body", "Footer"]);
const baseApplication = {
  id: "application-one", tenant_id: "tenant-one", apartment_id: "property-one", status: "Applied", apartment_status: "available",
  tenant_name: "Sample Tenant", tenant_email: "sample@example.test", tenant_city: "Caloocan", tenant_mobile_number: "09123456789",
  apartment_name: "Cozy Cove", apartment_address: "123 Test St, Caloocan", apartment_thumbnail_url: "/cover.jpg", monthly_rent: 15000,
  created_at: "2026-10-14", move_in_date: "2026-10-20", no_occupants: 1, occupation: "", employer_name: "", employment_type: "Student",
  monthly_income: 0, has_pets: false, has_smoker: false, need_parking: true, prev_landlord_name: null, prev_landlord_contact: null,
  message: "A message from the applicant.", gov_id_url: "tenant-one/id/front.jpg", gov_id_back_url: "tenant-one/id/back.jpg",
  proof_of_income_url: null, proof_of_billing_url: null, nbi_clearance_url: null,
};

function harness(options = {}) {
  const application = options.application === null ? null : { ...baseApplication, ...options.application };
  const state = [];
  let cursor = 0;
  const approved = [];
  const rejected = [];
  const prefetched = [];
  const pushed = [];
  const opened = [];
  let retries = 0;
  const overlay = { isOpen: false, setOpen(value) { this.isOpen = value; } };
  const actions = {
    localStatus: null, actionLoading: false, isRejectDialogOpen: false, errorMessage: null,
    approve: id => { approved.push(id); },
    reject: (id, reason) => { rejected.push([id, reason]); },
    openRejectDialog: () => { actions.isRejectDialogOpen = true; },
    closeRejectDialog: () => { actions.isRejectDialogOpen = false; },
    clearError: () => {},
    ...options.actions,
  };

  function load(file) {
    const jsx = (type, props, key) => ({ type, props, key });
    const dependencies = {
      "react/jsx-runtime": { jsx, jsxs: jsx, Fragment: "Fragment" },
      react: {
        useMemo: compute => compute(),
        useState: initial => { const index = cursor++; if (!(index in state)) state[index] = initial; return [state[index], value => { state[index] = value; }]; },
      },
      "next/image": { default: "Image" },
      "next/link": { default: "Link" },
      "next/navigation": { useParams: () => ({ applicationId: "application-one" }), useRouter: () => ({ push: href => pushed.push(href), prefetch: href => prefetched.push(href) }) },
      "@heroui/react": { Card, Modal, Button: "Button", Skeleton: "Skeleton", FieldError: "FieldError", Label: "Label", TextArea: "TextArea", TextField: "TextField", useOverlayState: () => overlay },
      "@tabler/icons-react": new Proxy({}, { get: (_, key) => key }),
      "@repo/utils": { formatDate: value => value, formatPesoDisplay: value => `PHP ${value}`, getInitials: () => "ST" },
      "@/app/components/display/StatusChip": { default: "StatusChip" },
      "@/app/components/profile/UserAvatar": { default: "UserAvatar" },
      "@/hooks/use-auth-identity": { useAuthIdentity: () => ({ authUserId: "auth-a", generation: 0 }) },
      "@/hooks/use-landlord-applications": { useLandlordApplications: () => ({ applications: application ? [application] : [], loading: options.loading ?? false, error: options.error ?? null, refresh: () => { retries += 1; }, revalidate: async () => true }) },
      "@/hooks/use-landlord-application-actions": { useLandlordApplicationActions: () => actions },
      "@/hooks/use-application-document-urls": { useApplicationDocumentUrls: entries => ({
        resolved: entries.filter(entry => entry.path).map(entry => ({ ...entry, signedUrl: options.documentsError ? null : `https://example.test/${entry.label}` })),
        loading: options.documentsLoading ?? false, error: options.documentsError ?? null,
      }) },
      "@/hooks/use-passport-verified-paths": { usePassportVerifiedPaths: () => new Set(options.verifiedPaths ?? []) },
      "@/lib/application-documents": { buildApplicationDocumentList },
      "../lib/application-status": { statusChipColor: () => "neutral" },
      "../lib/application-list": { applicationStatusLabel: status => status === "Applied" ? "Pending" : status },
      "./components/ApplicationDetailSection": { default: loadSection },
      "./ApplicationDetailSection": { default: loadSection },
      "./components/ApplicationDetailSkeleton": { default: loadSkeleton },
      "./components/ApplicationDetailShell": { default: loadShell },
      "./ApplicationDetailShell": { default: loadShell },
      "@/app/components/display/RouteLoadingStatus": { default: "RouteLoadingStatus" },
    };
    const source = readFileSync(new URL(`../app/landlord/applications/[applicationId]/${file}`, import.meta.url), "utf8");
    const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;
    const context = { exports: {}, window: { open: (...args) => opened.push(args) }, require: name => {
      assert.ok(name in dependencies, `Unexpected dependency: ${name}`);
      return dependencies[name];
    } };
    vm.runInNewContext(compiled, context);
    return context.exports;
  }
  function loadSection(props) { return load("components/ApplicationDetailSection.tsx").default(props); }
  function loadSkeleton() { return load("components/ApplicationDetailSkeleton.tsx").default(); }
  function loadShell(props) { return load("components/ApplicationDetailShell.tsx").default(props); }
  const Page = load("page.tsx").default;
  return { render: () => { cursor = 0; return nodes(Page()); }, load, approved, rejected, prefetched, pushed, opened, actions, retries: () => retries };
}

function nodes(element) {
  if (!element || typeof element !== "object") return [];
  const expand = typeof element.type === "function" && ["ApplicationDetailContent", "DetailField", "DocumentRow", "Sk", "loadSection", "loadShell", "loadSkeleton", "ApplicationFieldSkeleton"].includes(element.type.name);
  const children = expand ? element.type(element.props) : element.props?.children;
  return [element, ...[children].flat(Infinity).flatMap(nodes)];
}
const text = elements => elements.flatMap(element => [element.props?.children].flat(Infinity)).filter(value => typeof value === "string").join(" ");
const button = (elements, label) => elements.find(element => element.type === "Button" && text([element]).trim() === label);

test("Application details use one responsive set of cards, retain every field and show pending actions", () => {
  const h = harness();
  const elements = h.render();
  assert.equal(elements[0].key, "auth-a:0:application-one");
  assert.equal(elements.filter(element => element.type === "UserAvatar").length, 1);
  assert.equal(elements.filter(element => element.type.name === "DetailField").length, 13);
  assert.equal(elements.find(element => element.type === "Image").props.src, "/cover.jpg");
  assert.deepEqual(elements.filter(element => element.type === "h2").map(element => element.props.children), ["Property", "Applicant", "Application Details", "Employment", "Preferences", "Previous Landlord", "Documents", "Message", "Review Application"]);
  assert.ok(text(elements).includes("Not provided"));
  assert.ok(text(elements).includes("Pending"));
  assert.equal(button(elements, "Approve").props.isDisabled, false);
  button(elements, "Approve").props.onPress();
  assert.deepEqual(h.approved, ["application-one"]);
  const back = button(elements, "Back to Applications");
  back.props.onHoverStart(); back.props.onFocus(); back.props.onPress();
  assert.deepEqual(h.prefetched, ["/landlord/applications", "/landlord/applications"]);
  assert.deepEqual(h.pushed, ["/landlord/applications"]);
});

test("Documents and message share equal desktop columns in the page and loading skeleton", () => {
  const h = harness();
  for (const elements of [h.render(), nodes(h.load("components/ApplicationDetailSkeleton.tsx").default())]) {
    const grid = elements.find(element => element.props.className === "grid grid-cols-1 items-start gap-4 xl:grid-cols-2");
    assert.ok(grid);
    assert.deepEqual(Array.from(grid.props.children, child => child.props.title), ["Documents", "Message"]);
  }
});

test("Occupied pending units cannot be approved; settled statuses have no decision buttons", () => {
  const occupied = harness({ application: { apartment_status: "occupied" } }).render();
  assert.equal(button(occupied, "Approve").props.isDisabled, true);
  assert.equal(button(occupied, "Reject").props.isDisabled, false);
  assert.ok(text(occupied).includes("already occupied"));
  for (const status of ["Approved", "Rejected", "Cancelled"]) {
    const elements = harness({ application: { status, rejected_reason: status === "Rejected" ? "Incomplete documents" : null } }).render();
    assert.equal(button(elements, "Approve"), undefined);
    assert.equal(button(elements, "Reject"), undefined);
    if (status === "Rejected") assert.ok(text(elements).includes("Incomplete documents"));
  }
});

test("Reject retains its required reason, confirmation and original action hook", () => {
  const h = harness();
  button(h.render(), "Reject").props.onPress();
  button(h.render(), "Confirm Reject").props.onPress();
  assert.equal(h.rejected.length, 0);
  let elements = h.render();
  assert.ok(text(elements).includes("Please provide a reason for rejection."));
  elements.find(element => element.type === "TextField").props.onChange("  Incomplete documents  ");
  elements = h.render();
  button(elements, "Confirm Reject").props.onPress();
  assert.deepEqual(h.rejected, [["application-one", "Incomplete documents"]]);
});

test("Private document rows distinguish missing, loading and unavailable previews and retain verified ID front/back", () => {
  const h = harness({ verifiedPaths: [baseApplication.gov_id_url, baseApplication.gov_id_back_url] });
  const elements = h.render();
  assert.equal(elements.filter(element => element.type.name === "DocumentRow").length, 5);
  assert.equal(elements.filter(element => element.type === "StatusChip" && text(nodes(element)).includes("Verified")).length, 2);
  assert.ok(text(elements).includes("Not provided (optional)"));
  const view = elements.find(element => element.type === "Button" && element.props["aria-label"] === "View Government ID");
  assert.equal(view.props.isDisabled, false);
  view.props.onPress();
  assert.equal(h.opened[0][2], "noopener,noreferrer");
  const missing = elements.find(element => element.type === "Button" && element.props["aria-label"] === "View Proof of Income");
  assert.equal(missing.props.isDisabled, true);
  const loading = harness({ documentsLoading: true }).render();
  assert.ok(text(loading).includes("Preparing secure preview"));
  assert.ok(loading.filter(element => element.type === "Button" && element.props["aria-label"]?.startsWith("View ")).every(element => element.props.isDisabled));
  const failed = harness({ documentsError: "Unable to access private documents." }).render();
  assert.ok(text(failed).includes("Document preview unavailable"));
  assert.ok(failed.some(element => element.props.role === "alert"));
});

test("Route keeps the detail shell, client owns the body skeleton, and failures offer Retry", () => {
  const h = harness({ loading: true });
  const elements = h.render();
  assert.ok(elements.some(element => element.props["aria-label"] === "Loading application details" && element.props["aria-busy"] === "true"));
  assert.equal(elements.filter(element => element.type === "h2").length, 8);
  assert.ok(elements.filter(element => element.type === "Skeleton").every(element => element.props.className.includes("bg-skeleton!")));
  assert.equal(button(elements, "Approve"), undefined);
  const boundary = nodes(h.load("loading.tsx").default());
  assert.ok(text(boundary).includes("Application Details"));
  assert.equal(boundary.filter(element => element.type === "Skeleton").length, 0);
  assert.ok(boundary.some(element => element.type === "RouteLoadingStatus"));
  const failed = harness({ error: "Unable to load applications" });
  const failure = failed.render();
  assert.ok(text(failure).includes("Could not load application"));
  assert.ok(!text(failure).includes("Application not found"));
  button(failure, "Try Again").props.onPress();
  assert.equal(failed.retries(), 1);
  assert.ok(text(harness({ application: null }).render()).includes("Application not found"));
});
