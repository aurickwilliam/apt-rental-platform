import { buildApartmentShareMessage } from "./apartmentShare";

const apartment = { id: "apt-1", name: "Sunrise Flats", city: "Caloocan", monthly_rent: 12000 };

describe("buildApartmentShareMessage", () => {
  it("includes name, city and rent", () => {
    const message = buildApartmentShareMessage(apartment);
    expect(message).toContain("Sunrise Flats");
    expect(message).toContain("Caloocan");
    expect(message).toContain("/month");
  });

  it("adds the web link only when a base URL is configured", () => {
    expect(buildApartmentShareMessage(apartment, null)).not.toContain("http");
    expect(buildApartmentShareMessage(apartment, "https://apt.example/")).toContain(
      "https://apt.example/browse/apt-1",
    );
  });

  it("falls back when the name is missing", () => {
    expect(buildApartmentShareMessage({ id: "x" }, null)).toBe("Check out an apartment on APT");
  });
});
