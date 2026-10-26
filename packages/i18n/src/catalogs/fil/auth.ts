import type { auth as enAuth } from "../en/auth";

export const auth: Record<keyof typeof enAuth, string> = {
  "auth.backToHome": "Bumalik sa home",
  "auth.signIn.title": "Maligayang pagbabalik!",
  "auth.signIn.description": "Mag-log in para magpatuloy sa paghahanap ng apartment.",
  "auth.signUp.title": "Sumali sa amin!",
  "auth.signUp.description.tenant": "Sumali bilang tenant para magsimulang magrenta.",
  "auth.signUp.description.landlord":
    "Sumali at magsimulang maglista ng properties mo sa ilang minuto.",
  "auth.orSignInWith": "o mag-sign in gamit ang",
  "auth.orSignUpWith": "o mag-sign up gamit ang",
  "auth.selectRole": "Pumili ng role",
  "auth.role.tenant": "Tenant",
  "auth.role.landlord": "Landlord",
  "auth.email": "Email",
  "auth.password": "Password",
  "auth.confirmPassword": "Kumpirmahin ang password",
  "auth.currentPassword": "Kasalukuyang password",
  "auth.newPassword": "Bagong password",
  "auth.forgotPassword": "Nakalimutan ang password?",
  "auth.signIn.action": "Mag-sign in",
  "auth.signUp.action": "Mag-sign up",
};
