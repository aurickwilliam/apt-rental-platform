import { signInViaServer, verifyCodeViaServer } from "./serverAuthService";

const mockSetSession = jest.fn();
const mockSignInWithPassword = jest.fn();
const mockVerifyOtp = jest.fn();
let mockBaseUrl = "https://apt.test";

jest.mock("@repo/supabase", () => ({
  supabase: {
    auth: {
      setSession: (...args: unknown[]) => mockSetSession(...args),
      signInWithPassword: (...args: unknown[]) => mockSignInWithPassword(...args),
      verifyOtp: (...args: unknown[]) => mockVerifyOtp(...args),
    },
  },
}));
jest.mock("@/constants/serverAuth", () => ({
  get SERVER_AUTH_BASE_URL() {
    return mockBaseUrl;
  },
}));

const TOKENS = { access_token: "access-tok", refresh_token: "refresh-tok" };
const USER = { id: "user-1", email: "ana@example.com" };
const EMAIL = "ana@example.com";
const PASSWORD = "hunter2-very-secret";

const mockFetch = jest.fn();
const reply = (status: number, body: unknown) => ({ status, json: async () => body }) as Response;

describe("server auth service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockBaseUrl = "https://apt.test";
    global.fetch = mockFetch as unknown as typeof fetch;
    mockSetSession.mockResolvedValue({ data: { user: USER }, error: null });
  });

  describe("signInViaServer", () => {
    it("posts the credentials and adopts the returned session", async () => {
      mockFetch.mockResolvedValue(reply(200, { ok: true, session: TOKENS }));

      const result = await signInViaServer({ email: EMAIL, password: PASSWORD, captchaToken: "cf" });

      expect(result).toEqual({ data: { user: USER }, error: null });
      const [url, init] = mockFetch.mock.calls[0];
      expect(url).toBe("https://apt.test/api/auth/mobile/sign-in");
      expect(init.method).toBe("POST");
      expect(JSON.parse(init.body)).toEqual({ email: EMAIL, password: PASSWORD, captchaToken: "cf" });
      expect(mockSetSession).toHaveBeenCalledWith(TOKENS);
      expect(mockSignInWithPassword).not.toHaveBeenCalled();
    });

    it("reports a lock with its seconds and never touches the session", async () => {
      mockFetch.mockResolvedValue(
        reply(429, { ok: false, error: { code: "auth_locked", message: "Too many attempts." }, retryAfterSeconds: 880 }),
      );

      const result = await signInViaServer({ email: EMAIL, password: PASSWORD });

      expect(result.data.user).toBeNull();
      expect(result.error).toEqual({ code: "auth_locked", message: "Too many attempts.", retryAfterSeconds: 880 });
      expect(mockSetSession).not.toHaveBeenCalled();
    });

    it("passes Auth's own errors through unchanged", async () => {
      mockFetch.mockResolvedValue(
        reply(401, { ok: false, error: { code: "invalid_credentials", message: "Invalid login credentials" } }),
      );
      expect((await signInViaServer({ email: EMAIL, password: PASSWORD })).error).toEqual({
        code: "invalid_credentials",
        message: "Invalid login credentials",
        retryAfterSeconds: undefined,
      });
    });

    it("turns a network failure into a plain error and does not fall back to a direct sign-in", async () => {
      mockFetch.mockRejectedValue(new Error(`offline for ${EMAIL}`));

      const result = await signInViaServer({ email: EMAIL, password: PASSWORD });

      expect(result.error).toEqual({ code: "network_error", message: expect.stringContaining("connect") });
      expect(JSON.stringify(result)).not.toContain(EMAIL);
      expect(mockSignInWithPassword).not.toHaveBeenCalled();
    });

    it("rejects an unreadable reply and a reply without tokens", async () => {
      mockFetch.mockResolvedValueOnce({ status: 502, json: async () => { throw new Error("html"); } } as unknown as Response);
      expect((await signInViaServer({ email: EMAIL, password: PASSWORD })).error?.code).toBe("unexpected_failure");

      mockFetch.mockResolvedValueOnce(reply(200, { ok: true, session: { access_token: "only-one" } }));
      expect((await signInViaServer({ email: EMAIL, password: PASSWORD })).error?.code).toBe("unexpected_failure");
      expect(mockSetSession).not.toHaveBeenCalled();
    });

    it("reports a session the client refuses", async () => {
      mockFetch.mockResolvedValue(reply(200, { ok: true, session: TOKENS }));
      mockSetSession.mockResolvedValue({ data: { user: null }, error: { code: "bad_jwt", message: "bad token" } });
      expect((await signInViaServer({ email: EMAIL, password: PASSWORD })).error).toEqual({ code: "bad_jwt", message: "bad token" });
    });

    it("signs in directly only when no server is configured", async () => {
      mockBaseUrl = "";
      mockSignInWithPassword.mockResolvedValue({ data: { user: USER }, error: null });

      const result = await signInViaServer({ email: EMAIL, password: PASSWORD, captchaToken: "cf" });

      expect(result).toEqual({ data: { user: USER }, error: null });
      expect(mockFetch).not.toHaveBeenCalled();
      expect(mockSignInWithPassword).toHaveBeenCalledWith({ email: EMAIL, password: PASSWORD, options: { captchaToken: "cf" } });
    });
  });

  describe("verifyCodeViaServer", () => {
    it("verifies a code and adopts the session", async () => {
      mockFetch.mockResolvedValue(reply(200, { ok: true, status: "ready", session: TOKENS }));

      const result = await verifyCodeViaServer({ email: EMAIL, code: "123456", flow: "signup" });

      expect(result).toEqual({ data: { user: USER, status: "ready" }, error: null });
      expect(JSON.parse(mockFetch.mock.calls[0][1].body)).toEqual({ email: EMAIL, code: "123456", flow: "signup" });
      expect(mockFetch.mock.calls[0][0]).toBe("https://apt.test/api/auth/mobile/verify-code");
    });

    it("keeps a Google-only reset session-less", async () => {
      mockFetch.mockResolvedValue(reply(200, { ok: true, status: "google_only" }));
      expect(await verifyCodeViaServer({ email: EMAIL, code: "123456", flow: "recovery" })).toEqual({
        data: { user: null, status: "google_only" },
        error: null,
      });
      expect(mockSetSession).not.toHaveBeenCalled();
    });

    it("reports a lock and a wrong code", async () => {
      mockFetch.mockResolvedValueOnce(
        reply(429, { ok: false, error: { code: "auth_locked", message: "Too many attempts." }, retryAfterSeconds: 300 }),
      );
      expect((await verifyCodeViaServer({ email: EMAIL, code: "123456", flow: "signup" })).error?.retryAfterSeconds).toBe(300);

      mockFetch.mockResolvedValueOnce(
        reply(401, { ok: false, error: { code: "otp_expired", message: "Token has expired or is invalid" } }),
      );
      expect((await verifyCodeViaServer({ email: EMAIL, code: "000000", flow: "signup" })).error?.code).toBe("otp_expired");
    });

    it("verifies directly only when no server is configured", async () => {
      mockBaseUrl = "";
      mockVerifyOtp.mockResolvedValue({
        data: { user: { ...USER, identities: [{ provider: "google" }] }, session: TOKENS },
        error: null,
      });

      const result = await verifyCodeViaServer({ email: EMAIL, code: "123456", flow: "recovery" });

      expect(result.data.status).toBe("google_only");
      expect(mockFetch).not.toHaveBeenCalled();
      expect(mockVerifyOtp).toHaveBeenCalledWith({ email: EMAIL, token: "123456", type: "recovery" });
    });
  });
});
