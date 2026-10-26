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
} as const;
