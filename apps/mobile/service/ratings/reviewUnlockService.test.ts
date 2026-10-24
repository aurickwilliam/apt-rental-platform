import { fetchReviewUnlock, REVIEW_UNLOCK_LIMIT, selectReviewUnlockCandidate, type ReviewUnlockStay } from "./reviewUnlockService";
import { fetchReviewEligibility } from "./reviewsService";

const mockQuery = {
  select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(), limit: jest.fn().mockReturnThis(), abortSignal: jest.fn().mockReturnThis(),
  data: [] as unknown[], error: null as unknown,
};
jest.mock("@repo/supabase", () => ({ supabase: { from: () => mockQuery } }));
const mockReadDismissals = jest.fn();
jest.mock("./reviewUnlockStorage", () => ({ readReviewUnlockDismissals: (...args: unknown[]) => mockReadDismissals(...args) }));

const now = new Date("2026-10-24T12:00:00Z");
const stay: ReviewUnlockStay = {
  id: "stay-a", apartment_id: "apartment-a", status: "active", lease_start: "2026-07-24", lease_end: null, reviews: [],
  apartment: { id: "apartment-a", name: "Cozy Cove", is_hidden_by_admin: false, deleted_at: null },
};

beforeEach(() => { jest.clearAllMocks(); mockQuery.data = []; mockQuery.error = null; mockReadDismissals.mockResolvedValue(new Set()); });

it("selects an eligible, visible, unreviewed, undismissed active stay", () => {
  const hidden = { ...stay, apartment: { ...stay.apartment as object, is_hidden_by_admin: true } } as ReviewUnlockStay;
  const deleted = { ...stay, apartment: { ...stay.apartment as object, deleted_at: "2026-10-01" } } as ReviewUnlockStay;
  const rows: ReviewUnlockStay[] = [
    { ...stay, lease_start: "2026-10-20" }, hidden, deleted,
    { ...stay, apartment: null }, { ...stay, reviews: [{ id: "review" }] },
    { ...stay, id: "dismissed" }, stay,
  ];
  expect(selectReviewUnlockCandidate(rows, new Set(["dismissed"]), now)).toEqual({ tenancyId: "stay-a", apartmentId: "apartment-a", apartmentName: "Cozy Cove" });
  expect(selectReviewUnlockCandidate(rows.slice(0, -1), new Set(["dismissed"]), now)).toBeNull();
});

it("supports array embeds, missing names and an active record whose lease end has passed", () => {
  expect(selectReviewUnlockCandidate([{ ...stay, lease_start: "2026-10-20", lease_end: "2026-10-24", apartment: [{ id: "apartment-a", name: " ", is_hidden_by_admin: false, deleted_at: null }] }], new Set(), now)?.apartmentName).toBe("your apartment");
});

it("uses one bounded, account-scoped tenancy query and one batched dismissal read", async () => {
  mockQuery.data = [stay];
  const controller = new AbortController();
  expect((await fetchReviewUnlock("auth-a", "tenant-a", controller.signal))?.tenancyId).toBe("stay-a");
  expect(mockQuery.eq).toHaveBeenCalledWith("tenant_id", "tenant-a");
  expect(mockQuery.eq).toHaveBeenCalledWith("status", "active");
  expect(mockQuery.select).toHaveBeenCalledWith(expect.stringContaining("apartment_id, status, lease_start"));
  expect(mockQuery.limit).toHaveBeenCalledWith(REVIEW_UNLOCK_LIMIT);
  expect(mockQuery.abortSignal).toHaveBeenCalledWith(controller.signal);
  expect(mockReadDismissals).toHaveBeenCalledWith("auth-a", ["stay-a"]);
  mockQuery.error = new Error("denied");
  await expect(fetchReviewUnlock("auth-a", "tenant-a")).rejects.toThrow("denied");
});

const pastStay: ReviewUnlockStay = {
  ...stay, id: "past-stay", apartment_id: "past-apartment", status: "ended",
  lease_start: "2025-01-01", lease_end: "2025-08-01",
  apartment: { id: "past-apartment", name: "Arkong Bato 1BR", is_hidden_by_admin: false, deleted_at: null },
};

it("shows Cozy Cove, never Arkong Bato, even when the historical row is first", () => {
  expect(selectReviewUnlockCandidate([pastStay, stay], new Set(), now)).toEqual({
    tenancyId: "stay-a", apartmentId: "apartment-a", apartmentName: "Cozy Cove",
  });
});

it.each([
  { reason: "too recent", active: { ...stay, lease_start: "2026-10-21" }, dismissed: new Set<string>() },
  { reason: "already reviewed", active: { ...stay, reviews: [{ id: "review" }] }, dismissed: new Set<string>() },
  { reason: "dismissed", active: stay, dismissed: new Set(["stay-a"]) },
])("never falls back to Arkong Bato when the active rental is $reason", ({ active, dismissed }) => {
  expect(selectReviewUnlockCandidate([active, pastStay], dismissed, now)).toBeNull();
});

it("does not prompt when only ended or other non-active tenancies exist", () => {
  expect(selectReviewUnlockCandidate([pastStay, { ...stay, status: "cancelled" }], new Set(), now)).toBeNull();
});

it("manual review eligibility keeps past stays available under the same duration rule", async () => {
  mockQuery.data = [
    { id: "too-soon", lease_start: "2099-01-01", lease_end: null, reviews: [] },
    { id: "already-reviewed", lease_start: "2020-01-01", lease_end: null, reviews: [{ id: "review" }] },
    { id: "eligible", status: "ended", lease_start: "2020-01-01", lease_end: "2020-08-01", reviews: [] },
  ];
  expect(await fetchReviewEligibility("apartment-a", "tenant-a")).toEqual({ reviewableTenancyId: "eligible", stayLocked: false });
  expect(mockQuery.select).toHaveBeenCalledWith("id, lease_start, lease_end, reviews(id)");
  expect(mockQuery.eq).not.toHaveBeenCalledWith("status", "active");
});

it("reports a locked stay only when an unreviewed stay is too recent", async () => {
  mockQuery.data = [{ id: "too-soon", lease_start: "2099-01-01", lease_end: null, reviews: [] }];
  expect(await fetchReviewEligibility("apartment-a", "tenant-a")).toEqual({ reviewableTenancyId: null, stayLocked: true });
});

it.each([
  { reason: "no stays", rows: [] },
  { reason: "already-reviewed stays", rows: [{ id: "reviewed", lease_start: "2020-01-01", lease_end: null, reviews: [{ id: "review" }] }] },
])(
  "does not report a locked stay for $reason", async ({ rows }) => {
    mockQuery.data = rows;
    expect(await fetchReviewEligibility("apartment-a", "tenant-a")).toEqual({ reviewableTenancyId: null, stayLocked: false });
  }
);

it("does not treat an eligibility request failure as a locked stay", async () => {
  mockQuery.error = new Error("denied");
  await expect(fetchReviewEligibility("apartment-a", "tenant-a")).rejects.toThrow("denied");
});
