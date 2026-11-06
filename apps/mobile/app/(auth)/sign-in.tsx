import { View, Pressable} from "react-native";
import { useState } from "react";
import { Image } from "expo-image";
import { useRouter } from "expo-router";

import { IMAGES } from "constants/images";

import ScreenWrapper from "components/layout/ScreenWrapper";
import AuthDivider from "./components/AuthDivider";
import AuthButton from "./components/AuthButton";
import ErrorDialog from "@/components/display/ErrorDialog";
import AuthLockoutDialog from "@/components/auth/AuthLockoutDialog";
import { useAuthLockout } from "@/hooks/auth/useAuthLockout";
import { useCaptcha } from "@/hooks/auth/useCaptcha";
import { signInViaServer } from "@/service/auth/serverAuthService";

import {
  Button,
  Text,
  TextField,
  Label,
  FieldError,
  LinkButton,
  Input,
  InputGroup,
  Spinner,
} from 'heroui-native';

import {
  IconEye,
  IconEyeOff,
} from "@tabler/icons-react-native";

import { supabase } from "@repo/supabase";

import { useGoogleAuth } from "hooks/auth";
import { clearQueryClient } from "@/utils/queryClient";
import { useColors } from "hooks/useTheme";
import { usePortalStore } from "@/stores/usePortalStore";
import { useSuspensionStore } from "@/stores/useSuspensionStore";
import { hasMobilePortalRole, portalHome } from "@/service/auth/portalPreference";
import {
  buildSuspendedMessage,
  getMySuspensionStatus,
  SUSPENDED_TITLE,
} from "@/service/auth/suspensionService";

import { profileMissingRoute } from "@/service/auth/profileMissingService";

import {
  CAPTCHA_FAILED_MESSAGE,
  CAPTCHA_PENDING_MESSAGE,
  isCaptchaError,
  formatLockoutClock,
  isAuthRateLimitError,
  isValidEmail,
} from "@repo/utils";

