import { getEmailCodeRequestError, parseResendWaitSeconds } from "./otpErrors";

describe("parseResendWaitSeconds", () => {
  it("reads the wait from Supabase's throttle message", () => {
    expect(parseResendWaitSeconds("For security purposes, you can only request this after 42 seconds.")).toBe(42);
    expect(parseResendWaitSeconds("request this after 1 second")).toBe(1);
  });

  it("returns null for other messages", () => {
    expect(parseResendWaitSeconds("Invalid login credentials")).toBeNull();
    expect(parseResendWaitSeconds(undefined)).toBeNull();
  });
});

describe("getEmailCodeRequestError", () => {
  it("replaces the throttle and rate-limit messages", () => {
    expect(getEmailCodeRequestError("For security purposes, you can only request this after 42 seconds.")).toBe(
      "Please wait 42 seconds before requesting another code.",
    );
    expect(getEmailCodeRequestError("email rate limit exceeded")).toContain("Too many verification emails");
  });

  it("passes other messages through", () => {
    expect(getEmailCodeRequestError("Password is too weak")).toBe("Password is too weak");
    expect(getEmailCodeRequestError("")).toBe("Something went wrong. Please try again.");
  });
});
