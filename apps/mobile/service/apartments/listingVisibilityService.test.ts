import { supabase } from "@repo/supabase";
import { usePortalStore } from "@/stores/usePortalStore";
import { changeListingVisibility, type ListingVisibilityRequest } from "./listingVisibilityService";

jest.mock("@repo/supabase", () => ({ supabase: { auth: { getSession: jest.fn() }, from: jest.fn() } }));
jest.mock("@/stores/usePortalStore", () => ({ usePortalStore: { getState: jest.fn() } }));

const from = supabase.from as jest.Mock;
const session = supabase.auth.getSession as jest.Mock;
const scope = usePortalStore.getState as jest.Mock;
const request = (overrides: Partial<ListingVisibilityRequest> = {}): ListingVisibilityRequest => ({
  apartmentId: "apartment", ownerId: "owner", authUserId: "auth", currentStatus: "available", isCurrent: () => true, ...overrides,
});
const query = { update: jest.fn(), eq: jest.fn(), is: jest.fn(), select: jest.fn(), maybeSingle: jest.fn() };
beforeEach(() => {
  jest.clearAllMocks();
  session.mockResolvedValue({ data: { session: { user: { id: "auth" } } }, error: null });
  scope.mockReturnValue({ authUserId: "auth", portal: "landlord", loading: false });
  from.mockReturnValue(query);
  for (const method of [query.update, query.eq, query.is, query.select]) method.mockReturnValue(query);
  query.maybeSingle.mockResolvedValue({ data: { status: "under_maintenance" }, error: null });
});

it("hides only the owner's unchanged non-deleted property without writing admin moderation", async () => {
  await expect(changeListingVisibility(request())).resolves.toBe("under_maintenance");
  expect(from).toHaveBeenCalledWith("apartments");
  expect(query.update).toHaveBeenCalledWith({ status: "under_maintenance" });
  expect(query.eq.mock.calls).toEqual([["id", "apartment"], ["landlord_id", "owner"], ["status", "available"]]);
  expect(query.is).toHaveBeenCalledWith("deleted_at", null);
  expect(query.select).toHaveBeenCalledWith("status");
});
it("restores only under-maintenance properties", async () => {
  query.maybeSingle.mockResolvedValue({ data: { status: "available" }, error: null });
  await expect(changeListingVisibility(request({ currentStatus: "under_maintenance" }))).resolves.toBe("available");
  expect(query.eq).toHaveBeenCalledWith("status", "under_maintenance");
  expect(query.update).toHaveBeenCalledWith({ status: "available" });
});
it("surfaces the database's active-tenancy or verification refusal verbatim", async () => {
  const error = { message: "This property has an active tenancy." };
  query.maybeSingle.mockResolvedValue({ data: null, error });
  await expect(changeListingVisibility(request())).rejects.toBe(error);
});
it("does not report success when the property changed, was deleted or is inaccessible", async () => {
  query.maybeSingle.mockResolvedValue({ data: null, error: null });
  await expect(changeListingVisibility(request())).rejects.toThrow("This property has changed");
});
it.each(["tenant", null])("refuses the %s portal before any write", async portal => {
  scope.mockReturnValue({ authUserId: "auth", portal, loading: false });
  await expect(changeListingVisibility(request())).rejects.toThrow("session has changed");
  expect(from).not.toHaveBeenCalled();
});
it("rejects a changed session or retired operation before any write", async () => {
  session.mockResolvedValue({ data: { session: { user: { id: "other" } } }, error: null });
  await expect(changeListingVisibility(request())).rejects.toThrow("session has changed");
  session.mockResolvedValue({ data: { session: { user: { id: "auth" } } }, error: null });
  await expect(changeListingVisibility(request({ isCurrent: () => false }))).rejects.toThrow("session has changed");
  expect(from).not.toHaveBeenCalled();
});
