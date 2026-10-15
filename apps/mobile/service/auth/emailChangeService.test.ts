import {
  getEmailChangeAccount,
  getEmailChangeEligibility,
  requestEmailChange,
  resendEmailChangeCode,
  verifyEmailChangeCode,
} from "./emailChangeService";
import { EmailChangeError } from "@repo/utils";

const mockGetUser = jest.fn();
const mockSignInWithPassword = jest.fn();
const mockUpdateUser = jest.fn();
const mockVerifyOtp = jest.fn();
const mockResend = jest.fn();
const mockSignOut = jest.fn();
const mockRpc = jest.fn();

jest.mock("@repo/supabase", () => ({
  supabase: {
    auth: {
      getUser: (...args: unknown[]) => mockGetUser(...args),
      signInWithPassword: (...args: unknown[]) => mockSignInWithPassword(...args),
      updateUser: (...args: unknown[]) => mockUpdateUser(...args),
      verifyOtp: (...args: unknown[]) => mockVerifyOtp(...args),
      resend: (...args: unknown[]) => mockResend(...args),
      signOut: (...args: unknown[]) => mockSignOut(...args),
    },
    rpc: (...args: unknown[]) => mockRpc(...args),
  },
}));

jest.mock("@/service/auth/suspensionService", () => ({
  getMySuspensionStatus: jest.fn().mockResolvedValue({ suspended: false, reason: null }),
}));

jest.mock("@/service/auth/passwordRecoveryService", () => ({
  isPasswordRecoveryInProgress: jest.fn().mockResolvedValue(false),
}));

const CURRENT = "current@example.com";
const NEXT = "new@example.com";
const PASSWORD = "0ld!Passw0rd";

const emailUser = {
  id: "user-1",
  email: CURRENT,
  new_email: null,
  identities: [{ provider: "email" }],
  app_metadata: { providers: ["email"] },
};
const linkedUser = {
  ...emailUser,
  identities: [{ provider: "google" }, { provider: "email" }],
  app_metadata: { providers: ["google", "email"] },
};

function authError(fields: { name?: string; code?: string; status?: number }) {
  return Object.assign(new Error("auth error"), fields);
}

describe("emailChangeService", () => {
  let consoleError: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
    mockGetUser.mockResolvedValue({ data: { user: emailUser }, error: null });
    mockSignInWithPassword.mockResolvedValue({ data: { user: emailUser }, error: null });
    mockUpdateUser.mockResolvedValue({ error: null });
    mockVerifyOtp.mockResolvedValue({ data: { user: emailUser }, error: null });
    mockResend.mockResolvedValue({ error: null });
    mockSignOut.mockResolvedValue({ error: null });
    mockRpc.mockResolvedValue({ error: null });
  });

  afterEach(() => {
    consoleError.mockRestore();
  });

  it("reports email-only accounts as eligible and Google-linked as google", async () => {
    await expect(getEmailChangeEligibility()).resolves.toBe("eligible");
    mockGetUser.mockResolvedValueOnce({ data: { user: linkedUser }, error: null });
    await expect(getEmailChangeEligibility()).resolves.toBe("google");
  });

  it("requests the change against the mobile client", async () => {
    const result = await requestEmailChange(NEXT, PASSWORD);
    expect(result).toEqual({ currentEmail: CURRENT, newEmail: NEXT });
    expect(mockSignInWithPassword).toHaveBeenCalledWith({ email: CURRENT, password: PASSWORD });
    expect(mockUpdateUser).toHaveBeenCalledWith({ email: NEXT });
  });

  it("resumes a pending change from Auth state", async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { ...emailUser, new_email: NEXT } },
      error: null,
    });
    await expect(getEmailChangeAccount()).resolves.toMatchObject({
      email: CURRENT,
      pendingNewEmail: NEXT,
    });
  });

  it("resends through the email_change type", async () => {
    await resendEmailChangeCode(CURRENT);
    expect(mockResend).toHaveBeenCalledWith({ type: "email_change", email: CURRENT });
  });

  it("syncs the profile and signs other sessions out on completion", async () => {
    mockGetUser
      .mockResolvedValueOnce({ data: { user: { ...emailUser, new_email: NEXT } }, error: null })
      .mockResolvedValueOnce({ data: { user: { ...emailUser, email: NEXT, new_email: null } }, error: null })
      .mockResolvedValueOnce({ data: { user: { ...emailUser, email: NEXT, new_email: null } }, error: null });

    const result = await verifyEmailChangeCode(NEXT, "123456", NEXT);
    expect(result.completed).toBe(true);
    expect(mockRpc).toHaveBeenCalledWith("sync_my_profile_email");
    expect(mockSignOut).toHaveBeenCalledWith({ scope: "others" });
  });

  it("refuses suspended accounts without contacting Auth update", async () => {
    const { getMySuspensionStatus } = jest.requireMock("@/service/auth/suspensionService");
    getMySuspensionStatus.mockResolvedValueOnce({ suspended: true, reason: "test" });
    await expect(requestEmailChange(NEXT, PASSWORD)).rejects.toBeInstanceOf(EmailChangeError);
    expect(mockUpdateUser).not.toHaveBeenCalled();
  });

  it("maps wrong passwords without leaking secrets", async () => {
    mockSignInWithPassword.mockResolvedValueOnce({
      data: { user: null },
      error: authError({ code: "invalid_credentials", status: 400 }),
    });
    await expect(requestEmailChange(NEXT, PASSWORD)).rejects.toMatchObject({
      reason: "wrong_current_password",
    });
  });
});
