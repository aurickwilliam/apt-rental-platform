import { View, Text } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";

import ScreenWrapper from "components/layout/ScreenWrapper";
import ErrorDialog from "@/components/display/ErrorDialog";

import {
  Alert,
  Button,
  CloseButton,
  FieldError,
  Input,
  Label,
  Spinner,
  TextField,
} from "heroui-native";

import { IconChevronLeft } from "@tabler/icons-react-native";

import { isValidEmail } from "@repo/utils";

import { useColors } from "hooks/useTheme";
import { usePasswordRecoveryStore } from "@/stores/usePasswordRecoveryStore";
import {
  requestPasswordRecovery,
} from "@/service/auth/passwordRecoveryService";
import { PasswordError } from "@/service/auth/passwordErrors";

export default function ForgotPassword() {
  const router = useRouter();
  const { colors } = useColors();

  const savedEmail = usePasswordRecoveryStore((state) => state.email);
  const setRecoveryEmail = usePasswordRecoveryStore((state) => state.setEmail);
  const resetRecovery = usePasswordRecoveryStore((state) => state.reset);

  const [email, setEmail] = useState(savedEmail);
  const [emailError, setEmailError] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleEmailChange = (text: string) => {
    setEmail(text);
    if (emailError) setEmailError("");
  };

  const handleBack = () => {
    resetRecovery();
    router.back();
  };

  const handleSendCode = async () => {
    if (loading) return;

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setEmailError("Please enter your email address.");
      return;
    }
    if (!isValidEmail(trimmedEmail)) {
      setEmailError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      await requestPasswordRecovery(trimmedEmail);
      setRecoveryEmail(trimmedEmail);
      router.push("/forgot-password/otp-verification");
    } catch (err) {
      if (err instanceof PasswordError && err.reason === "invalid_email") {
        setEmailError(err.message);
      } else {
        setError(err instanceof PasswordError ? err.message : "Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper className="p-5" scrollable>
      <View>
        <CloseButton
          variant="ghost"
          className="-ml-2"
          onPress={handleBack}
          accessibilityLabel="Go back"
        >
          <IconChevronLeft size={26} color={colors.textPrimary} />
        </CloseButton>
      </View>

      <View className="flex gap-3 mt-5">
        <Text className="text-secondary text-3xl font-nunitoBold">
          Forgot Password
        </Text>

        <Text className="text-foreground text-base font-inter">
          Don’t worry, it happens! Enter the email address you use to sign in
          and we’ll send you a 6-digit code to reset your password.
        </Text>
      </View>

      <View className="mt-8 flex gap-4">
        <TextField isRequired isInvalid={!!emailError}>
          <Label>Email Address:</Label>
          <Input
            placeholder="Enter your email"
            value={email}
            onChangeText={handleEmailChange}
            onSubmitEditing={handleSendCode}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="emailAddress"
            returnKeyType="send"
            editable={!loading}
          />
          {!!emailError && <FieldError>{emailError}</FieldError>}
        </TextField>

        <Alert>
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>Signed up with Google?</Alert.Title>
            <Alert.Description>
              You don’t have a password. Use Continue with Google on the sign-in
              screen instead.
            </Alert.Description>
          </Alert.Content>
        </Alert>
      </View>

      <View className="flex-1" />

      <Button onPress={handleSendCode} isDisabled={loading} className="mt-8">
        <Button.Label className="font-nunitoSemiBold">
          {loading ? "Sending Code..." : "Send Code"}
        </Button.Label>
        {loading && <Spinner size="sm" color={colors.white} className="ml-2" />}
      </Button>

      <ErrorDialog
        isOpen={!!error}
        onClose={() => setError("")}
        message={error}
      />
    </ScreenWrapper>
  );
}
