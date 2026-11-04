import { supabase } from "@repo/supabase";

import { fetchListingReviewState, requestListingReview } from "./listingReviewService";

jest.mock("@repo/supabase", () => ({ supabase: { rpc: jest.fn() } }));

const rpc = supabase.rpc as unknown as jest.Mock;

describe("listingReviewService", () => {
  beforeEach(() => rpc.mockReset());

  it("parses the state returned by get_listing_review_state", async () => {
    rpc.mockResolvedValue({
      data: { hidden: true, reason: "Fake photos", hiddenAt: null, request: { status: "open", note: "Fixed" } },
      error: null,
    });

    const state = await fetchListingReviewState("apt-1");

    expect(rpc).toHaveBeenCalledWith("get_listing_review_state", { p_apartment_id: "apt-1" });
    expect(state.hidden).toBe(true);
    expect(state.request?.status).toBe("open");
  });

  it("treats a null answer as not hidden", async () => {
    rpc.mockResolvedValue({ data: null, error: null });
    expect((await fetchListingReviewState("apt-1")).hidden).toBe(false);
  });

  it("sends the trimmed note and throws the database error", async () => {
    rpc.mockResolvedValue({ error: null });
    await requestListingReview("apt-1", "  fixed the price  ");
    expect(rpc).toHaveBeenCalledWith("request_listing_review", { p_apartment_id: "apt-1", p_note: "fixed the price" });

    const databaseError = { message: "You already asked for a review. Our team will answer soon." };
    rpc.mockResolvedValue({ error: databaseError });
    await expect(requestListingReview("apt-1", "again")).rejects.toBe(databaseError);
  });
});
