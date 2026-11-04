import { supabase } from "@repo/supabase";

import { submitReport } from "./reportService";

jest.mock("@repo/supabase", () => ({ supabase: { rpc: jest.fn() } }));

const rpc = supabase.rpc as unknown as jest.Mock;

describe("submitReport", () => {
  beforeEach(() => {
    rpc.mockReset();
    rpc.mockResolvedValue({ error: null });
  });

  it("reports an apartment through report_apartment with trimmed details", async () => {
    await submitReport({
      target: { kind: "apartment", apartmentId: "apt-1" },
      reason: "fake_listing",
      details: "  not real  ",
    });

    expect(rpc).toHaveBeenCalledWith("report_apartment", {
      p_apartment_id: "apt-1",
      p_reason: "fake_listing",
      p_details: "not real",
    });
  });

  it("reports a profile through report_profile and omits empty details", async () => {
    await submitReport({
      target: { kind: "profile", userId: "user-1", role: "landlord" },
      reason: "scam",
      details: "   ",
    });

    expect(rpc).toHaveBeenCalledWith("report_profile", {
      p_reported_user_id: "user-1",
      p_target_type: "landlord",
      p_reason: "scam",
      p_details: undefined,
    });
  });

  it("throws the database error so the dialog can show it", async () => {
    const databaseError = { message: "You already reported this listing. Our team is reviewing it." };
    rpc.mockResolvedValue({ error: databaseError });

    await expect(
      submitReport({ target: { kind: "apartment", apartmentId: "apt-1" }, reason: "scam", details: "" }),
    ).rejects.toBe(databaseError);
  });
});
