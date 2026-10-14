import { getChatApartmentRoute, getChatProfileRoute, getOtherPartyLabel } from "./chatRoutes";

describe("chat routes", () => {
  it("opens the landlord profile from the tenant portal, keeping the apartment", () => {
    expect(getChatProfileRoute("tenant", "user-2", "apt-1")).toEqual({
      pathname: "/profile/landlord/[landlordId]",
      params: { landlordId: "user-2", apartmentId: "apt-1" },
    });
  });

  it("opens the tenant profile from the landlord portal without an apartment", () => {
    expect(getChatProfileRoute("landlord", "user-3", null)).toEqual({
      pathname: "/profile/tenant/[tenantId]",
      params: { tenantId: "user-3" },
    });
  });

  it("opens the listing for tenants and the management page for landlords", () => {
    expect(getChatApartmentRoute("tenant", "apt-1").pathname).toBe("/apartment/[apartmentId]");
    expect(getChatApartmentRoute("landlord", "apt-1").pathname).toBe(
      "/landlord/manage-apartment/[apartmentId]"
    );
  });

  it("labels the other person by the viewer's portal", () => {
    expect(getOtherPartyLabel("tenant")).toBe("Landlord");
    expect(getOtherPartyLabel("landlord")).toBe("Tenant");
  });
});
