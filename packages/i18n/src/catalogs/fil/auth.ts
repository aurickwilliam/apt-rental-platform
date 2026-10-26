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
  "auth.signIn.inline": "Mag-sign in",
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

  // Change password (Settings → Security on both platforms).
  "auth.changePassword.title": "Palitan ang Password",
  "auth.changePassword.close": "Isara ang pagpalit ng password",
  "auth.changePassword.description":
    "Ilagay ang current password mo, tapos pumili ng bago. Mananatili kang naka-sign in dito, at ma-sign out ang iba pang device.",
  "auth.changePassword.currentLabel": "Kasalukuyang Password",
  "auth.changePassword.currentPlaceholder": "Ilagay ang current password mo",
  "auth.changePassword.currentRequired": "Pakilagay ang current password mo.",
  "auth.changePassword.required": "Kailangan ang field na ito",
  "auth.changePassword.requirements":
    "Hindi natutugunan ng password ang mga requirement o hindi tugma ang password",
  "auth.changePassword.mismatch": "Hindi tugma ang mga password",
  "auth.changePassword.action": "I-update ang Password",
  "auth.changePassword.updating": "Nag-a-update...",
  "auth.changePassword.successTitle": "Na-update ang Password",
  "auth.changePassword.successBody":
    "Ayos! Gamit na ang bago mong password. Naka-sign in ka pa rin dito, at na-sign out ang iba pang device. Nagpadala rin kami ng confirmation sa email mo.",
  "auth.changePassword.toastTitle": "Na-update ang password",
  "auth.changePassword.toastBody": "Na-sign out ang iba pang device.",

  // Change email (Settings → Security on both platforms).
  "auth.changeEmail.title": "Palitan ang Email",
  "auth.changeEmail.close": "Isara ang pagpalit ng email",
  "auth.changeEmail.loadingAccount": "Naglo-load ng account mo",
  "auth.changeEmail.description":
    "Maglagay ng bagong email at current password mo. Magpapadala kami ng 6-digit code sa current at bagong inbox mo. Aktibo pa rin ang current email mo hangga't hindi nakukumpirma ang dalawang code.",
  "auth.changeEmail.currentEmail": "Kasalukuyang Email",
  "auth.changeEmail.newEmail": "Bagong Email",
  "auth.changeEmail.newEmailPlaceholder": "Ilagay ang bagong email mo",
  "auth.changeEmail.newEmailRequired": "Pakilagay ang bagong email address.",
  "auth.changeEmail.step1of2": "Hakbang 1 ng 2",
  "auth.changeEmail.step1.title": "Tingnan ang current email mo",
  "auth.changeEmail.step1.body": "Ilagay ito sa ibaba para makumpirmang ikaw talaga ang gumagawa ng pagbabago.",
  "auth.changeEmail.step2of2": "Hakbang 2 ng 2",
  "auth.changeEmail.step2.title": "Tingnan ang bagong email mo",
  "auth.changeEmail.step2.body": "Ilagay ito sa ibaba para makumpirmang makakatanggap ka ng email doon.",
  "auth.changeEmail.sentTo": "Nagpadala kami ng 6-digit code sa {email}.",
  "auth.changeEmail.codeAria": "{title} 6-digit code",
  "auth.changeEmail.sendCodes": "Ipadala ang Verification Codes",
  "auth.changeEmail.successTitle": "Na-update ang Email",
  "auth.changeEmail.successBodyOthersSignedOut":
    "Ayos! Gamit na ang bago mong email. Naka-sign in ka pa rin dito, at na-sign out ang iba pang device. Nagpadala rin kami ng confirmation sa email mo.",
  "auth.changeEmail.successBodyOthersMayRemain":
    "Ayos! Gamit na ang bago mong email. Naka-sign in ka pa rin dito, pero posibleng naka-sign in pa rin ang iba pang device. Nagpadala rin kami ng confirmation sa email mo.",
  "auth.changeEmail.toast": "Na-update ang email",
  "auth.changeEmail.profileSyncWarning":
    "Posibleng lumabas pa ang dati mong email sa profile mo nang ilang sandali.",
  "auth.changeEmail.newConfirmed":
    "Nakumpirma na ang bagong email mo. Ilagay naman ang code mula sa current email mo.",
  "auth.changeEmail.resendFromCurrent":
    "Naipadala na ang mga bagong code sa dalawang inbox. Ilagay muna ang code mula sa current email mo.",
  "auth.changeEmail.resendBoth": "Papunta na ang mga bagong code sa dalawang inbox.",

  // Shared auth chrome (sign-in, sign-up, recovery, two-step).
  "auth.backToSignIn": "Bumalik sa Sign In",
  "auth.backToSignInAria": "Bumalik sa sign in",
  "auth.newHere": "Bago ka ba dito?",
  "auth.createAccount": "Gumawa ng account",
  "auth.alreadyHaveAccount": "May account ka na ba?",
  "auth.wrongEmail": "Mali ang email? Palitan ito",
  "auth.showPassword": "Ipakita ang password",
  "auth.hidePassword": "Itago ang password",
  "auth.newPasswordLabel": "Bagong Password",
  "auth.newPasswordPlaceholder": "Ilagay ang bagong password mo",
  "auth.confirmPasswordLabel": "Kumpirmahin ang Password",
  "auth.confirmPasswordPlaceholder": "Kumpirmahin ang bagong password mo",
  "auth.passwordRule.aria": "Mga requirement ng password",
  "auth.passwordRule.minLength": "Hindi bababa sa 8 characters",
  "auth.passwordRule.lowercase": "Kahit isang lowercase letter (a–z)",
  "auth.passwordRule.uppercase": "Kahit isang uppercase letter (A–Z)",
  "auth.passwordRule.number": "Kahit isang number (0–9)",
  "auth.passwordRule.special": "Kahit isang special character (hal. ! @ # $ % ^ & *)",
  "auth.passwordRule.match": "Tugma ang mga password",
  "auth.passwordRule.met": ": natugunan",
  "auth.passwordRule.notMet": ": hindi pa natugunan",

  // Sign-in / sign-up chrome.
  "auth.emailPlaceholder": "Ilagay ang email mo",
  "auth.passwordPlaceholder": "Ilagay ang password mo",
  "auth.checkingEmail": "Sinusuri ang email...",
  "auth.signIn.verifyEmail": "I-verify ang Email",
  "auth.signingIn": "Nag-sign in...",
  "auth.google.signIn": "Mag-sign in gamit ang Google",
  "auth.google.signUp": "Mag-sign up gamit ang Google",
  "auth.resendConfirmation": "Padalhan ako ng bagong code",
  "auth.error.emailRequired": "Kailangan ang email",
  "auth.error.invalidEmail": "Maglagay ng valid na email",
  "auth.error.emailRegistered": "Nakarehistro na ang email na ito.",
  "auth.error.emailRegisteredHint": "sa existing account mo para makapagdagdag ng ibang role.",
  "auth.error.invalidPassword": "Pakilagay ang valid na password",
  "auth.error.passwordRequired": "Pakilagay ang password mo",
  "auth.error.emailCheck": "Hindi ma-check ang email mo ngayon. Subukan ulit.",
  "auth.error.grantFailed":
    "Hindi maidagdag ang role na iyon sa account mo. Mag-sign in at subukang idagdag ito mula sa profile mo.",
  "auth.error.wrongPortalLandlord": "Hindi nakarehistro bilang landlord ang account na ito.",
  "auth.error.wrongPortalTenant": "Hindi nakarehistro bilang tenant ang account na ito.",
  "auth.error.sendCodeFailed": "Hindi naipadala ang verification code.",
  "auth.welcome.title": "Maligayang pagdating!",
  "auth.welcome.body":
    "Mukhang first time mo rito — pumili ng role sa ibaba para ma-set up ang account mo.",
  "auth.welcome.finishTitle": "Tapusin ang pag-set up ng account mo",
  "auth.welcome.finishBody":
    "Verified na ang email mo, pero hindi na-save ang profile mo. Pumili ng role sa ibaba at ilagay ulit ang mga detalye mo para magpatuloy.",
  "auth.settingUpAccess": "Sine-set up ang access bilang {role}...",
  "auth.continueAs": "Magpatuloy bilang {role}",

  // One-time-code modal.
  "auth.otp.verifyTitle": "I-verify ang Email Address Mo",
  "auth.otp.sentTo": "Nagpadala kami ng 6-digit verification code sa {email}.",
  "auth.otp.didntReceive": "Walang natanggap na code?",
  "auth.otp.resendIn": "Ipadala ulit sa {seconds}s",
  "auth.otp.resendCode": "Ipadala Ulit ang Code",
  "auth.otp.sending": "Nagpapadala...",
  "auth.otp.verifying": "Nagve-verify...",
  "auth.otp.resend": "Ipadala ulit",
  "auth.otp.verifyCode": "I-verify ang Code",
  "auth.otp.verifyCreateAccount": "I-verify at Gumawa ng Account",

  // Sign-up form.
  "auth.signUpForm.title": "Kumpletuhin ang Form ng {role}",
  "auth.signUpForm.description": "Sumali at simulan ang apartment rental journey mo ngayon!",
  "auth.form.personalInfo": "Personal na Impormasyon",
  "auth.form.addressInfo": "Impormasyon ng Address",
  "auth.form.setPassword": "I-set ang Password Mo",
  "auth.form.firstName": "Pangalan",
  "auth.form.firstNamePlaceholder": "Ilagay ang pangalan mo",
  "auth.form.lastName": "Apelyido",
  "auth.form.lastNamePlaceholder": "Ilagay ang apelyido mo",
  "auth.form.middleName": "Gitnang Pangalan",
  "auth.form.middleNamePlaceholder": "Ilagay ang gitnang pangalan mo (opsyonal)",
  "auth.form.suffix": "Suffix",
  "auth.form.noSuffix": "Walang suffix",
  "auth.form.gender": "Kasarian",
  "auth.form.genderPlaceholder": "Piliin ang kasarian mo",
  "auth.form.mobile": "Mobile Number",
  "auth.form.mobilePlaceholder": "Ilagay ang mobile number mo",
  "auth.form.birthDate": "Petsa ng Kapanganakan",
  "auth.form.birthDateAria": "Petsa ng Kapanganakan",
  "auth.form.birthDateEntered": "Nailagay na petsa ng kapanganakan: {value}",
  "auth.form.passwordPlaceholder": "Gumawa ng password",
  "auth.form.confirmPasswordPlaceholder": "Kumpirmahin ang password mo",
  "auth.form.emailVerified": "Verified na ang email mo.",
  "auth.form.emailVerifiedHint": "para tapusin ang pag-set up ng profile mo.",
  "auth.form.creatingAccount": "Ginagawa ang account...",
  "auth.form.completingProfile": "Kinukumpleto ang profile...",
  "auth.form.completeProfile": "Kumpletuhin ang Profile",
  "auth.address.province": "Probinsya/Lalawigan",
  "auth.address.provincePlaceholder": "Piliin ang probinsya mo",
  "auth.address.city": "Lungsod",
  "auth.address.cityPlaceholder": "Piliin ang lungsod mo",
  "auth.address.cityFirst": "Pumili muna ng probinsya",
  "auth.address.barangay": "Barangay",
  "auth.address.barangayPlaceholder": "Piliin ang barangay mo",
  "auth.address.barangayFirst": "Pumili muna ng lungsod",
  "auth.address.street": "Street Address",
  "auth.address.streetPlaceholder": "Ilagay ang street address mo",
  "auth.address.postal": "Postal Code",
  "auth.address.postalPlaceholder": "Ilagay ang postal code mo",

  // Account created.
  "auth.success.title": "Nagawa na ang Account!",
  "auth.success.tenantBody":
    "Nagawa na ang account mo. Sabihin sa amin ang hinahanap mo at iaangkop namin ang apartment search mo.",
  "auth.success.landlordBody":
    "Matagumpay na nagawa ang account mo. Pwede mo nang pamahalaan ang mga property mo mula sa dashboard.",
  "auth.success.personalize": "I-personalize ang experience ko",
  "auth.success.dashboard": "Magpatuloy sa Dashboard",
  "auth.errorModal.title": "May nangyaring mali",

  // Password recovery.
  "auth.recovery.requestTitle": "Nakalimutan ang Password",
  "auth.recovery.requestBody":
    "Huwag mag-alala, nangyayari talaga ito! Ilagay ang email address na ginagamit mo sa pag-sign in at magpapadala kami ng 6-digit code para i-reset ang password mo.",
  "auth.recovery.emailRequired": "Pakilagay ang email address mo.",
  "auth.recovery.emailInvalid": "Pakilagay ang valid na email address.",
  "auth.recovery.sendCode": "Ipadala ang Code",
  "auth.recovery.sendingCode": "Nagpapadala ng code...",
  "auth.recovery.codeTitle": "Tingnan ang email mo",
  "auth.recovery.codeBefore": "Kung may account para sa",
  "auth.recovery.codeAfter":
    ", nagpadala kami ng 6-digit code doon. Ilagay ang code sa ibaba para i-reset ang password mo.",
  "auth.recovery.newCodeSent": "Papunta na ang bagong code. Tingnan ang inbox mo.",
  "auth.recovery.googleTitle": "Gumagamit ng Google ang account na ito",
  "auth.recovery.googleAfter":
    "ay nag-sign in gamit ang Google, kaya wala itong password na i-reset. Bumalik at gamitin ang Continue with Google.",
  "auth.recovery.googleNoticeTitle": "Nag-sign up gamit ang Google?",
  "auth.recovery.googleNoticeBody":
    "Wala kang password. Gamitin ang Continue with Google sa sign-in page.",
  "auth.recovery.resetTitle": "I-reset ang Password",
  "auth.recovery.resetBody": "Malapit na! Gumawa tayo ng bagong password.",
  "auth.recovery.cancelAria": "Kanselahin ang pag-reset ng password",
  "auth.recovery.saving": "Nagse-save...",
  "auth.recovery.requestNewCode": "Humingi ng bagong code",
  "auth.recovery.sessionEndedTitle": "Tapos na ang reset session",
  "auth.recovery.updatedBody":
    "Ayos! Gamit na ang bago mong password. Para sa seguridad mo, naka-sign out ka sa lahat ng device.",

  // Two-step login (admin).
  "auth.twoStep.enrollTitle": "I-set up ang two-step login",
  "auth.twoStep.challengeTitle": "Two-step login",
  "auth.twoStep.enrollBackupBody":
    "Magdagdag ng backup authenticator app. Kahit alin sa mga device ang pwedeng mag-sign in sa iyo.",
  "auth.twoStep.enrollBody":
    "Kailangan ng code mula sa authenticator app ang admin account tuwing nag-sign in.",
  "auth.twoStep.challengeBody": "Ilagay ang 6-digit code mula sa authenticator app mo.",
  "auth.twoStep.addBackup": "Magdagdag ng backup device",
  "auth.twoStep.setUp": "I-set up ang authenticator app",
  "auth.twoStep.scan":
    "I-scan ang QR code na ito gamit ang authenticator app tulad ng Google Authenticator, Microsoft Authenticator o Authy, tapos ilagay ang code na ipapakita nito.",
  "auth.twoStep.qrAlt": "QR code para sa authenticator app mo",
  "auth.twoStep.cantScan": "Hindi ma-scan? Ilagay na lang ang key na ito:",
  "auth.twoStep.codeAria": "6-digit authenticator code",
  "auth.twoStep.verifyAndTurnOn": "I-verify at i-on",
  "auth.twoStep.verify": "I-verify",
  "auth.twoStep.signOut": "Mag-sign out",
  "auth.twoStep.tooManyCodes":
    "Sobra na ang maling code. Mag-sign out at subukan ulit mamaya.",
};
