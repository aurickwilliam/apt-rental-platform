/**
 * Mobile-only auth journey: onboarding, identity verification and the
 * rental-personalization wizard. The shared `auth` catalog covers the flows
 * both platforms render; this file holds the copy only the mobile screens use.
 */
export const authMobile = {
  // Field labels and verbs the mobile screens spell differently from the web.
  "authMobile.emailLabel": "Email Address:",
  "authMobile.passwordLabel": "Password:",
  "authMobile.newPasswordLabel": "New Password:",
  "authMobile.currentPasswordLabel": "Current Password:",
  "authMobile.confirmPasswordLabel": "Confirm Password:",
  "authMobile.currentEmailLabel": "Current Email:",
  "authMobile.newEmailLabel": "New Email:",
  "authMobile.mobileLabel": "Mobile Number:",
  "authMobile.forgotPassword": "Forgot Password?",
  "authMobile.newHere": "New here?",
  "authMobile.continueWithGoogle": "Continue with Google",
  "authMobile.somethingWentWrong": "Something went wrong",
  "authMobile.errorGeneric": "Something went wrong. Please try again.",
  "authMobile.emailInvalid": "Please enter a valid email address.",
  "authMobile.goBack": "Go back",
  "authMobile.backToSettings": "Back to Settings",
  "authMobile.createPasswordPlaceholder": "Create a password",
  "authMobile.confirmPasswordPlaceholder": "Confirm your password",
  "authMobile.passwordMustContain": "Your password must contain:",
  "authMobile.showPasswordFor": "Show {field}",
  "authMobile.hidePasswordFor": "Hide {field}",

  // Sign in.
  "authMobile.signIn.passwordRequired": "Please enter your password.",
  "authMobile.signIn.emailRequired": "Please enter your email address.",
  "authMobile.signIn.invalidCredentials":
    "Invalid email or password. Please try again.",
  "authMobile.signIn.rateLimited":
    "Too many sign-in attempts. Please try again later.",
  "authMobile.signIn.profileLoadFailed":
    "Could not load your profile. Please try again.",
  "authMobile.signIn.adminWebOnly":
    "Admin accounts are available on the web portal only.",
  "authMobile.signIn.noPortal":
    "No tenant or landlord account found for this profile.",
  "authMobile.signIn.unexpected":
    "An unexpected error occurred. Please check your connection and try again.",

  // Google sign-in failures.
  "authMobile.google.noCode": "Authentication failed. No code returned.",
  "authMobile.google.exchangeFailed": "Failed to establish session.",
  "authMobile.google.profileLoadFailed": "Could not load your profile.",
  "authMobile.google.noMobileRole": "No supported mobile role found.",
  "authMobile.google.startFailed":
    "Failed to initiate Google sign-in. Please try again.",
  "authMobile.google.incomplete": "Sign-in was not completed. Please try again.",
  "authMobile.google.unexpected": "Unexpected error occurred.",
  "authMobile.google.unexpectedRetry":
    "An unexpected error occurred. Please try again.",

  // Account suspension.
  "authMobile.suspended.title": "Account suspended",
  "authMobile.suspended.message":
    "Your account has been suspended. Contact support if you think this is a mistake.",
  "authMobile.suspended.messageWithReason":
    "Your account has been suspended.\n\nReason: {reason}\n\nContact support if you think this is a mistake.",

  // Sign up.
  "authMobile.signUp.title": "Create Your Account",
  "authMobile.signUp.emailRequired": "Email address is required.",
  "authMobile.signUp.emailRegistered":
    "This email is already registered. Please sign in instead.",

  // Profile completion (sign-up and finish-profile).
  "authMobile.completeProfile.title": "Complete Your {role} Profile",
  "authMobile.completeProfile.accountSecurity": "Account Security",
  "authMobile.chooseAccountType": "Choose your account type",
  "authMobile.useDifferentAccount": "Use a different account",

  // One-time-code screen.
  "authMobile.otp.sentTitle": "OTP was Sent!",
  "authMobile.otp.sentBody":
    "We've sent a 6-digit verification code to your email address. Please enter the code sent to {email}.",
  "authMobile.otp.didntGetCode": "Didn't get the code?",
  "authMobile.otp.verifiedFinishProfile":
    "Your email is verified, so you can sign in to finish setting up your profile.",

  // Mobile-number step.
  "authMobile.verifyMobile.title": "Enter Your Mobile Number",

  // Settings → Change email.
  "authMobile.changeEmail.invalidEmail": "Enter a valid email address.",
  "authMobile.changeEmail.sendingCodes": "Sending codes...",
  "authMobile.changeEmail.sentBefore": "We’ve sent a 6-digit code to",
  "authMobile.changeEmail.newConfirmed": "New email confirmed",
  "authMobile.changeEmail.newConfirmedBody":
    "Now enter the code from your current email.",
  "authMobile.changeEmail.newCodesSent": "New codes sent",
  "authMobile.changeEmail.resendFromCurrentBody":
    "Enter the code from your current email first.",
  "authMobile.changeEmail.successBodySignedOut":
    "Great! Your new email is ready to use. You’re still signed in here, and any other devices were signed out.",
  "authMobile.changeEmail.successBodyOthersMayRemain":
    "Great! Your new email is ready to use. You’re still signed in here, but other devices may still be signed in.",

  // Password recovery.
  "authMobile.recovery.codeBefore": "If an account exists for",
  "authMobile.recovery.codeAfter":
    ", we’ve sent a 6-digit code to it. Enter the code below to reset your password.",
  "authMobile.recovery.updatedBody": "Great! Your new password is ready to use.",
  "authMobile.recovery.googleNoticeBody":
    "You don’t have a password. Use Continue with Google on the sign-in screen instead.",

  // Onboarding carousel.
  "authMobile.onboarding.landlord": "I'm a Landlord",
  "authMobile.onboarding.tenant": "I'm a Tenant",
  "authMobile.onboarding.slide1.title": "Welcome!",
  "authMobile.onboarding.slide1.description":
    "Find your perfect apartment in just a few taps.",
  "authMobile.onboarding.slide2.title": "Explore Rentals",
  "authMobile.onboarding.slide2.description":
    "Browse apartments by location, price, and amenities.",
  "authMobile.onboarding.slide3.title": "Secure & Easy Transactions",
  "authMobile.onboarding.slide3.description":
    "Pay rent securely and chat directly with landlords.",
  "authMobile.onboarding.slide4.title": "Verified Listings",
  "authMobile.onboarding.slide4.description":
    "All listings are verified to ensure trust and safety.",

  // Identity verification — intro.
  "authMobile.verify.introTitle": "Help us keep our community safe.",
  "authMobile.verify.introBody":
    "Upload a valid ID and take a quick selfie to verify your identity and unlock all features.",
  "authMobile.verify.continue": "Continue Verification",
  "authMobile.verify.scanInstead": "Scan a QR Code Instead",
  "authMobile.verify.stepProgress": "Step {current} of {total}",

  // Identity verification — rejected.
  "authMobile.verify.failedTitle": "Verification Failed",
  "authMobile.verify.failedBody":
    "We couldn't verify your identity with the documents provided.",
  "authMobile.verify.failedReason": "Reason: {reason}",
  "authMobile.verify.failedRetry":
    "Please try again with a clearer photo or a different ID.",
  "authMobile.verify.reapply": "Re-Apply for Verification",
  "authMobile.verify.backToProfile": "Back to Profile",

  // Identity verification — submitted.
  "authMobile.verify.submitted": "Verification Submitted",
  "authMobile.verify.submittedBody":
    "Our team will review your ID shortly. You’ll be notified once your account is verified.",
  "authMobile.verify.goToProfile": "Go to Profile",

  // Capture step labels (stored step ids stay `front`, `back`, …).
  "authMobile.capture.front": "Front",
  "authMobile.capture.back": "Back",
  "authMobile.capture.identityPage": "Identity Page",
  "authMobile.capture.selfie": "Selfie",

  // Select an ID type.
  "authMobile.verify.selectId.step": "Select a Valid ID",
  "authMobile.verify.selectId.valid": "List of Valid IDs:",
  "authMobile.verify.selectId.secondary": "List of Secondary IDs:",

  // Selfie preparation.
  "authMobile.verify.selfiePrep.step": "Prepare for a Selfie",
  "authMobile.verify.selfiePrep.illustration":
    "Selfie preparation illustration",
  "authMobile.verify.selfiePrep.title": "Get ready for your selfie",
  "authMobile.verify.selfiePrep.body":
    "A clear photo helps us verify that your ID belongs to you.",
  "authMobile.verify.selfiePrep.lighting": "Use bright, even lighting.",
  "authMobile.verify.selfiePrep.holdId": "Hold the same ID beside your face.",
  "authMobile.verify.selfiePrep.face":
    "Keep your full face visible in the frame.",
  "authMobile.verify.selfiePrep.ready": "I'm Ready",

  // Upload ID.
  "authMobile.verify.uploadId.step": "Upload Your ID",
  "authMobile.verify.uploadId.reviewHint":
    "Review your captured ID photos before continuing.",
  "authMobile.verify.uploadId.openingCamera":
    "Opening your camera for the next required ID photo.",
  "authMobile.verify.uploadId.retake": "Retake ID Photos",
  "authMobile.verify.uploadId.continue": "Continue to Selfie",
  "authMobile.verify.uploadId.declaration":
    "I confirm that the submitted ID is authentic, valid, and belongs to me.",
  "authMobile.verify.uploadId.photoLoadFailed":
    "Photo couldn't load. Please use Retake ID Photos below.",
  "authMobile.verify.uploadId.viewFullscreen":
    "View {label} ID photo fullscreen",
  "authMobile.verify.uploadId.photoLabel": "{label} ID photo",

  // Upload selfie.
  "authMobile.verify.selfie.step": "Take a Selfie",
  "authMobile.verify.selfie.hint":
    "Ensure good lighting and remove any face coverings for a clear photo.",
  "authMobile.verify.selfie.capture": "Capture Selfie",
  "authMobile.verify.selfie.retake": "Retake Selfie",
  "authMobile.verify.reviewAndSubmit": "Review & Submit",

  // Desktop QR session.
  "authMobile.verify.scan.title": "Scan your code",
  "authMobile.verify.scan.body":
    "Point your camera at the QR code on your computer to continue verification here.",
  "authMobile.verify.scan.wrongCode":
    "This QR code is not an APT verification code. Please scan the code shown on your computer.",
  "authMobile.verify.scan.claimFailed": "Could not claim this code.",
  "authMobile.verify.scan.cameraNeeded": "Camera access needed",
  "authMobile.verify.scan.restricted":
    "Camera access is restricted on this device, so the code cannot be scanned.",
  "authMobile.verify.scan.denied":
    "Allow camera access to scan the verification QR code from your computer.",
  "authMobile.verify.scan.openSettings": "Open Settings",
  "authMobile.verify.scan.allowCamera": "Allow Camera",
  "authMobile.verify.scan.checking": "Checking your code…",
  "authMobile.verify.scan.errorTitle": "Could Not Use This Code",

  // Review before submitting.
  "authMobile.verify.review.title": "Review your documents before submitting.",
  "authMobile.verify.review.notice":
    "Your ID photos and selfie will be sent to APT administrators for manual verification. You’ll be notified once the review is complete.",
  "authMobile.verify.review.submit": "Submit for Verification",
  "authMobile.verify.review.submitting": "Submitting…",
  "authMobile.verify.review.retake": "Retake",
  "authMobile.verify.review.photoLoadFailed":
    "Photo couldn't load. Please retake it.",
  "authMobile.verify.review.viewFullscreen": "View {label} fullscreen",
  "authMobile.verify.review.idLabel": "ID {label}",
  "authMobile.verify.review.idPhotoLabel": "ID {label} photo",
  "authMobile.verify.review.selfieLabel": "Selfie",
  "authMobile.verify.review.selfiePhotoLabel": "Selfie holding your ID",
  "authMobile.verify.review.missingPhotos":
    "Please complete all required photos.",
  "authMobile.verify.review.submitFailed": "Failed to submit verification.",
  "authMobile.verify.review.errorTitle": "Submission Failed",
  "authMobile.verify.review.confirmTitle": "Submit for verification?",
  "authMobile.verify.review.confirmBody":
    "Please review your ID photos and selfie before submitting. Once submitted, your documents will be sent to our team for review.",
  "authMobile.verify.review.confirmPhotos":
    "Your required ID photos are ready.",
  "authMobile.verify.review.confirmSelfie": "Your selfie is ready.",
  "authMobile.verify.review.confirmAction": "Confirm & submit",
  "authMobile.verify.review.cancel": "Go back and review",

  // Live camera capture.
  "authMobile.verify.capture.stepMissing":
    "The capture step could not be found.",
  "authMobile.verify.capture.failed": "Failed to capture photo.",
  "authMobile.verify.capture.faceHint":
    "{label}: position your face within the frame",
  "authMobile.verify.capture.idHint":
    "{label}: position the ID within the frame",
  "authMobile.verify.capture.captureAction": "Capture photo",
  "authMobile.verify.capture.fitFace": "Fit your face inside the circle",
  "authMobile.verify.capture.fitId": "Fit the entire ID inside the frame",
  "authMobile.verify.capture.retake": "Retake",
  "authMobile.verify.capture.usePhoto": "Use Photo",
  "authMobile.verify.capture.permissionTitle":
    "Camera access is required to capture a photo of your ID.",
  "authMobile.verify.capture.permissionBody":
    "Please enable camera access for APT in your device settings to continue.",
  "authMobile.verify.capture.blockedTitle":
    "Camera access is blocked by device policy.",
  "authMobile.verify.capture.blockedBody":
    "Your device’s settings prevent APT from accessing the camera. Please contact your device administrator.",
  "authMobile.verify.capture.cameraFailed": "The camera couldn’t start.",

  // Rental personalization wizard.
  "authMobile.personalization.title": "Personalization",
  "authMobile.personalization.cityQuestion":
    "Which city or area would you like to explore?",
  "authMobile.personalization.cityBody":
    "Enter your target city or neighborhood to narrow down property searches.",
  "authMobile.personalization.budgetQuestion":
    "Got a budget in mind for your place?",
  "authMobile.personalization.budgetBody":
    "Select your preferred price range to see listings that fit your budget.",
  "authMobile.personalization.bedroomsQuestion":
    "How many bedrooms are you looking for?",
  "authMobile.personalization.bedroomsBody":
    "Select the number of bedrooms you prefer so we can filter properties that fit your needs.",
  "authMobile.personalization.familyQuestion":
    "Can you share with us your family information?",
  "authMobile.personalization.familyBody":
    "Help us personalize listings that fit your household.",
  "authMobile.personalization.preferencesQuestion":
    "What is your rental preferences?",
  "authMobile.personalization.preferencesBody":
    "Fill-up the form and select the appropriate response to curate the properties that will fit for you.",
  "authMobile.personalization.hasPetsQuestion": "Do you have any pets?",
  "authMobile.personalization.petsQuestion":
    "If yes, what kind of pet do you have?",
  "authMobile.personalization.hasParkingQuestion":
    "Do you need a parking space?",
  "authMobile.personalization.smokerQuestion":
    "Is anyone in your household a smoker?",
  "authMobile.personalization.petSheet": "Select your Pet",
  "authMobile.personalization.petPlaceholder":
    "Select the kind of pets you have",
  "authMobile.personalization.petSpecify":
    "Please specify the kind of pet you have",
  "authMobile.personalization.petType": "Type the kind of pet you have",
  "authMobile.personalization.parkingQuestion":
    "If yes, how many cars or motorcycles do you have?",
  "authMobile.personalization.parkingSheet": "Select your Parking",
  "authMobile.personalization.parkingPlaceholder":
    "Select the number of parking you need",
  "authMobile.personalization.vehiclesQuestion":
    "Select the kinds of vehicles you have:",
  "authMobile.personalization.disabilityQuestion":
    "Do you have any household members with a disability?",
  "authMobile.personalization.saveFailed": "Couldn't save your preferences",
  "authMobile.personalization.tryAgain": "Please try again.",
  "authMobile.personalization.networkBody":
    "Check your connection and try again.",
  "authMobile.personalization.finish": "Let's find your place!",
} as const;
