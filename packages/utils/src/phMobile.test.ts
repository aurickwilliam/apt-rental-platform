import { normalizePHMobile, validatePHMobile } from "@repo/constants";

describe("validatePHMobile", () => {
  it.each(["09171234567", "+639171234567", "639171234567", "9171234567", "0917 123 4567"])(
    "stores %s as 09171234567",
    (input) => {
      expect(validatePHMobile(input)).toMatchObject({ isValid: true, formattedNumber: "09171234567" });
    },
  );

  it("rejects empty, malformed and unknown-prefix numbers", () => {
    expect(validatePHMobile("").errorMessage).toBe("Mobile number is required.");
    expect(validatePHMobile("0917123").isValid).toBe(false);
    expect(validatePHMobile("08171234567").isValid).toBe(false);
    expect(validatePHMobile("09001234567").errorMessage).toContain("Unknown mobile prefix");
  });

  it("leaves unrecognised input unchanged apart from separators", () => {
    expect(normalizePHMobile(" 12-34 ")).toBe("1234");
  });
});
