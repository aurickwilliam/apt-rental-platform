import { View, Text, Pressable } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useRef, useState } from "react";

import ScreenWrapper from "@/components/layout/ScreenWrapper";

import {
  Button,
  CloseButton,
  InputOTP,
  type InputOTPRef,
  REGEXP_ONLY_DIGITS,
} from "heroui-native";

import { IconChevronLeft } from '@tabler/icons-react-native';

import { useColors } from "@/hooks/useTheme";
import { useCountdown } from "@/hooks/auth";

const RESEND_COOLDOWN = 30 // seconds

export default function OTPVerification() {
  const { method } = useLocalSearchParams();
  const router = useRouter();
  const { colors } = useColors();

  const [value, setValue] = useState("");
  const ref = useRef<InputOTPRef>(null);

  const { countdown, reset: resetCountdown } = useCountdown({
    duration: RESEND_COOLDOWN,
  });

  const mobileNum = "1234567890";
  const email = "johndoe@gmail.com";

  const lastFourDigits = String(mobileNum).slice(-4);

  const handleResend = () => {
    resetCountdown();
    setValue("");
    ref.current?.clear();
  };

  const handleVerify = () => {
    console.log("OTP Verified:", value);
    router.push("/(auth)/forgot-password/reset-password");
  };

  const userInfo = method === "sms" ? `****-***-${lastFourDigits}` : email;

  return (
    <ScreenWrapper className="px-5">
      <View>
        <CloseButton onPress={() => router.back()} className="my-5">
          <IconChevronLeft size={26} color={colors.textPrimary} />
        </CloseButton>
      </View>

      <View className="flex gap-3">
        <Text className="text-foreground text-2xl font-nunitoBold">
          OTP was Sent!
        </Text>

        <Text className="text-base text-foreground font-inter mb-5">
          We&apos;ve sent a 6-digit code to your{" "}
          {method === "sms" ? "phone number ending in" : "email"}{" "}
          {userInfo}.
        </Text>

        <View className="items-center mb-6">
          <InputOTP
            ref={ref}
            value={value}
            onChange={setValue}
            onComplete={handleVerify}
            maxLength={6}
            inputMode="numeric"
            pattern={REGEXP_ONLY_DIGITS}
          >
            <InputOTP.Group>
              <InputOTP.Slot index={0} />
              <InputOTP.Slot index={1} />
              <InputOTP.Slot index={2} />
            </InputOTP.Group>
            <InputOTP.Separator />
            <InputOTP.Group>
              <InputOTP.Slot index={3} />
              <InputOTP.Slot index={4} />
              <InputOTP.Slot index={5} />
            </InputOTP.Group>
          </InputOTP>
        </View>

        <View className="flex-row items-center">
          <Text className="text-muted text-base">
            Didn&apos;t get the code?{" "}
          </Text>
          {countdown > 0 ? (
            <Text className="text-accent text-base font-nunitoSemiBold">
              Resend in {countdown}s
            </Text>
          ) : (
            <Pressable onPress={handleResend}>
              <Text className="text-accent text-base font-nunitoSemiBold">
                Resend
              </Text>
            </Pressable>
          )}
        </View>
      </View>

      <View className="flex-1" />

      <Button onPress={handleVerify}>
        <Button.Label>Verify & Reset Password</Button.Label>
      </Button>
    </ScreenWrapper>
  );
}
