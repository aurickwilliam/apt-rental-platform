import { createElement, useSyncExternalStore } from "react";

export const AUTH_ID = "00000000-0000-4000-8000-000000000001";
export const TENANT_ID = "00000000-0000-4000-8000-000000000002";
const query = new URLSearchParams(location.search);
const listeners = new Set();
const notify = () => listeners.forEach(listener => listener());
const subscribe = listener => { listeners.add(listener); return () => listeners.delete(listener); };
export const photo = "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500"><rect width="800" height="500" fill="#dee8fc"/><path d="M150 300L400 100L650 300V460H150Z" fill="#94b3f9"/></svg>');
const apartment = {
  id: "00000000-0000-4000-8000-000000000010", name: "Sunrise Apartment with a Long Readable Name", street_address: "123 Example Street", barangay: "Longos", city: "Malabon", province: "Metro Manila", zip_code: 1470,
  apartment_images: query.has("noimages") ? [] : [{ url: photo, is_cover: true }], monthly_rent: 10000,
};
export const rental = { id: "00000000-0000-4000-8000-000000000020", status: "active", lease_start: "2020-01-01", lease_end: null, rent_due_day: 5, monthly_rent: 10000, apartment, landlord: { id: "landlord", first_name: "Local", last_name: "Owner" }, signed_lease_path: null };
export const rentals = query.get("case") === "none" ? [] : query.get("case") === "multiple" ? [rental, { ...rental, id: "00000000-0000-4000-8000-000000000021", apartment: { ...apartment, id: "00000000-0000-4000-8000-000000000011", name: "Second Apartment" } }] : [rental];
const statuses = query.get("status") ? [query.get("status")] : ["pending", "approved", "rejected", "cancelled", "closed"];
export const applications = query.has("empty") ? [] : statuses.map((status, i) => ({ id: `application-${i}`, apartment_id: apartment.id, status, created_at: `2026-10-${String(20 + i).padStart(2, "0")}T00:00:00Z`,
  apartments: { ...apartment, name: `${apartment.name} ${i + 1}` }, occupation: "Engineer", employer_name: "Local Company", employment_type: "Full-time", monthly_income: 30000, move_in_date: "2026-11-01", no_occupants: 2, has_pets: false, has_smoker: false, need_parking: false, message: "A local synthetic application.", documents: [] }));
