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

  "auth.error.invalidOrExpiredCode":
    "Mali o expired na ang code. I-check ang code o humingi ng bago.",
  "auth.error.wrongCurrentPassword": "Mali ang current password mo.",
  "auth.error.rateLimited":
    "Sobra na ang attempts. Maghintay ng isang minuto bago subukan ulit.",
  "auth.error.samePassword":
    "Kailangang iba ang bagong password sa current password mo.",
  "auth.error.weakPassword":
    "Masyadong mahina ang password na ito. Pumili ng mas malakas na password.",
  "auth.error.sessionExpired": "Expired na ang reset session mo. Humingi ng bagong code.",
  "auth.error.reauthenticationRequired":
    "Para sa seguridad mo, mag-sign in ulit bago palitan ang password.",
  "auth.error.reauthenticationEmail":
    "Para sa seguridad mo, mag-sign in ulit bago palitan ang email.",
  "auth.error.sessionExpiredGeneric": "Expired na ang session mo. Mag-sign in ulit.",
  "auth.error.sameEmail": "Maglagay ng ibang email address kaysa sa current mo.",
  "auth.error.notEligible":
    "Ang mga email at password account lang ang pwedeng magpalit ng email.",
  "auth.error.emailUnavailable":
    "Hindi magagamit ang email address na ito. Subukan ang iba.",
  "auth.error.suspended": "Suspended ang account mo at hindi makakapagpalit ng email.",
  "auth.error.noPendingChange":
    "Hindi na naghihintay ng confirmation ang email change na ito. Simulan ulit gamit ang bagong email.",
  "auth.error.network":
    "Hindi makakonekta ngayon. I-check ang internet connection at subukan ulit.",

  "auth.otp.waitOne": "Maghintay ng 1 segundo bago humingi ng panibagong code.",
  "auth.otp.waitOther":
    "Maghintay ng {seconds} segundo bago humingi ng panibagong code.",
  "auth.otp.rateLimited":
    "Sobra na ang verification emails na hiniling. Subukan ulit pagkalipas ng ilang minuto.",
  "auth.otp.tooManyAttempts": "Sobra na ang maling attempts. Humingi ng bagong code.",
  "auth.otp.attemptsLeftOne": "Mali o expired ang code. 1 attempt ang natitira.",
  "auth.otp.attemptsLeftOther": "Mali o expired ang code. {count} attempts ang natitira.",
};
