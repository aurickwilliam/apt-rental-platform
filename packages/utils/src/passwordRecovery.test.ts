import { PasswordError } from "./passwordErrors";
import {
  isRecoveryCodeFormat,
  normalizeRecoveryEmail,
  RECOVERY_CODE_LENGTH,
  RECOVERY_RESEND_COOLDOWN_SECONDS,
} from "./passwordRecovery";

describe("passwordRecovery", () => {
  it("mirrors the hosted Auth code length and send interval", () => {
    expect(RECOVERY_CODE_LENGTH).toBe(6);
    expect(RECOVERY_RESEND_COOLDOWN_SECONDS).toBe(60);
  });

  it("trims a valid email", () => {
    expect(normalizeRecoveryEmail("  tenant@example.com ")).toBe("tenant@example.com");
  });

  it("rejects an invalid email with a safe reason", () => {
    expect(() => normalizeRecoveryEmail("not-an-email")).toThrow(PasswordError);
    try {
      normalizeRecoveryEmail("");
    } catch (error) {
      expect((error as PasswordError).reason).toBe("invalid_email");
    }
  });

  it("accepts only six digits", () => {
    expect(isRecoveryCodeFormat("123456")).toBe(true);
    expect(isRecoveryCodeFormat("12345")).toBe(false);
    expect(isRecoveryCodeFormat("1234567")).toBe(false);
    expect(isRecoveryCodeFormat("12345a")).toBe(false);
    expect(isRecoveryCodeFormat(" 123456")).toBe(false);
  });
});
