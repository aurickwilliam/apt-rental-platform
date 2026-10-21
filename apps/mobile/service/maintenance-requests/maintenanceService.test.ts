import { mapRow } from "./maintenanceService";

jest.mock("@repo/supabase", () => ({ supabase: {} }));
jest.mock("@/service/media/privateMediaResolver", () => ({
  resolvePrivateMediaUrls: jest.fn(async () => ({ urls: {}, error: null })),
}));

it.each(["pending", "paid", "waived"])("retains tenant fee state %s", async (status) => {
  const row = await mapRow({ id: "request-1", status: "resolved", image_urls: [], fee_amount: "1250.50", fee_status: status, tenancy_id: "tenancy-1" });
  expect(row).toMatchObject({ fee_amount: 1250.50, fee_status: status, tenancy_id: "tenancy-1", status: "Resolved" });
});

it("represents an uncharged request without inventing a fee", async () => {
  expect(await mapRow({ status: "pending", image_urls: [] })).toMatchObject({ fee_amount: null, fee_status: null, tenancy_id: null });
});