export const requests = query.has("empty") ? [] : ["Pending", "In Progress", "Resolved", "Cancelled"].map((status, i) => ({ id: `request-${i}`, title: `Plumbing issue ${i + 1}`, apartment_name: i ? "Previous apartment" : apartment.name, apartment_id: apartment.id, tenant_id: TENANT_ID, landlord_id: "landlord", category: "plumbing_water_fixtures", message: "Water is leaking under the kitchen sink. Please inspect the fixture.", urgency: "medium", status, created_at: "2026-11-01T00:00:00Z", image_paths: [], image_urls: [], resolution_notes: status === "Resolved" ? "The leaking pipe was replaced." : null, resolved_at: status === "Resolved" ? "2026-11-02T00:00:00Z" : null }));
let state = { applications, requests, revision: 0 };
function useFixture() { return useSyncExternalStore(subscribe, () => state, () => state); }
function update(next) { state = { ...state, ...next, revision: state.revision + 1 }; notify(); }
const identity = { authUserId: AUTH_ID, generation: 0 };
const navigation = [];
let pendingCancel;
window.fixture = { navigation, cancellations: 0, submissions: [], resolveCancellation(success) {
  if (!pendingCancel) return;
  const { resolve, reject } = pendingCancel; pendingCancel = null;
  if (success) { update({ applications: state.applications.map(app => ({ ...app, status: "cancelled" })) }); resolve(); }
  else reject(new Error("Synthetic cancellation failed"));
} };
function navigate(href) { navigation.push(href); document.getElementById("fixture-actions").textContent = href; }
const screen = query.get("screen") || "applications";
export function useRouter() { return { push: navigate, replace: navigate, back: () => navigate("back"), prefetch() {} }; }
export function useParams() { return { applicationId: "application-0" }; }
function urlSubscribe(listener) { addEventListener("fixture-url", listener); return () => removeEventListener("fixture-url", listener); }
const originalReplace = history.replaceState.bind(history);
history.replaceState = (...args) => { originalReplace(...args); dispatchEvent(new Event("fixture-url")); };
export function useSearchParams() {
  const value = useSyncExternalStore(urlSubscribe, () => location.search, () => "");
  return new URLSearchParams(value);
}
export function useAuthIdentity() { return identity; }
export function useTenantApplications(_tenant, applicationId) {
  const value = useFixture();
  return { applications: applicationId ? value.applications.filter(app => app.id === applicationId) : value.applications, tenantId: TENANT_ID, loading: false, error: null };
}
export function useApplicantPersonalInfo() { return { personalInfo: { fullName: "Synthetic Tenant", email: "tenant@example.test", dateOfBirth: "1996-01-01", contactNumber: "09171234567", currentAddress: "Example address" }, loading: false }; }
export function useVisitRequest() {
  const status = query.get("visit");
  return { visitRequest: status ? { id: "visit", status, visit_date: "2026-11-10", time: "10:00", no_visitors: 2, created_at: "2026-11-01", notes: "Local visit request" } : null, history: [], loading: false, error: null, revalidate: async () => true };
}
export async function cancelTenantApplication() { window.fixture.cancellations++; return new Promise((resolve, reject) => { pendingCancel = { resolve, reject }; }); }
export function useRespondToReschedule() { return { accept: async () => ({ error: null }), decline: async () => ({ error: null }), loading: false }; }
export function useApplicationDocumentUrls() { return { loading: false, error: null, resolved: [] }; }
export function useSignedLeaseViewer() { return { viewing: false, viewSignedLease: async () => null }; }
export function useMaintenancePhotoUrls() { return { loading: false, error: null, urls: {} }; }
export function useMaintenanceRequestHistory() {
  const value = useFixture();
  return { requests: value.requests, loading: false, error: null, refresh() {}, cancellingId: null, cancelRequest: async id => { update({ requests: state.requests.map(request => request.id === id ? { ...request, status: "Cancelled" } : request) }); return { success: true }; } };
}
export function canCancelMaintenanceRequest(status) { return status === "Pending" || status === "In Progress"; }
export function useSubmitMaintenanceRequest() {
  return { isSubmitting: false, submit: async args => {
    if (!rentals.some(item => item.id === args.tenancyId && item.apartment.id === args.apartmentId)) return { success: false, error: "Unrelated rental" };
    window.fixture.submissions.push(args);
    return { success: true, requestId: "synthetic-request" };
  } };
}
export function useTenancy() {
  return { tenancy: rentals.length ? { ...rental, bill: { kind: "fees", totalDue: 0, fees: [], rentPaid: true } } : null, payments: [], loading: false, error: null, financeLoading: false, financeError: null, paymentError: null, revalidate: async () => true };
}
export function getTenantContext() { throw new Error("Unexpected identity request in a seeded fixture"); }
export function createClient() { throw new Error("Network access is disabled in this fixture"); }
export function formatPesoDisplay(value) { return `₱ ${Number(value || 0).toLocaleString("en-PH")}`; }
export function formatDate(value) { return new Date(value).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" }); }
export function getCurrentRentStatus() { return { monthlyRent: 10000, isFullyPaid: true, periodStart: "2026-11-01", dueDate: "2026-11-05" }; }
export function nextPaymentPeriod() { return { periodStart: "2026-12-01", dueDate: "2026-12-05" }; }
export const nextUnpaidRentPeriod = nextPaymentPeriod;
export function FixtureLink({ href, children, onClick, ...props }) { return <a href={href} {...props} onClick={event => { event.preventDefault(); onClick?.(event); navigate(href); }}>{children}</a>; }
export function FixtureImage({ priority, fill, alt = "", ...props }) {
  void priority;
  return createElement("img", { ...props, alt, style: fill ? { position: "absolute", inset: 0, width: "100%", height: "100%", ...props.style } : props.style });
}
export { screen };
