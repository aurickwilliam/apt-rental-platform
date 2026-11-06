import {
  checkAuthThrottle,
  clearAuthThrottle,
  isAuthRateLimitError,
  isInvalidOtpError,
  recordAuthFailure,
} from "./authThrottle";

const clientReturning = (result: { data: unknown; error: unknown } | Error) => ({
  rpc: jest.fn(async () => {
    if (result instanceof Error) throw result;
    return result;
  }),
});

describe("auth throttle client", () => {
  it("returns the seconds the database reports", async () => {
    const client = clientReturning({ data: 420, error: null });
    expect(await recordAuthFailure(client, "recovery_otp", "a@b.co")).toBe(420);
    expect(client.rpc).toHaveBeenCalledWith("auth_throttle_server", {
      p_action: "fail",
      p_purpose: "recovery_otp",
      p_subject: "a@b.co",
    });
  });

  it("allows the attempt when the database says 0", async () => {
    expect(await checkAuthThrottle(clientReturning({ data: 0, error: null }), "signin_email_hour", "a@b.co")).toBe(0);
  });

  it("reads through the public function and writes through the server-only one", async () => {
    const client = clientReturning({ data: 0, error: null });
    await checkAuthThrottle(client, "signin_email_ip", "a@b.co|203.0.113.5");
    await recordAuthFailure(client, "signin_email_ip", "a@b.co|203.0.113.5");
    await clearAuthThrottle(client, "signin_email_ip", "a@b.co|203.0.113.5");
    expect(client.rpc.mock.calls.map(([fn, args]) => [fn, args.p_action])).toEqual([
      ["auth_throttle", "check"],
      ["auth_throttle_server", "fail"],
      ["auth_throttle_server", "clear"],
    ]);
  });

  it("fails open when a non-service client is refused a write", async () => {
    const error = jest.spyOn(console, "error").mockImplementation(() => {});
    const refused = clientReturning({ data: null, error: { code: "42501" } });
    expect(await recordAuthFailure(refused, "signup_otp", "a@b.co")).toBe(0);
    expect(error).toHaveBeenCalledWith("Auth throttle unavailable:", "fail", "signup_otp");
    expect(JSON.stringify(error.mock.calls)).not.toContain("a@b.co");
  });

  it("fails open on an rpc error or a thrown error", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    expect(await checkAuthThrottle(clientReturning({ data: null, error: { code: "PGRST202" } }), "signin_email_hour", "a@b.co")).toBe(0);
    expect(await checkAuthThrottle(clientReturning(new Error("offline")), "signin_email_hour", "a@b.co")).toBe(0);
  });
});

describe("auth error classifiers", () => {
  it("detects rate limits by code or status, not by message", () => {
    expect(isAuthRateLimitError({ code: "over_request_rate_limit" })).toBe(true);
    expect(isAuthRateLimitError({ status: 429 })).toBe(true);
    expect(isAuthRateLimitError({ message: "rate limit" })).toBe(false);
  });

  it("detects wrong or expired codes", () => {
    expect(isInvalidOtpError({ code: "otp_expired" })).toBe(true);
    expect(isInvalidOtpError({ code: "over_request_rate_limit" })).toBe(false);
    expect(isInvalidOtpError({ message: "Token has expired or is invalid" })).toBe(true);
    expect(isInvalidOtpError(null)).toBe(false);
  });
});
