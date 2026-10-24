import { needsProfileOnboarding } from "./profileOnboarding";

describe("needsProfileOnboarding", () => {
  it("needs onboarding while unverified with no mobile number", () => {
    expect(needsProfileOnboarding({ mobile_number: null, account_status: "unverified" })).toBe(true);
    expect(needsProfileOnboarding({ mobile_number: "", account_status: "unverified" })).toBe(true);
  });

  it("treats a missing status like unverified", () => {
    expect(needsProfileOnboarding({ mobile_number: null })).toBe(true);
  });

  it("is done once a mobile number is saved", () => {
    expect(needsProfileOnboarding({ mobile_number: "09123456789", account_status: "unverified" })).toBe(false);
  });

  it("is done for an account past the unverified status", () => {
    expect(needsProfileOnboarding({ mobile_number: null, account_status: "verified" })).toBe(false);
  });
});
