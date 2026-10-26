/** Field-level validation copy. Database guard messages never live here. */
export const validation = {
  "validation.required": "This field is required.",
  "validation.email.invalid": "Enter a valid email address.",
  "validation.mobile.invalid": "Enter a valid PH mobile number (09XXXXXXXXX).",
  "validation.password.policy":
    "Password needs at least 8 characters with uppercase and lowercase letters, a number and a special character.",
  "validation.password.mismatch": "Passwords do not match.",
  "validation.birthDate.invalid": "Enter a valid birth date.",
  "validation.postalCode.invalid": "Enter a valid 4-digit postal code.",
} as const;
