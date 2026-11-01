import { PH_MOBILE_MAX_INPUT_LENGTH, PH_MOBILE_TOO_SHORT_MESSAGE, formatPHMobileInput, normalizePHMobile, validatePHMobile } from "@repo/constants";

describe("validatePHMobile", () => {
  it.each([
    "09171234567",
    "0917 123 4567",
    "(0917) 123-4567",
  ])("stores %s as 09171234567", (input) => {
    expect(validatePHMobile(input)).toMatchObject({ isValid: true, formattedNumber: "09171234567" });
  });

  it.each([
    "+639171234567",
    "+63 917 123 4567",
    "639171234567",
    "+630917 123 4567",
    "00639171234567",
  ])("rejects %s: only the local 09XX XXX XXXX format is accepted", (input) => {
    const result = validatePHMobile(input);
    expect(result).toMatchObject({ isValid: false, formattedNumber: null });
    expect(result.errorMessage).toBe("Enter a valid mobile number, like 0917 123 4567.");
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
    ["0898 123 4567", "08981234567"],
  ])("accepts the 08-series number %s", (input, stored) => {
    expect(validatePHMobile(input)).toMatchObject({ isValid: true, formattedNumber: stored });
  });

  it.each([
    "0",
    "0917",
    "0917 123",
    "0917 123 456", // one digit short
    "9171234567", // no leading 0, so one digit short of 11
    "917123456",
    "0917-123-456",
  ])("tells the user %s is too short", (input) => {
    expect(validatePHMobile(input)).toMatchObject({ isValid: false, errorMessage: PH_MOBILE_TOO_SHORT_MESSAGE, formattedNumber: null });
  });

  it("keeps the too-short message for digits only, and the generic one for other mistakes", () => {
    expect(PH_MOBILE_TOO_SHORT_MESSAGE).toBe("Mobile number must be 11 digits, like 0917 123 4567.");
    expect(validatePHMobile("0917abc").errorMessage).toBe("Enter a valid mobile number, like 0917 123 4567.");
    expect(validatePHMobile("+63917123").errorMessage).toBe("Enter a valid mobile number, like 0917 123 4567.");
    expect(validatePHMobile("091712345678").errorMessage).toBe("Enter a valid mobile number, like 0917 123 4567."); // too long
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
    expect(normalizePHMobile("+63 917 123 4567")).toBe("+639171234567");
  });

  it("stores a spaced local number as 11 digits and is idempotent", () => {
    expect(normalizePHMobile("0917 123 4567")).toBe("09171234567");
    expect(normalizePHMobile(normalizePHMobile("0917 123 4567"))).toBe("09171234567");
  });
});

describe("formatPHMobileInput", () => {
  it.each([
    ["", ""],
    ["0", "0"],
    ["0917", "0917"],
    ["09171", "0917 1"],
    ["0917123", "0917 123"],
    ["09171234", "0917 123 4"],
    ["09171234567", "0917 123 4567"],
  ])("spaces %s as %s, with no trailing space", (input, shown) => {
    expect(formatPHMobileInput(input)).toBe(shown);
  });

  it("re-spaces what is already formatted, so typing and deleting stay stable", () => {
    expect(formatPHMobileInput("0917 123 4567")).toBe("0917 123 4567");
    expect(formatPHMobileInput("0917 123 ")).toBe("0917 123");
    expect(formatPHMobileInput("0917 12")).toBe("0917 12");
  });

  it("keeps digits only and caps the number at 11 digits", () => {
    expect(formatPHMobileInput("0917-123-4567")).toBe("0917 123 4567");
    expect(formatPHMobileInput("0917abc1234567999")).toBe("0917 123 4567");
    expect(formatPHMobileInput("+63 917 123 4567")).toBe("6391 712 3456");
    expect(formatPHMobileInput("0917 123 4567").length).toBe(PH_MOBILE_MAX_INPUT_LENGTH);
  });
});
