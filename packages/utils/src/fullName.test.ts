import { joinFullName, splitFullName } from "./fullName";

describe("splitFullName", () => {
  it("splits a two-word name into first and last", () => {
    expect(splitFullName("A Person")).toEqual({ firstName: "A", lastName: "Person" });
  });

  it("keeps every given name before the surname", () => {
    expect(splitFullName("Mary Grace Reyes")).toEqual({ firstName: "Mary Grace", lastName: "Reyes" });
  });

  it("keeps surname particles with the surname", () => {
    expect(splitFullName("Maria Dela Cruz")).toEqual({ firstName: "Maria", lastName: "Dela Cruz" });
    expect(splitFullName("Juan de la Cruz")).toEqual({ firstName: "Juan", lastName: "de la Cruz" });
  });

  it("never leaves the first name empty because of a particle", () => {
    expect(splitFullName("Dela Cruz")).toEqual({ firstName: "Dela", lastName: "Cruz" });
  });

  it("collapses extra whitespace", () => {
    expect(splitFullName("  Ana   Lim  ")).toEqual({ firstName: "Ana", lastName: "Lim" });
  });

  it("returns a single word as the first name only", () => {
    expect(splitFullName("Madonna")).toEqual({ firstName: "Madonna", lastName: "" });
  });

  it("returns empty fields for a missing name", () => {
    expect(splitFullName(undefined)).toEqual({ firstName: "", lastName: "" });
    expect(splitFullName(null)).toEqual({ firstName: "", lastName: "" });
    expect(splitFullName("   ")).toEqual({ firstName: "", lastName: "" });
  });
});

describe("joinFullName", () => {
  it("joins first, last and suffix", () => {
    expect(joinFullName({ firstName: "Juan", lastName: "Cruz", suffix: "Jr." })).toBe("Juan Cruz Jr.");
  });

  it("leaves no trailing space without a suffix", () => {
    expect(joinFullName({ firstName: "Juan", lastName: "Cruz" })).toBe("Juan Cruz");
    expect(joinFullName({ firstName: "Juan", lastName: "Cruz", suffix: "" })).toBe("Juan Cruz");
  });

  it("trims each part", () => {
    expect(joinFullName({ firstName: " Juan ", lastName: " Cruz ", suffix: null })).toBe("Juan Cruz");
  });
});
