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
  id: "stay-a", apartment_id: "apartment-a", lease_start: "2026-07-24", lease_end: null, reviews: [],
  apartment: { id: "apartment-a", name: "Cozy Cove", is_hidden_by_admin: false, deleted_at: null },
};

beforeEach(() => { jest.clearAllMocks(); mockQuery.data = []; mockQuery.error = null; mockReadDismissals.mockResolvedValue(new Set()); });

it("selects the newest eligible, visible, unreviewed, undismissed stay", () => {
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

it("supports array embeds, missing names and ended short stays", () => {
  expect(selectReviewUnlockCandidate([{ ...stay, lease_start: "2026-10-20", lease_end: "2026-10-24", apartment: [{ id: "apartment-a", name: " ", is_hidden_by_admin: false, deleted_at: null }] }], new Set(), now)?.apartmentName).toBe("your apartment");
});

it("uses one bounded, account-scoped tenancy query and one batched dismissal read", async () => {
  mockQuery.data = [stay];
  const controller = new AbortController();
  expect((await fetchReviewUnlock("auth-a", "tenant-a", controller.signal))?.tenancyId).toBe("stay-a");
  expect(mockQuery.eq).toHaveBeenCalledWith("tenant_id", "tenant-a");
  expect(mockQuery.limit).toHaveBeenCalledWith(REVIEW_UNLOCK_LIMIT);
  expect(mockQuery.abortSignal).toHaveBeenCalledWith(controller.signal);
  expect(mockReadDismissals).toHaveBeenCalledWith("auth-a", ["stay-a"]);
  mockQuery.error = new Error("denied");
  await expect(fetchReviewUnlock("auth-a", "tenant-a")).rejects.toThrow("denied");
});

it("manual review eligibility now applies the same stay rule", async () => {
  mockQuery.data = [
    { id: "too-soon", lease_start: "2099-01-01", lease_end: null, reviews: [] },
    { id: "already-reviewed", lease_start: "2020-01-01", lease_end: null, reviews: [{ id: "review" }] },
    { id: "eligible", lease_start: "2020-01-01", lease_end: null, reviews: [] },
  ];
  expect(await fetchReviewEligibility("apartment-a", "tenant-a")).toBe("eligible");
  expect(mockQuery.select).toHaveBeenCalledWith("id, lease_start, lease_end, reviews(id)");
});
