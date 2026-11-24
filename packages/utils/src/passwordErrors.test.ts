import {
  describeAuthError,
  PasswordError,
  passwordErrorMessage,
  passwordErrorKey,
  toPasswordError,
  toPasswordErrorReason,
} from "./passwordErrors";

function authError(fields: { name?: string; code?: string; status?: number; message?: string }) {
  return Object.assign(new Error(fields.message ?? "auth error"), fields);
}

describe("passwordErrors", () => {
  let consoleError: jest.SpyInstance;

  beforeEach(() => {
    consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => consoleError.mockRestore());

  it.each([
    [{ code: "otp_expired", status: 403 }, "invalid_or_expired_code"],
    [{ code: "invalid_credentials", status: 400 }, "wrong_current_password"],
    [{ code: "over_email_send_rate_limit", status: 429 }, "rate_limited"],
    [{ code: "over_request_rate_limit", status: 429 }, "rate_limited"],
    [{ status: 429 }, "rate_limited"],
    [{ code: "same_password", status: 422 }, "same_password"],
    [{ code: "weak_password", status: 422 }, "weak_password"],
    [{ name: "AuthWeakPasswordError" }, "weak_password"],
    [{ code: "reauthentication_needed", status: 400 }, "reauthentication_required"],
    [{ code: "session_not_found", status: 403 }, "session_expired"],
    [{ code: "session_expired", status: 403 }, "session_expired"],
    [{ name: "AuthSessionMissingError" }, "session_expired"],
    [{ code: "email_address_invalid", status: 400 }, "invalid_email"],
    [{ code: "validation_failed", status: 400 }, "invalid_email"],
    [{ name: "AuthRetryableFetchError", status: 0 }, "network"],
    [{ code: "something_new", status: 500 }, "unknown"],
  ])("maps Supabase error %o to %s", (fields, reason) => {
    expect(toPasswordErrorReason(authError(fields))).toBe(reason);
  });

  it("treats missing or non-object errors as unknown", () => {
    expect(toPasswordErrorReason(null)).toBe("unknown");
    expect(toPasswordErrorReason("boom")).toBe("unknown");
  });

  it("carries a developer-facing reason and localized copy", () => {
    const error = new PasswordError("wrong_current_password");
    expect(error).toBeInstanceOf(Error);
    expect(error.reason).toBe("wrong_current_password");
    // The message is a reason code, never English prose that could leak into a
    // Filipino UI; screens render `passwordErrorMessage`.
    expect(error.message).toBe("wrong_current_password");
    expect(passwordErrorMessage("en", error.reason)).toBe("Your current password is incorrect.");
    expect(passwordErrorMessage("fil", error.reason)).toBe("Mali ang current password mo.");
  });

  it("maps every reason to a catalog key", () => {
    expect(passwordErrorKey("invalid_email")).toBe("validation.email.invalid");
    expect(passwordErrorKey("unknown")).toBe("errors.generic");
  });

  it("logs only unexpected errors, without their message", () => {
    const secret = "N3w!Passw0rd tenant@example.com";

    expect(toPasswordError(authError({ code: "same_password", status: 422 }), "Change")).toMatchObject({
      reason: "same_password",
    });
    expect(consoleError).not.toHaveBeenCalled();

    expect(toPasswordError(authError({ code: "boom", status: 500, message: secret }), "Change")).toMatchObject({
      reason: "unknown",
    });
    expect(consoleError).toHaveBeenCalledWith("Change failed:", { name: "Error", code: "boom", status: 500 });
    expect(JSON.stringify(consoleError.mock.calls)).not.toContain("Passw0rd");
  });

  it("describes errors with safe fields only", () => {
    expect(describeAuthError(authError({ code: "x", status: 1, message: "secret" }))).toEqual({
      name: "Error",
      code: "x",
      status: 1,
    });
    expect(describeAuthError(null)).toEqual({ name: undefined, code: undefined, status: undefined });
  });
});
