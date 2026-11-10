import { emailCodeRequestErrorMessage, otpAttemptErrorMessage, parseResendWaitSeconds } from "./otpErrors";

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

describe("emailCodeRequestErrorMessage", () => {
  it("replaces the throttle and rate-limit messages", () => {
    expect(
      emailCodeRequestErrorMessage(
        "en",
        "For security purposes, you can only request this after 42 seconds.",
      ),
    ).toBe("Please wait 42 seconds before requesting another code.");
    expect(emailCodeRequestErrorMessage("en", "email rate limit exceeded")).toContain(
      "Too many verification emails",
    );
    expect(
      emailCodeRequestErrorMessage(
        "fil",
        "For security purposes, you can only request this after 42 seconds.",
      ),
    ).toBe("Maghintay ng 42 segundo bago humingi ng panibagong code.");
  });

  it("passes other messages through", () => {
    expect(emailCodeRequestErrorMessage("en", "Password is too weak")).toBe("Password is too weak");
    expect(emailCodeRequestErrorMessage("fil", "Password is too weak")).toBe("Password is too weak");
    expect(emailCodeRequestErrorMessage("en", "")).toBe("Something went wrong. Please try again.");
  });
});

describe("otpAttemptErrorMessage", () => {
  it("counts the attempts left and locks at zero", () => {
    expect(otpAttemptErrorMessage("en", 4)).toBe("Incorrect or expired code. 4 attempts left.");
    expect(otpAttemptErrorMessage("en", 1)).toBe("Incorrect or expired code. 1 attempt left.");
    expect(otpAttemptErrorMessage("en", 0)).toBe(
      "Too many incorrect attempts. Please request a new code.",
    );
    expect(otpAttemptErrorMessage("fil", 4)).toBe(
      "Mali o expired ang code. 4 attempts ang natitira.",
    );
  });
});
