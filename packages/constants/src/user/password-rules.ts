export interface PasswordRequirements {
  minLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
  passwordsMatch: boolean;
}

// Any visible character that is not a letter or digit counts as special, so
// "_", "-" and "~" are accepted everywhere, not just the common punctuation.
const SPECIAL_CHAR = /[^A-Za-z0-9\s]/;

// One password policy for sign-up, reset and change on web and mobile.
export function getPasswordRequirements(
  password: string,
  confirmPassword: string = password,
): PasswordRequirements {
  return {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecialChar: SPECIAL_CHAR.test(password),
    passwordsMatch: password === confirmPassword && password !== "",
  };
}

// Everything except the confirmation match, for places that only see the
// password itself (server-side checks).
export function meetsPasswordPolicy(password: string): boolean {
  const { passwordsMatch: _passwordsMatch, ...rules } = getPasswordRequirements(password);
  return Object.values(rules).every(Boolean);
}

export const PASSWORD_POLICY_MESSAGE =
  "Password needs at least 8 characters with uppercase and lowercase letters, a number and a special character.";
