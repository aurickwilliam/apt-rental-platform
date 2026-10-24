import { getEmailCodeRequestError, getOtpAttemptError, parseResendWaitSeconds } from "./otpErrors";

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

describe("getOtpAttemptError", () => {
  it("counts the attempts left and locks at zero", () => {
    expect(getOtpAttemptError(4)).toBe("Incorrect or expired code. 4 attempts left.");
    expect(getOtpAttemptError(1)).toBe("Incorrect or expired code. 1 attempt left.");
    expect(getOtpAttemptError(0)).toBe("Too many incorrect attempts. Please request a new code.");
  });
});