export default function SignIn() {
  const { widget: captchaWidget, take: takeCaptcha, takeWhenReady: takeCaptchaWhenReady } = useCaptcha();
  const router = useRouter();
  const { colors } = useColors();

  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  // Attempt limit: the server counts wrong passwords (shared with the website) and
  // reports a lock, which the dialog and the disabled Sign in button show. A
  // reminder on the device keeps it visible after the app is closed.
  const lockout = useAuthLockout("signin", email);
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState<boolean>(false);

  const [emailError, setEmailError] = useState<string>("");
  const [passwordError, setPasswordError] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [errorTitle, setErrorTitle] = useState<string | undefined>(undefined);

  // Set by the suspension guard when a signed-in device was signed out.
  const suspensionNotice = useSuspensionStore((state) => state.notice);

  const {
    signInWithGoogle,
    loading: googleLoading,
    error: googleError,
    errorTitle: googleErrorTitle,
    resetError: resetGoogleError,
  } = useGoogleAuth();

  const handleGoogleSignIn = () => {
    clearQueryClient();
    if (error) setError("");
    if (googleError) resetGoogleError();
    void signInWithGoogle();
  };

  const handleEmailTextChange = (text: string) => {
    setEmail(text);
    if (emailError) setEmailError("");
    if (error) setError("");
  };

  const handlePasswordTextChange = (text: string) => {
    setPassword(text);
    if (passwordError) setPasswordError("");
    if (error) setError("");
  };

  const handleSignIn = async () => {
    // Clear the errors
    setEmailError("");
    setPasswordError("");
    setError("");
    setErrorTitle(undefined);

    // Check the inputs and show errors if invalid
    let isValid = true;

    if (!email.trim()) {
      setEmailError("Please enter your email address.");
      isValid = false;
    } else if (!isValidEmail(email)) {
      setEmailError("Please enter a valid email address.");
      isValid = false;
    }

    if (!password.trim()) {
      setPasswordError("Please enter your password.");
      isValid = false;
    }

    if (!isValid) return;

    if (lockout.isLocked) {
      lockout.setDialogOpen(true);
      return;
    }

    clearQueryClient();
    setLoading(true);
    setError("");

    try {
      // Single-use Turnstile token; Supabase rejects a missing or reused one
      // once CAPTCHA protection is enabled for the project.
      const captcha = takeCaptcha();
      if (captcha.pending) {
        setError(CAPTCHA_PENDING_MESSAGE);
        return;
      }
      // Signs in through the web server, which counts every attempt in the same
      // database windows as the website: the limit cannot be reset from this phone
      // and a lock set on web shows here too. The message never says whether the
      // account exists.
      const { data: authData, error: signInError } = await signInViaServer({
        email: email.trim(),
        password,
        captchaToken: captcha.token,
      });
      if (!signInError) await lockout.clear();

      // Check if there is an error during sign-in and handle it
      if (signInError) {
        if (signInError.retryAfterSeconds) {
          // Attempt limit reached (including by this very attempt): the server says
          // how long it lasts, and the dialog replaces the "invalid password" error.
          lockout.lockFor(signInError.retryAfterSeconds);
        } else if (isCaptchaError(signInError)) {
          setError(CAPTCHA_FAILED_MESSAGE);
        } else if (signInError.code === "invalid_credentials" || signInError.message === "Invalid login credentials") {
          setError("Invalid email or password. Please try again.");
        } else if (signInError.message === "Email not confirmed") {
          // Sign-up was left before the email code was entered: send a fresh
          // code and let the person confirm it here. A throttled resend still
          // lets them use the code they already have.
          const resendCaptcha = await takeCaptchaWhenReady();
          await supabase.auth.resend({
            type: "signup",
            email: email.trim(),
            options: resendCaptcha.token ? { captchaToken: resendCaptcha.token } : undefined,
          });
          router.push({
            pathname: "/(auth)/otp-verification",
            params: { email: email.trim().toLowerCase(), mode: "confirm" },
          });
        } else if (isAuthRateLimitError(signInError)) {
          setError("Too many sign-in attempts. Please try again later.");
        } else {
          setError(signInError.message);
        }
        return;
      }

      // A suspended account authenticates but cannot read its own profile (RLS),
      // so check suspension first and show the reason.
      const suspension = await getMySuspensionStatus();
      if (suspension.suspended) {
        await supabase.auth.signOut();
        setErrorTitle(SUSPENDED_TITLE);
        setError(buildSuspendedMessage(suspension.reason));
        return;
      }

      // Fetch roles from public.users using the auth user id
      const { data: userProfile, error: profileError } = await supabase
        .from("users")
        .select("roles")
        .eq("user_id", authData.user!.id)
        .maybeSingle();

      // Confirmed account whose profile was never saved (sign-up interrupted
      // after the email code): keep the session and finish the profile
      // instead of locking the account out. Suspension was handled above.
      if (!profileError && !userProfile) {
        router.replace(profileMissingRoute(authData.user!.email));
        return;
      }

      if (profileError || !userProfile) {
        setError("Could not load your profile. Please try again.");
        await supabase.auth.signOut();
        return;
      }

      const heldRoles: string[] = userProfile.roles ?? [];
      if (!hasMobilePortalRole(heldRoles)) {
        setError(
          heldRoles.includes("admin")
            ? "Admin accounts are available on the web portal only."
            : "No tenant or landlord account found for this profile.",
        );
        await supabase.auth.signOut(); // clear the session since we're blocking access
        return;
      }

      // A returning account resumes its last authorized portal.
      const portal = await usePortalStore.getState().restore(authData.user!.id, heldRoles);
      if (!portal) {
        setError("No tenant or landlord account found for this profile.");
        await supabase.auth.signOut();
        return;
      }
      router.replace(portalHome(portal));
    } catch (err) {
      await supabase.auth.signOut();
      setError(
        "An unexpected error occurred. Please check your connection and try again.",
      );
      console.error("Sign-in error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper className="p-5" scrollable>
      {/* Logo at the top */}
      <View className="w-32 h-32 mx-auto">
        <Image
          source={IMAGES.logo}
          style={{ width: "100%", height: "100%" }}
          contentFit="contain"
        />
      </View>

      {/* Title at the top */}
      <View className="flex gap-2 mt-5">
        <Text className="text-4xl text-foreground font-nunitoBold">
          Welcome Back!
        </Text>

        <Text className="text-base text-muted font-nunitoSemiBold">
          Log in to continue your apartment journey.
        </Text>
      </View>

      {/* Form inputs */}
      <View className="mt-8 flex gap-4">
        <TextField
            isRequired
            isInvalid={!!emailError}
        >
          <Label>Email Address:</Label>
          <Input
            placeholder="Enter your email"
            value={email}
            onChangeText={handleEmailTextChange}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          {!!emailError && (
              <FieldError>{emailError}</FieldError>
          )}
        </TextField>

        <TextField
          isRequired
          isInvalid={!!passwordError}
        >
          <Label>Password:</Label>

          <InputGroup>
            <InputGroup.Input
              placeholder="Enter your password"
              value={password}
              onChangeText={handlePasswordTextChange}
              secureTextEntry={!showPassword}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setTimeout(() => setIsFocused(false), 150)}
            />

            {isFocused && (
              <InputGroup.Suffix>
                <Pressable
                  onPress={() => setShowPassword(!showPassword)}
                  hitSlop={20}
                >
                  {showPassword ? (
                    <IconEyeOff size={20} color={colors.gray400} />
                  ) : (
                    <IconEye size={20} color={colors.gray400} />
                  )}
                </Pressable>
              </InputGroup.Suffix>
            )}
          </InputGroup>

          {!!passwordError && (
            <FieldError>{passwordError}</FieldError>
          )}
        </TextField>
      </View>

      {/* Forgot Password Link */}
      <LinkButton
        onPress={() => router.push("/forgot-password")}
        className="mt-3 self-start p-0"
      >
        <LinkButton.Label className="text-accent font-nunitoSemiBold underline">
          Forgot Password?
        </LinkButton.Label>
      </LinkButton>

      {captchaWidget}

      {/* Sign In Button */}
      <View className="mt-5">
        <Button
          onPress={handleSignIn}
          isDisabled={loading || lockout.isLocked}
        >
          <Button.Label className="font-nunitoSemiBold">
            {lockout.isLocked
              ? `Try again in ${formatLockoutClock(lockout.secondsLeft)}`
              : loading
                ? "Signing In..."
                : "Sign In"}
          </Button.Label>

          {loading && (
            <Spinner
              size="sm"
              color={colors.white}
              className="ml-2"
            />
          )}
        </Button>
      </View>

      {/* Divider */}
      <AuthDivider middleText="or sign in with" />

      {/* Third-party sign-in options */}
      <View className="flex-row justify-center items-center gap-4 mt-2">
        <AuthButton
          onPress={handleGoogleSignIn}
          isDisabled={googleLoading}
          imageSource={IMAGES.googleLogo}
          label="Continue with Google"
        />
      </View>

      {/* Footer links */}
      <View className="flex-1" />

      <View className="mb-8 mt-10 flex items-center gap-2">
        <View className="flex-row items-center justify-center gap-1">
          <Text className="text-foreground font-inter">
            New here?
          </Text>

          <LinkButton
            onPress={() => router.replace("/sign-up")}
            className="p-0"
          >
            <LinkButton.Label className="text-accent font-nunitoSemiBold underline">
              Sign Up
            </LinkButton.Label>
          </LinkButton>
        </View>
      </View>

      <AuthLockoutDialog
        isOpen={lockout.dialogOpen}
        onOpenChange={lockout.setDialogOpen}
        secondsLeft={lockout.secondsLeft}
      />

      {/* Error Dialog */}
      <ErrorDialog
        isOpen={!!(error || googleError || suspensionNotice)}
        onClose={() => {
          setError("");
          setErrorTitle(undefined);
          resetGoogleError();
          useSuspensionStore.getState().clear();
        }}
        title={
          suspensionNotice ? SUSPENDED_TITLE : googleError ? googleErrorTitle : errorTitle
        }
        message={
          suspensionNotice ? buildSuspendedMessage(suspensionNotice.reason) : googleError || error
        }
      />
    </ScreenWrapper>
  );
}
