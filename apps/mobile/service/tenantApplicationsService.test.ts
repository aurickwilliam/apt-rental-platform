import { fetchTenantApplications } from "./tenantApplicationsService";
import { resolvePrivateMediaUrls } from "@/service/privateMediaResolver";

const mockFrom = jest.fn();

jest.mock("@repo/supabase", () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

jest.mock("@/service/privateMediaResolver", () => ({
  resolvePrivateMediaUrls: jest.fn(),
}));

const mockResolvePrivateMediaUrls = jest.mocked(resolvePrivateMediaUrls);

const applicationRow = {
  id: "application-1",
  status: "pending",
  created_at: "2026-01-01T00:00:00.000Z",
  rejected_reason: null,
  apartment_id: "apartment-1",
  occupation: "Engineer",
  employer_name: "APT",
  monthly_income: 50000,
  employment_type: "Full-time",
  prev_landlord_name: null,
  prev_landlord_contact: null,
  move_in_date: "2026-02-01",
  no_occupants: 1,
  has_pets: false,
  has_smoker: false,
  need_parking: false,
  message: null,
  gov_id_url: "tenant/shared-document.jpg",
  proof_of_income_url: "tenant/shared-document.jpg",
  proof_of_billing_url: null,
  nbi_clearance_url: null,
  apartments: { name: "APT Homes", monthly_rent: 12000 },
};

function createApplicationsQuery() {
  const query = {
    select: jest.fn(),
    eq: jest.fn(),
    order: jest.fn(),
  };
  query.select.mockReturnValue(query);
  query.eq.mockReturnValue(query);
  query.order.mockResolvedValue({ data: [applicationRow], error: null });
  return query;
}

describe("fetchTenantApplications", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFrom.mockReturnValue(createApplicationsQuery());
    mockResolvePrivateMediaUrls.mockResolvedValue({
      urls: { "tenant/shared-document.jpg": "https://signed.example.test/document.jpg" },
      error: null,
    });
  });

  it("resolves documents via the shared resolver, preserving duplicate rows and order", async () => {
    const applications = await fetchTenantApplications("tenant-1");

    expect(mockFrom).toHaveBeenCalledWith("rental_application");
    expect(mockResolvePrivateMediaUrls).toHaveBeenCalledWith("application-documents", [
      "tenant/shared-document.jpg",
      "tenant/shared-document.jpg",
    ]);
    expect(applications[0]?.documents).toEqual([
      {
        label: "Government ID",
        path: "tenant/shared-document.jpg",
        signedUrl: "https://signed.example.test/document.jpg",
      },
      {
        label: "Proof of Income",
        path: "tenant/shared-document.jpg",
        signedUrl: "https://signed.example.test/document.jpg",
      },
    ]);
    expect(applications[0]).toMatchObject({
      id: "application-1",
      status: "pending",
      occupation: "Engineer",
    });
    expect("gov_id_url" in applications[0]!).toBe(false);
  });

  it("degrades gracefully when the resolver reports an error", async () => {
    mockResolvePrivateMediaUrls.mockResolvedValue({
      urls: { "tenant/shared-document.jpg": null },
      error: "Unable to access private media.",
    });

    const applications = await fetchTenantApplications("tenant-1");

    expect(applications[0]?.documents[0]?.signedUrl).toBeNull();
    expect(applications).toHaveLength(1);
  });

  it("throws when the application fetch fails", async () => {
    mockFrom.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({ data: null, error: { message: "RLS blocked" } }),
    });

    await expect(fetchTenantApplications("tenant-1")).rejects.toThrow("RLS blocked");
  });
});