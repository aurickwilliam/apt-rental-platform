import type { validation as enValidation } from "../en/validation";

export const validation: Record<keyof typeof enValidation, string> = {
  "validation.required": "Kailangan ang field na ito.",
  "validation.email.invalid": "Maglagay ng valid na email address.",
  "validation.mobile.invalid": "Maglagay ng valid na PH mobile number (09XXXXXXXXX).",
  "validation.password.policy":
    "Kailangan ng password ang hindi bababa sa 8 character, may uppercase at lowercase, numero, at special character.",
  "validation.password.mismatch": "Hindi tugma ang mga password.",
  "validation.birthDate.invalid": "Maglagay ng valid na petsa ng kapanganakan.",
  "validation.postalCode.invalid": "Maglagay ng valid na 4-digit na postal code.",
};
