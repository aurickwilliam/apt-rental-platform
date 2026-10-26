import { normalizePHMobile, sanitizePHMobileInput, validatePHMobile } from "@repo/constants";

describe("validatePHMobile", () => {
  it.each([
    "09171234567",
    "+639171234567",
    "639171234567",
    "9171234567",
    "0917 123 4567",
    "+63 917 123 4567",
    "(0917) 123-4567",
    "+630917 123 4567",
    "00639171234567",
  ])("stores %s as 09171234567", (input) => {
    expect(validatePHMobile(input)).toMatchObject({ isValid: true, formattedNumber: "09171234567" });
  });

  it.each([
    "0953 123 4567", // Globe/TM block that was missing from the old prefix list
    "0955 123 4567",
    "0967 123 4567",
    "0925 123 4567", // Smart/Sun block reissued in 2025
    "0924 123 4567",
    "0934 123 4567",
    "0944 123 4567",
    "0900 123 4567", // any 09XX is in the NTC mobile range, so never rejected by prefix
    "09991234567",
  ])("accepts %s regardless of an allowlist", (input) => {
    expect(validatePHMobile(input).isValid).toBe(true);
  });

  it.each([
    ["08131234567", "08131234567"],
    ["08171234567", "08171234567"],
    ["0895 123 4567", "08951234567"], // DITO
    ["+63 898 123 4567", "08981234567"],
    ["8991234567", "08991234567"],
  ])("accepts the 08-series number %s", (input, stored) => {
    expect(validatePHMobile(input)).toMatchObject({ isValid: true, formattedNumber: stored });
  });

  it("rejects empty and malformed numbers", () => {
    expect(validatePHMobile("").errorMessage).toBe("Mobile number is required.");
    expect(validatePHMobile("   ").errorMessage).toBe("Mobile number is required.");
    expect(validatePHMobile("0917123").isValid).toBe(false);
    expect(validatePHMobile("091712345678").isValid).toBe(false); // too long
    expect(validatePHMobile("+6491712345678").isValid).toBe(false); // wrong country code
    expect(validatePHMobile("0917abc4567").isValid).toBe(false);
    expect(validatePHMobile("02-8123-4567").isValid).toBe(false); // Metro Manila landline
    expect(validatePHMobile("07171234567").isValid).toBe(false);
  });

  it("rejects 08-series blocks that are not allocated", () => {
    const result = validatePHMobile("08001234567");
    expect(result).toMatchObject({ isValid: false, prefix: "0800", formattedNumber: null });
    expect(result.errorMessage).toContain("not a mobile prefix");
    expect(validatePHMobile("08941234567").isValid).toBe(false);
  });
});

describe("normalizePHMobile", () => {
  it("leaves unrecognised input unchanged apart from separators", () => {
    expect(normalizePHMobile(" 12-34 ")).toBe("1234");
  });

  it("is idempotent on the stored form", () => {
    expect(normalizePHMobile(normalizePHMobile("+63 917 123 4567"))).toBe("09171234567");
  });
});

describe("sanitizePHMobileInput", () => {
  it("keeps every accepted format typeable", () => {
    expect(sanitizePHMobileInput("09171234567")).toBe("09171234567");
    expect(sanitizePHMobileInput("+639171234567")).toBe("+639171234567");
    expect(sanitizePHMobileInput("639171234567")).toBe("639171234567");
    expect(sanitizePHMobileInput("00639171234567")).toBe("00639171234567");
  });

  it("strips separators and letters, and caps each shape", () => {
    expect(sanitizePHMobileInput("0917 123-4567")).toBe("09171234567");
    expect(sanitizePHMobileInput("0917123456789")).toBe("09171234567");
    expect(sanitizePHMobileInput("+63 (917) abc 123 4567 99999")).toBe("+63917123456799");
  });
});
