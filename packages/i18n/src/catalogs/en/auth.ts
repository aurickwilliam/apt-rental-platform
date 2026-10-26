/** Auth screens, shared by the web `(auth)` group and mobile `(auth)` stack. */
export const auth = {
  "auth.backToHome": "Back to home",
  "auth.signIn.title": "Welcome Back!",
  "auth.signIn.description": "Log in to continue your apartment journey.",
  "auth.signUp.title": "Join Us!",
  "auth.signUp.description.tenant": "Join as tenant to start renting.",
  "auth.signUp.description.landlord": "Join us and start listing your properties in minutes.",
  "auth.orSignInWith": "or sign in with",
  "auth.orSignUpWith": "or sign up with",
  "auth.selectRole": "Select role",
  "auth.role.tenant": "Tenant",
  "auth.role.landlord": "Landlord",
  "auth.email": "Email",
  "auth.password": "Password",
  "auth.confirmPassword": "Confirm password",
  "auth.currentPassword": "Current password",
  "auth.newPassword": "New password",
  "auth.forgotPassword": "Forgot password?",
  "auth.signIn.inline": "Sign in",
  "auth.signIn.action": "Sign In",
  "auth.signUp.action": "Sign Up",

  // Shared credential-flow errors. The reason codes live in `@repo/utils`;
  // only the prose lives here.
  "auth.error.invalidOrExpiredCode":
    "That code is incorrect or has expired. Check the code or request a new one.",
  "auth.error.wrongCurrentPassword": "Your current password is incorrect.",
  "auth.error.rateLimited": "Too many attempts. Please wait a minute before trying again.",
  "auth.error.samePassword": "Your new password must be different from your current password.",
  "auth.error.weakPassword": "This password is too weak. Please choose a stronger password.",
  "auth.error.sessionExpired": "Your reset session has expired. Please request a new code.",
  "auth.error.reauthenticationRequired":
    "For your security, please sign in again before changing your password.",
  "auth.error.reauthenticationEmail":
    "For your security, please sign in again before changing your email.",
  "auth.error.sessionExpiredGeneric": "Your session has expired. Please sign in again.",
  "auth.error.sameEmail": "Enter a different email address from your current one.",
  "auth.error.notEligible": "Only email and password accounts can change their email.",
  "auth.error.emailUnavailable": "This email address can't be used. Try a different one.",
  "auth.error.suspended": "Your account is suspended and can't change its email.",
  "auth.error.noPendingChange":
    "This email change is no longer waiting for confirmation. Start again with your new email.",
  "auth.error.network":
    "Can't connect right now. Check your internet connection and try again.",

  // One-time-code request and attempt feedback.
  "auth.otp.waitOne": "Please wait 1 second before requesting another code.",
  "auth.otp.waitOther": "Please wait {seconds} seconds before requesting another code.",
  "auth.otp.rateLimited":
    "Too many verification emails were requested. Please try again in a few minutes.",
  "auth.otp.tooManyAttempts": "Too many incorrect attempts. Please request a new code.",
  "auth.otp.attemptsLeftOne": "Incorrect or expired code. 1 attempt left.",
  "auth.otp.attemptsLeftOther": "Incorrect or expired code. {count} attempts left.",

  // Change password (Settings → Security on both platforms).
  "auth.changePassword.title": "Change Password",
  "auth.changePassword.close": "Close change password",
  "auth.changePassword.description":
    "Enter your current password, then choose a new one. You’ll stay signed in here, and any other devices will be signed out.",
  "auth.changePassword.currentLabel": "Current Password",
  "auth.changePassword.currentPlaceholder": "Enter your current password",
  "auth.changePassword.currentRequired": "Please enter your current password.",
  "auth.changePassword.required": "This field is required",
  "auth.changePassword.requirements":
    "Password does not meet the requirements or password does not match",
  "auth.changePassword.mismatch": "Passwords do not match",
  "auth.changePassword.action": "Update Password",
  "auth.changePassword.updating": "Updating...",
  "auth.changePassword.successTitle": "Password Updated",
  "auth.changePassword.successBody":
    "Great! Your new password is ready to use. You’re still signed in here, and any other devices were signed out. We’ve also emailed you a confirmation.",
  "auth.changePassword.toastTitle": "Password updated",
  "auth.changePassword.toastBody": "Other devices were signed out.",

  // Change email (Settings → Security on both platforms).
  "auth.changeEmail.title": "Change Email",
  "auth.changeEmail.close": "Close change email",
  "auth.changeEmail.loadingAccount": "Loading your account",
  "auth.changeEmail.description":
    "Enter a new email and your current password. We’ll send a 6-digit code to both your current and new inboxes. Your current email stays active until both codes are confirmed.",
  "auth.changeEmail.currentEmail": "Current Email",
  "auth.changeEmail.newEmail": "New Email",
  "auth.changeEmail.newEmailPlaceholder": "Enter your new email",
  "auth.changeEmail.newEmailRequired": "Please enter a new email address.",
  "auth.changeEmail.step1of2": "Step 1 of 2",
  "auth.changeEmail.step1.title": "Check your current email",
  "auth.changeEmail.step1.body": "Enter it below to confirm this change is really you.",
  "auth.changeEmail.step2of2": "Step 2 of 2",
  "auth.changeEmail.step2.title": "Check your new email",
  "auth.changeEmail.step2.body": "Enter it below to confirm you can receive email there.",
  "auth.changeEmail.sentTo": "We sent a 6-digit code to {email}.",
  "auth.changeEmail.codeAria": "{title} 6-digit code",
  "auth.changeEmail.sendCodes": "Send Verification Codes",
  "auth.changeEmail.successTitle": "Email Updated",
  "auth.changeEmail.successBodyOthersSignedOut":
    "Great! Your new email is ready to use. You’re still signed in here, and any other devices were signed out. We’ve also emailed you a confirmation.",
  "auth.changeEmail.successBodyOthersMayRemain":
    "Great! Your new email is ready to use. You’re still signed in here, but other devices may still be signed in. We’ve also emailed you a confirmation.",
  "auth.changeEmail.toast": "Email updated",
  "auth.changeEmail.profileSyncWarning":
    "Your profile may show your old email for a little while.",
  "auth.changeEmail.newConfirmed":
    "Your new email is confirmed. Now enter the code from your current email.",
  "auth.changeEmail.resendFromCurrent":
    "New codes sent to both inboxes. Enter the code from your current email first.",
  "auth.changeEmail.resendBoth": "New codes are on their way to both inboxes.",

  // Shared auth chrome (sign-in, sign-up, recovery, two-step).
  "auth.backToSignIn": "Back to Sign In",
  "auth.backToSignInAria": "Back to sign in",
  "auth.newHere": "New Here?",
  "auth.createAccount": "Create an account",
  "auth.alreadyHaveAccount": "Already have an account?",
  "auth.wrongEmail": "Wrong email? Change it",
  "auth.showPassword": "Show password",
  "auth.hidePassword": "Hide password",
  "auth.newPasswordLabel": "New Password",
  "auth.newPasswordPlaceholder": "Enter your new password",
  "auth.confirmPasswordLabel": "Confirm Password",
  "auth.confirmPasswordPlaceholder": "Confirm your new password",
  "auth.passwordRule.aria": "Password requirements",
  "auth.passwordRule.minLength": "At least 8 characters",
  "auth.passwordRule.lowercase": "At least one lowercase letter (a–z)",
  "auth.passwordRule.uppercase": "At least one uppercase letter (A–Z)",
  "auth.passwordRule.number": "At least one number (0–9)",
  "auth.passwordRule.special": "At least one special character (e.g. ! @ # $ % ^ & *)",
  "auth.passwordRule.match": "Passwords match",
  "auth.passwordRule.met": ": met",
  "auth.passwordRule.notMet": ": not met",

  // Sign-in / sign-up chrome.
  "auth.emailPlaceholder": "Enter your email",
  "auth.passwordPlaceholder": "Enter your password",
  "auth.checkingEmail": "Checking Email...",
  "auth.signIn.verifyEmail": "Verify Email",
  "auth.signingIn": "Signing In...",
  "auth.google.signIn": "Sign in with Google",
  "auth.google.signUp": "Sign up with Google",
  "auth.resendConfirmation": "Send me a new code",
  "auth.error.emailRequired": "Email is required",
  "auth.error.invalidEmail": "Enter a valid email",
  "auth.error.emailRegistered": "This email is already registered.",
  "auth.error.emailRegisteredHint": "to your existing account to add another role.",
  "auth.error.invalidPassword": "Please enter a valid password",
  "auth.error.passwordRequired": "Please enter your password",
  "auth.error.emailCheck": "Could not validate your email right now. Please try again.",
  "auth.error.grantFailed":
    "We couldn't add that role to your account. Please sign in and try adding it from your profile.",
  "auth.error.wrongPortalLandlord": "This account is not registered as a landlord.",
  "auth.error.wrongPortalTenant": "This account is not registered as a tenant.",
  "auth.error.sendCodeFailed": "Failed to send verification code.",
  "auth.welcome.title": "Welcome!",
  "auth.welcome.body":
    "Looks like this is your first time here — pick a role below to get your account set up.",
  "auth.welcome.finishTitle": "Finish setting up your account",
  "auth.welcome.finishBody":
    "Your email is verified, but your profile was not saved. Pick a role below and re-enter your details to continue.",
  "auth.settingUpAccess": "Setting up {role} access...",
  "auth.continueAs": "Continue as {role}",

  // One-time-code modal.
  "auth.otp.verifyTitle": "Verify Your Email Address",
  "auth.otp.sentTo": "We sent a 6-digit verification code to {email}.",
  "auth.otp.didntReceive": "Didn’t receive a code?",
  "auth.otp.resendIn": "Resend in {seconds}s",
  "auth.otp.resendCode": "Resend Code",
  "auth.otp.sending": "Sending...",
  "auth.otp.verifying": "Verifying...",
  "auth.otp.resend": "Resend",
  "auth.otp.verifyCode": "Verify Code",
  "auth.otp.verifyCreateAccount": "Verify & Create Account",

  // Sign-up form.
  "auth.signUpForm.title": "Complete the {role} Form",
  "auth.signUpForm.description": "Join us and start your apartment rental journey today!",
  "auth.form.personalInfo": "Personal Information",
  "auth.form.addressInfo": "Address Information",
  "auth.form.setPassword": "Set Your Password",
  "auth.form.firstName": "First Name",
  "auth.form.firstNamePlaceholder": "Enter your first name",
  "auth.form.lastName": "Last Name",
  "auth.form.lastNamePlaceholder": "Enter your last name",
  "auth.form.middleName": "Middle Name",
  "auth.form.middleNamePlaceholder": "Enter your middle name (optional)",
  "auth.form.suffix": "Suffix",
  "auth.form.noSuffix": "No suffix",
  "auth.form.gender": "Gender",
  "auth.form.genderPlaceholder": "Select your gender",
  "auth.form.mobile": "Mobile Number",
  "auth.form.mobilePlaceholder": "Enter your mobile number",
  "auth.form.birthDate": "Birth Date",
  "auth.form.birthDateAria": "Birth Date",
  "auth.form.birthDateEntered": "Entered birth date: {value}",
  "auth.form.passwordPlaceholder": "Create a password",
  "auth.form.confirmPasswordPlaceholder": "Confirm your password",
  "auth.form.emailVerified": "Your email is verified.",
  "auth.form.emailVerifiedHint": "to finish setting up your profile.",
  "auth.form.creatingAccount": "Creating Account...",
  "auth.form.completingProfile": "Completing Profile...",
  "auth.form.completeProfile": "Complete Profile",
  "auth.address.province": "State/Province",
  "auth.address.provincePlaceholder": "Select your state/province",
  "auth.address.city": "City",
  "auth.address.cityPlaceholder": "Select your city",
  "auth.address.cityFirst": "Select a province first",
  "auth.address.barangay": "Barangay",
  "auth.address.barangayPlaceholder": "Select your barangay",
  "auth.address.barangayFirst": "Select a city first",
  "auth.address.street": "Street Address",
  "auth.address.streetPlaceholder": "Enter your street address",
  "auth.address.postal": "Postal Code",
  "auth.address.postalPlaceholder": "Enter your postal code",

  // Account created.
  "auth.success.title": "Account Created!",
  "auth.success.tenantBody":
    "Your account has been created. Tell us what you're looking for and we'll tailor your apartment search.",
  "auth.success.landlordBody":
    "Your account has been created successfully. You can now manage your properties from your dashboard.",
  "auth.success.personalize": "Personalize my experience",
  "auth.success.dashboard": "Continue to Dashboard",
  "auth.errorModal.title": "Something went wrong",

  // Password recovery.
  "auth.recovery.requestTitle": "Forgot Password",
  "auth.recovery.requestBody":
    "Don’t worry, it happens! Enter the email address you use to sign in and we’ll send you a 6-digit code to reset your password.",
  "auth.recovery.emailRequired": "Please enter your email address.",
  "auth.recovery.emailInvalid": "Please enter a valid email address.",
  "auth.recovery.sendCode": "Send Code",
  "auth.recovery.sendingCode": "Sending Code...",
  "auth.recovery.codeTitle": "Check your email",
  "auth.recovery.codeBefore": "If an account exists for",
  "auth.recovery.codeAfter":
    ", we sent a 6-digit code to it. Enter the code below to reset your password.",
  "auth.recovery.newCodeSent": "A new code is on its way. Check your inbox.",
  "auth.recovery.googleTitle": "This account uses Google",
  "auth.recovery.googleAfter":
    "signs in with Google, so it doesn’t have a password to reset. Go back and use Continue with Google instead.",
  "auth.recovery.googleNoticeTitle": "Signed up with Google?",
  "auth.recovery.googleNoticeBody":
    "You don’t have a password. Use Continue with Google on the sign-in page instead.",
  "auth.recovery.resetTitle": "Reset Password",
  "auth.recovery.resetBody": "Almost done! Let’s set a fresh new password.",
  "auth.recovery.cancelAria": "Cancel password reset",
  "auth.recovery.saving": "Saving...",
  "auth.recovery.requestNewCode": "Request a new code",
  "auth.recovery.sessionEndedTitle": "Reset session ended",
  "auth.recovery.updatedBody":
    "Great! Your new password is ready to use. For your security, you’ve been signed out everywhere.",

  // Two-step login (admin).
  "auth.twoStep.enrollTitle": "Set up two-step login",
  "auth.twoStep.challengeTitle": "Two-step login",
  "auth.twoStep.enrollBackupBody":
    "Add a backup authenticator app. Either device can sign you in.",
  "auth.twoStep.enrollBody":
    "Admin accounts need a code from an authenticator app each time you sign in.",
  "auth.twoStep.challengeBody": "Enter the 6-digit code from your authenticator app.",
  "auth.twoStep.addBackup": "Add backup device",
  "auth.twoStep.setUp": "Set up authenticator app",
  "auth.twoStep.scan":
    "Scan this QR code with an authenticator app such as Google Authenticator, Microsoft Authenticator or Authy, then enter the code it shows.",
  "auth.twoStep.qrAlt": "QR code for your authenticator app",
  "auth.twoStep.cantScan": "Can’t scan? Enter this key instead:",
  "auth.twoStep.codeAria": "6-digit authenticator code",
  "auth.twoStep.verifyAndTurnOn": "Verify and turn on",
  "auth.twoStep.verify": "Verify",
  "auth.twoStep.signOut": "Sign out",
  "auth.twoStep.tooManyCodes": "Too many incorrect codes. Sign out and try again later.",
} as const;
