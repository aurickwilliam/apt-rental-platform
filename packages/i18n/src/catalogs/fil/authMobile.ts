import type { authMobile as enAuthMobile } from "../en/authMobile";

export const authMobile: Record<keyof typeof enAuthMobile, string> = {
  "authMobile.emailLabel": "Email Address:",
  "authMobile.passwordLabel": "Password:",
  "authMobile.newPasswordLabel": "Bagong Password:",
  "authMobile.currentPasswordLabel": "Kasalukuyang Password:",
  "authMobile.confirmPasswordLabel": "Kumpirmahin ang Password:",
  "authMobile.currentEmailLabel": "Kasalukuyang Email:",
  "authMobile.newEmailLabel": "Bagong Email:",
  "authMobile.mobileLabel": "Mobile Number:",
  "authMobile.forgotPassword": "Nakalimutan ang Password?",
  "authMobile.newHere": "Bago ka lang dito?",
  "authMobile.continueWithGoogle": "Magpatuloy gamit ang Google",
  "authMobile.somethingWentWrong": "May nangyaring mali",
  "authMobile.errorGeneric": "May nangyaring mali. Subukan muli.",
  "authMobile.emailInvalid": "Ilagay ang tamang email address.",
  "authMobile.goBack": "Bumalik",
  "authMobile.backToSettings": "Bumalik sa Settings",
  "authMobile.createPasswordPlaceholder": "Gumawa ng password",
  "authMobile.confirmPasswordPlaceholder": "Kumpirmahin ang password mo",
  "authMobile.passwordMustContain": "Dapat mayroon ang password mo ng:",
  "authMobile.showPasswordFor": "Ipakita ang {field}",
  "authMobile.hidePasswordFor": "Itago ang {field}",

  "authMobile.signIn.passwordRequired": "Ilagay ang password mo.",
  "authMobile.signIn.emailRequired": "Ilagay ang email address mo.",
  "authMobile.signIn.invalidCredentials":
    "Mali ang email o password. Subukan muli.",
  "authMobile.signIn.rateLimited":
    "Sobra na ang pagtatangkang mag-sign in. Subukan ulit mamaya.",
  "authMobile.signIn.profileLoadFailed":
    "Hindi ma-load ang profile mo. Subukan muli.",
  "authMobile.signIn.adminWebOnly":
    "Ang mga admin account ay sa web portal lang.",
  "authMobile.signIn.noPortal":
    "Walang tenant o landlord account na nakita para sa profile na ito.",
  "authMobile.signIn.unexpected":
    "May hindi inaasahang error. I-check ang koneksyon mo at subukan muli.",

  "authMobile.google.noCode": "Hindi nagtagumpay ang authentication. Walang code na bumalik.",
  "authMobile.google.exchangeFailed": "Hindi na-establish ang session.",
  "authMobile.google.profileLoadFailed": "Hindi ma-load ang profile mo.",
  "authMobile.google.noMobileRole": "Walang supported na mobile role na nakita.",
  "authMobile.google.startFailed":
    "Hindi nasimulan ang Google sign-in. Subukan muli.",
  "authMobile.google.incomplete":
    "Hindi nakumpleto ang sign-in. Subukan muli.",
  "authMobile.google.unexpected": "May hindi inaasahang error.",
  "authMobile.google.unexpectedRetry":
    "May hindi inaasahang error. Subukan muli.",

  "authMobile.suspended.title": "Naka-suspend ang account",
  "authMobile.suspended.message":
    "Naka-suspend ang account mo. Kontakin ang support kung sa tingin mo ay mali ito.",
  "authMobile.suspended.messageWithReason":
    "Naka-suspend ang account mo.\n\nDahilan: {reason}\n\nKontakin ang support kung sa tingin mo ay mali ito.",

  "authMobile.signUp.title": "Gumawa ng Account",
  "authMobile.signUp.emailRequired": "Kailangan ang email address.",
  "authMobile.signUp.emailRegistered":
    "Naka-register na ang email na ito. Mag-sign in na lang.",

  "authMobile.completeProfile.title": "Kumpletuhin ang {role} Profile",
  "authMobile.completeProfile.accountSecurity": "Seguridad ng Account",
  "authMobile.chooseAccountType": "Piliin ang uri ng account",
  "authMobile.useDifferentAccount": "Gumamit ng ibang account",

  "authMobile.otp.sentTitle": "Naipadala ang OTP!",
  "authMobile.otp.sentBody":
    "Nagpadala kami ng 6-digit verification code sa email mo. Ilagay ang code na ipinadala sa {email}.",
  "authMobile.otp.didntGetCode": "Hindi natanggap ang code?",
  "authMobile.otp.verifiedFinishProfile":
    "Verified na ang email mo, kaya puwede ka nang mag-sign in para tapusin ang profile setup.",

  "authMobile.verifyMobile.title": "Ilagay ang Mobile Number Mo",

  "authMobile.changeEmail.invalidEmail": "Ilagay ang tamang email address.",
  "authMobile.changeEmail.sendingCodes": "Nagpapadala ng codes...",
  "authMobile.changeEmail.sentBefore": "Nagpadala kami ng 6-digit code sa",
  "authMobile.changeEmail.newConfirmed": "Nakumpirma ang bagong email",
  "authMobile.changeEmail.newConfirmedBody":
    "Ilagay na ang code mula sa current email mo.",
  "authMobile.changeEmail.newCodesSent": "Naipadala ang mga bagong code",
  "authMobile.changeEmail.resendFromCurrentBody":
    "Ilagay muna ang code mula sa current email mo.",
  "authMobile.changeEmail.successBodySignedOut":
    "Ayos! Gamit na ang bago mong email. Naka-sign in ka pa rin dito, at na-sign out ang iba pang device.",
  "authMobile.changeEmail.successBodyOthersMayRemain":
    "Ayos! Gamit na ang bago mong email. Naka-sign in ka pa rin dito, pero posibleng naka-sign in pa rin ang iba pang device.",

  "authMobile.recovery.codeBefore": "Kung may account para sa",
  "authMobile.recovery.codeAfter":
    ", nagpadala kami ng 6-digit code dito. Ilagay ang code sa ibaba para i-reset ang password mo.",
  "authMobile.recovery.updatedBody": "Ayos! Gamit na ang bagong password mo.",
  "authMobile.recovery.googleNoticeBody":
    "Wala kang password. Gamitin ang Continue with Google sa sign-in screen.",

  "authMobile.onboarding.landlord": "Landlord ako",
  "authMobile.onboarding.tenant": "Tenant ako",
  "authMobile.onboarding.slide1.title": "Maligayang pagdating!",
  "authMobile.onboarding.slide1.description":
    "Hanapin ang perfect apartment mo sa ilang tap lang.",
  "authMobile.onboarding.slide2.title": "I-explore ang Rentals",
  "authMobile.onboarding.slide2.description":
    "Mag-browse ng apartments base sa location, presyo, at amenities.",
  "authMobile.onboarding.slide3.title": "Ligtas at Madaling Transaksyon",
  "authMobile.onboarding.slide3.description":
    "Magbayad ng rent nang secure at makipag-chat diretso sa landlord.",
  "authMobile.onboarding.slide4.title": "Mga Verified na Listing",
  "authMobile.onboarding.slide4.description":
    "Lahat ng listing ay verified para sa tiwala at kaligtasan.",

  "authMobile.verify.introTitle":
    "Tulungan kaming panatilihing ligtas ang community.",
  "authMobile.verify.introBody":
    "Mag-upload ng valid ID at mag-selfie para ma-verify ang identity mo at ma-unlock ang lahat ng features.",
  "authMobile.verify.continue": "Ituloy ang Verification",
  "authMobile.verify.scanInstead": "Mag-scan ng QR Code",
  "authMobile.verify.stepProgress": "Hakbang {current} ng {total}",

  "authMobile.verify.failedTitle": "Hindi Nagtagumpay ang Verification",
  "authMobile.verify.failedBody":
    "Hindi namin ma-verify ang identity mo gamit ang mga dokumentong ibinigay.",
  "authMobile.verify.failedReason": "Dahilan: {reason}",
  "authMobile.verify.failedRetry":
    "Subukan muli gamit ang mas malinaw na photo o ibang ID.",
  "authMobile.verify.reapply": "Mag-apply Ulit ng Verification",
  "authMobile.verify.backToProfile": "Bumalik sa Profile",

  "authMobile.verify.submitted": "Naisumite ang Verification",
  "authMobile.verify.submittedBody":
    "Ire-review ng team namin ang ID mo sa lalong madaling panahon. Aabisuhan ka kapag verified na ang account mo.",
  "authMobile.verify.goToProfile": "Pumunta sa Profile",

  "authMobile.capture.front": "Front",
  "authMobile.capture.back": "Back",
  "authMobile.capture.identityPage": "Identity Page",
  "authMobile.capture.selfie": "Selfie",

  "authMobile.verify.selectId.step": "Pumili ng Valid ID",
  "authMobile.verify.selectId.valid": "Listahan ng Valid IDs:",
  "authMobile.verify.selectId.secondary": "Listahan ng Secondary IDs:",

  "authMobile.verify.selfiePrep.step": "Maghanda para sa Selfie",
  "authMobile.verify.selfiePrep.illustration":
    "Illustration para sa selfie preparation",
  "authMobile.verify.selfiePrep.title": "Maghanda para sa selfie mo",
  "authMobile.verify.selfiePrep.body":
    "Ang malinaw na photo ay tumutulong para ma-verify na sa iyo ang ID na ito.",
  "authMobile.verify.selfiePrep.lighting":
    "Gumamit ng maliwanag at pantay na ilaw.",
  "authMobile.verify.selfiePrep.holdId":
    "Hawakan ang parehong ID sa tabi ng mukha mo.",
  "authMobile.verify.selfiePrep.face":
    "Panatilihing kita ang buong mukha mo sa frame.",
  "authMobile.verify.selfiePrep.ready": "Handa na ako",

  "authMobile.verify.uploadId.step": "I-upload ang ID Mo",
  "authMobile.verify.uploadId.reviewHint":
    "I-review ang mga na-capture na ID photo bago magpatuloy.",
  "authMobile.verify.uploadId.openingCamera":
    "Binubuksan ang camera para sa susunod na kailangang ID photo.",
  "authMobile.verify.uploadId.retake": "I-retake ang ID Photos",
  "authMobile.verify.uploadId.continue": "Magpatuloy sa Selfie",
  "authMobile.verify.uploadId.declaration":
    "Kinukumpirma ko na authentic, valid, at akin ang isinumiteng ID.",
  "authMobile.verify.uploadId.photoLoadFailed":
    "Hindi ma-load ang photo. Gamitin ang Retake ID Photos sa ibaba.",
  "authMobile.verify.uploadId.viewFullscreen":
    "Tingnan ang {label} ID photo nang fullscreen",
  "authMobile.verify.uploadId.photoLabel": "{label} ID photo",

  "authMobile.verify.selfie.step": "Kumuha ng Selfie",
  "authMobile.verify.selfie.hint":
    "Siguraduhing maliwanag at tanggalin ang anumang takip sa mukha para sa malinaw na photo.",
  "authMobile.verify.selfie.capture": "Kunan ng Selfie",
  "authMobile.verify.selfie.retake": "I-retake ang Selfie",
  "authMobile.verify.reviewAndSubmit": "I-review at Isumite",

  "authMobile.verify.scan.title": "I-scan ang code mo",
  "authMobile.verify.scan.body":
    "Itutok ang camera sa QR code sa computer mo para ituloy ang verification dito.",
  "authMobile.verify.scan.wrongCode":
    "Hindi APT verification code ang QR code na ito. I-scan ang code na nasa computer mo.",
  "authMobile.verify.scan.claimFailed": "Hindi ma-claim ang code na ito.",
  "authMobile.verify.scan.cameraNeeded": "Kailangan ang camera access",
  "authMobile.verify.scan.restricted":
    "Naka-restrict ang camera access sa device na ito, kaya hindi ma-scan ang code.",
  "authMobile.verify.scan.denied":
    "Payagan ang camera access para ma-scan ang verification QR code mula sa computer mo.",
  "authMobile.verify.scan.openSettings": "Buksan ang Settings",
  "authMobile.verify.scan.allowCamera": "Payagan ang Camera",
  "authMobile.verify.scan.checking": "Sinusuri ang code mo…",
  "authMobile.verify.scan.errorTitle": "Hindi Magamit ang Code na Ito",

  "authMobile.verify.review.title":
    "I-review ang mga dokumento mo bago isumite.",
  "authMobile.verify.review.notice":
    "Ipapadala ang ID photos at selfie mo sa APT administrators para sa manual verification. Aabisuhan ka kapag tapos na ang review.",
  "authMobile.verify.review.submit": "Isumite para sa Verification",
  "authMobile.verify.review.submitting": "Isinusumite…",
  "authMobile.verify.review.retake": "I-retake",
  "authMobile.verify.review.photoLoadFailed":
    "Hindi ma-load ang photo. I-retake ito.",
  "authMobile.verify.review.viewFullscreen":
    "Tingnan ang {label} nang fullscreen",
  "authMobile.verify.review.idLabel": "ID {label}",
  "authMobile.verify.review.idPhotoLabel": "ID {label} photo",
  "authMobile.verify.review.selfieLabel": "Selfie",
  "authMobile.verify.review.selfiePhotoLabel": "Selfie na may hawak na ID",
  "authMobile.verify.review.missingPhotos":
    "Kumpletuhin ang lahat ng kailangang photos.",
  "authMobile.verify.review.submitFailed": "Hindi naisumite ang verification.",
  "authMobile.verify.review.errorTitle": "Hindi Naisumite",
  "authMobile.verify.review.confirmTitle": "Isumite para sa verification?",
  "authMobile.verify.review.confirmBody":
    "I-review ang ID photos at selfie mo bago isumite. Kapag naisumite na, ipapadala ang mga dokumento sa team namin para sa review.",
  "authMobile.verify.review.confirmPhotos":
    "Handa na ang mga kailangang ID photo mo.",
  "authMobile.verify.review.confirmSelfie": "Handa na ang selfie mo.",
  "authMobile.verify.review.confirmAction": "Kumpirmahin at isumite",
  "authMobile.verify.review.cancel": "Bumalik at i-review",

  "authMobile.verify.capture.stepMissing": "Hindi nakita ang capture step.",
  "authMobile.verify.capture.failed": "Hindi nakuhanan ng photo.",
  "authMobile.verify.capture.faceHint":
    "{label}: ilagay ang mukha mo sa loob ng frame",
  "authMobile.verify.capture.idHint":
    "{label}: ilagay ang ID sa loob ng frame",
  "authMobile.verify.capture.captureAction": "Kumuha ng photo",
  "authMobile.verify.capture.fitFace":
    "Ikasya ang mukha mo sa loob ng bilog",
  "authMobile.verify.capture.fitId": "Ikasya ang buong ID sa loob ng frame",
  "authMobile.verify.capture.retake": "I-retake",
  "authMobile.verify.capture.usePhoto": "Gamitin ang Photo",
  "authMobile.verify.capture.permissionTitle":
    "Kailangan ng camera access para makuhanan ng photo ang ID mo.",
  "authMobile.verify.capture.permissionBody":
    "Payagan ang camera access para sa APT sa settings ng device mo para magpatuloy.",
  "authMobile.verify.capture.blockedTitle":
    "Naka-block ang camera access ng device policy.",
  "authMobile.verify.capture.blockedBody":
    "Pinipigilan ng settings ng device mo ang APT na gamitin ang camera. Kontakin ang device administrator mo.",
  "authMobile.verify.capture.cameraFailed": "Hindi nag-start ang camera.",

  "authMobile.personalization.title": "Personalization",
  "authMobile.personalization.cityQuestion":
    "Aling city o area ang gusto mong i-explore?",
  "authMobile.personalization.cityBody":
    "Ilagay ang target city o neighborhood mo para mapaliit ang property search.",
  "authMobile.personalization.budgetQuestion":
    "May budget ka na ba sa isip para sa place mo?",
  "authMobile.personalization.budgetBody":
    "Piliin ang price range na gusto mo para makita ang listings na kasya sa budget mo.",
  "authMobile.personalization.bedroomsQuestion":
    "Ilan ang bedrooms na hinahanap mo?",
  "authMobile.personalization.bedroomsBody":
    "Piliin ang bilang ng bedrooms na gusto mo para ma-filter namin ang properties na bagay sa needs mo.",
  "authMobile.personalization.familyQuestion":
    "Puwede mo bang ibahagi ang family info mo?",
  "authMobile.personalization.familyBody":
    "Tulungan kaming i-personalize ang listings na bagay sa household mo.",
  "authMobile.personalization.preferencesQuestion":
    "Ano ang rental preferences mo?",
  "authMobile.personalization.preferencesBody":
    "Punan ang form at piliin ang tamang sagot para ma-curate ang properties na bagay para sa iyo.",
  "authMobile.personalization.hasPetsQuestion": "May alaga ka ba?",
  "authMobile.personalization.petsQuestion":
    "Kung oo, anong mga klaseng alaga ang meron ka?",
  "authMobile.personalization.petCountQuestion": "Ilan ang alaga mo?",
  "authMobile.personalization.petCountSheet": "Piliin ang Bilang ng Alaga",
  "authMobile.personalization.petCountPlaceholder": "Piliin kung ilan ang alaga mo",
  "authMobile.personalization.hasParkingQuestion":
    "Kailangan mo ba ng parking space?",
  "authMobile.personalization.smokerQuestion":
    "May naninigarilyo ba sa household mo?",
  "authMobile.personalization.petSheet": "Piliin ang Alaga Mo",
  "authMobile.personalization.petPlaceholder":
    "Piliin ang klaseng alaga mo",
  "authMobile.personalization.petSpecify":
    "I-specify ang klaseng alaga mo",
  "authMobile.personalization.petType": "I-type ang klaseng alaga mo",
  "authMobile.personalization.parkingQuestion":
    "Kung oo, ilan ang cars o motorcycles mo?",
  "authMobile.personalization.parkingSheet": "Piliin ang Parking Mo",
  "authMobile.personalization.parkingPlaceholder":
    "Piliin ang bilang ng parking na kailangan mo",
  "authMobile.personalization.vehiclesQuestion":
    "Piliin ang mga klaseng sasakyan mo:",
  "authMobile.personalization.disabilityQuestion":
    "May household member ka bang may disability?",
  "authMobile.personalization.saveFailed":
    "Hindi na-save ang preferences mo",
  "authMobile.personalization.tryAgain": "Subukan muli.",
  "authMobile.personalization.networkBody":
    "I-check ang koneksyon mo at subukan muli.",
  "authMobile.personalization.finish": "Hanapin na natin ang place mo!",
};
