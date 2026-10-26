import { View, Pressable} from "react-native";
import { useState } from "react";
import { Image } from "expo-image";
import { useRouter } from "expo-router";

import { IMAGES } from "constants/images";

import ScreenWrapper from "components/layout/ScreenWrapper";
import AuthDivider from "./components/AuthDivider";
import AuthButton from "./components/AuthButton";
import AuthLanguageToggle from "./components/AuthLanguageToggle";
import ErrorDialog from "@/components/display/ErrorDialog";

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
import { useTranslation } from "hooks/i18n";
import { clearQueryClient } from "@/utils/queryClient";
import { useColors } from "hooks/useTheme";
import { usePortalStore } from "@/stores/usePortalStore";
import { useSuspensionStore } from "@/stores/useSuspensionStore";
import { hasMobilePortalRole, portalHome } from "@/service/auth/portalPreference";
import {
  buildSuspendedMessage,
  getMySuspensionStatus,
  suspendedTitle,
} from "@/service/auth/suspensionService";

import { profileMissingRoute } from "@/service/auth/profileMissingService";

import { isValidEmail } from "@repo/utils";

export default function SignIn() {
  const router = useRouter();
  const { colors } = useColors();
  const { language, t } = useTranslation();

  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
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
      setEmailError(t("authMobile.signIn.emailRequired"));
      isValid = false;
    } else if (!isValidEmail(email)) {
      setEmailError(t("authMobile.emailInvalid"));
      isValid = false;
    }

    if (!password.trim()) {
      setPasswordError(t("authMobile.signIn.passwordRequired"));
      isValid = false;
    }

    if (!isValid) return;

    clearQueryClient();
    setLoading(true);
    setError("");

    try {
      // Attempt to sign in with Supabase
      // Using email and password
      const { data: authData, error: signInError } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

      // Check if there is an error during sign-in and handle it
      if (signInError) {
        if (signInError.message === "Invalid login credentials") {
          setError(t("authMobile.signIn.invalidCredentials"));
        } else if (signInError.message === "Email not confirmed") {
          // Sign-up was left before the email code was entered: send a fresh
          // code and let the person confirm it here. A throttled resend still
          // lets them use the code they already have.
          await supabase.auth.resend({ type: "signup", email: email.trim() });
          router.push({
            pathname: "/(auth)/otp-verification",
            params: { email: email.trim().toLowerCase(), mode: "confirm" },
          });
        } else if (signInError.message.includes("rate limit")) {
          setError(t("authMobile.signIn.rateLimited"));
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
        setErrorTitle(suspendedTitle(language));
        setError(buildSuspendedMessage(suspension.reason, language));
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
        setError(t("authMobile.signIn.profileLoadFailed"));
        await supabase.auth.signOut();
        return;
      }

      const heldRoles: string[] = userProfile.roles ?? [];
      if (!hasMobilePortalRole(heldRoles)) {
        setError(
          heldRoles.includes("admin")
            ? t("authMobile.signIn.adminWebOnly")
            : t("authMobile.signIn.noPortal"),
        );
        await supabase.auth.signOut(); // clear the session since we're blocking access
        return;
      }

      // A returning account resumes its last authorized portal.
      const portal = await usePortalStore.getState().restore(authData.user!.id, heldRoles);
      if (!portal) {
        setError(t("authMobile.signIn.noPortal"));
        await supabase.auth.signOut();
        return;
      }
      router.replace(portalHome(portal));
    } catch (err) {
      await supabase.auth.signOut();
      setError(t("authMobile.signIn.unexpected"));
      console.error("Sign-in error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper className="p-5" scrollable>
      {/* Logo with the language switch in the top-right */}
      <View className="relative">
        <View className="w-32 h-32 mx-auto">
          <Image
            source={IMAGES.logo}
            style={{ width: "100%", height: "100%" }}
            contentFit="contain"
          />
        </View>
        <View className="absolute right-0 top-0">
          <AuthLanguageToggle />
        </View>
      </View>

      {/* Title at the top */}
      <View className="flex gap-2 mt-5">
        <Text className="text-4xl text-foreground font-nunitoBold">
          {t("auth.signIn.title")}
        </Text>

        <Text className="text-base text-muted font-nunitoSemiBold">
          {t("auth.signIn.description")}
        </Text>
      </View>

      {/* Form inputs */}
      <View className="mt-8 flex gap-4">
        <TextField
            isRequired
            isInvalid={!!emailError}
        >
          <Label>{t("authMobile.emailLabel")}</Label>
          <Input
            placeholder={t("auth.emailPlaceholder")}
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
          <Label>{t("authMobile.passwordLabel")}</Label>

          <InputGroup>
            <InputGroup.Input
              placeholder={t("auth.passwordPlaceholder")}
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
          {t("authMobile.forgotPassword")}
        </LinkButton.Label>
      </LinkButton>

      {/* Sign In Button */}
      <View className="mt-5">
        <Button
          onPress={handleSignIn}
          isDisabled={loading}
        >
          <Button.Label className="font-nunitoSemiBold">
            {loading ? t("auth.signingIn") : t("auth.signIn.action")}
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
      <AuthDivider middleText={t("auth.orSignInWith")} />

      {/* Third-party sign-in options */}
      <View className="flex-row justify-center items-center gap-4 mt-2">
        <AuthButton
          onPress={handleGoogleSignIn}
          isDisabled={googleLoading}
          imageSource={IMAGES.googleLogo}
          label={t("authMobile.continueWithGoogle")}
        />
      </View>

      {/* Footer links */}
      <View className="flex-1" />

      <View className="mb-8 mt-10 flex items-center gap-2">
        <View className="flex-row items-center justify-center gap-1">
          <Text className="text-foreground font-inter">
            {t("authMobile.newHere")}
          </Text>

          <LinkButton
            onPress={() => router.replace("/sign-up")}
            className="p-0"
          >
            <LinkButton.Label className="text-accent font-nunitoSemiBold underline">
              {t("auth.signUp.action")}
            </LinkButton.Label>
          </LinkButton>
        </View>
      </View>

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
          suspensionNotice
            ? suspendedTitle(language)
            : googleError
              ? googleErrorTitle
              : errorTitle
        }
        message={
          suspensionNotice
            ? buildSuspendedMessage(suspensionNotice.reason, language)
            : googleError || error
        }
      />
    </ScreenWrapper>
  );
}
