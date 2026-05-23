import { View, Image } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";

import ScreenWrapper from "components/layout/ScreenWrapper";
import AppInput from "components/inputs/AppInput";

import { IMAGES } from "constants/images";
import { COLORS } from "@repo/constants";

import { useGoogleAuth } from "hooks/useGoogleAuth";

import { supabase } from "@repo/supabase"

import { Tabs, Text, TextField, LinkButton, Label, FieldError, Button, Separator} from "heroui-native";

const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export default function SignUp() {
  const [email, setEmail] = useState<string>("");
  const [emailError, setEmailError] = useState<string>("");
  const [userSide, setUserSide] = useState<"tenant" | "landlord">("tenant");
  const [checkingEmail, setCheckingEmail] = useState<boolean>(false);

  const router = useRouter();
  const { userType } = useLocalSearchParams<{ userType: string }>();

  const {
    signInWithGoogle,
    loading: googleLoading,
    error: googleError,
  } = useGoogleAuth();

  useEffect(() => {
    setUserSide(userType === "landlord" ? "landlord" : "tenant");
  }, [userType]);

  const handleEmailTextChange = (text: string) => {
    setEmail(text);
    if (emailError) setEmailError("");
  };

  const handleSignUp = async () => {
    if (!email.trim()) {
      setEmailError("Email address is required.");
      return;
    }

    if (!isValidEmail(email)) {
      setEmailError("Please enter a valid email address.");
      return;
    }

    try {
      setCheckingEmail(true);

      const { count, error } = await supabase
        .from("users")
        .select("id", { count: "exact", head: true })
        .eq("email", email.trim().toLowerCase());

      if (error) {
        setEmailError("Something went wrong. Please try again.");
        return;
      }

      if (count && count > 0) {
        setEmailError("This email is already registered. Please sign in instead.");
        return;
      }

      router.push({
        pathname: "/(auth)/complete-profile",
        params: { email: email.trim().toLowerCase(), userSide },
      });
    } catch {
      setEmailError("Something went wrong. Please try again.");
    } finally {
      setCheckingEmail(false);
    }
  };

  return (
    <ScreenWrapper className="p-5">
      {/* Logo at the top */}
      <View className="w-32 h-32 mx-auto">
        <Image
          source={IMAGES.logo}
          style={{ width: "100%", height: "100%" }}
          resizeMode="contain"
        />
      </View>

      {/* Title at the top */}
      <View className="flex gap-2 mt-5">
        <Text className="text-3xl text-text font-nunitoSemiBold">
          Create Your Account
        </Text>

        <Text className="text-base text-text font-interMedium">
          {userSide === "tenant"
            ? "Join as tenant to start renting."
            : "Join us and start listing your properties in minutes."}
        </Text>
      </View>

      {/* Tab Group User Side */}
      <Tabs
        value={userSide}
        onValueChange={(val) => {
          setUserSide(val as "tenant" | "landlord");
        }}
        variant="primary"
        className="mt-5"
      >
        <Tabs.List className="w-full">
          <Tabs.Indicator />

          <Tabs.Trigger value="tenant" className="w-1/2">
            {({ isSelected }) => (
              <Tabs.Label
                style={{ color: isSelected ? COLORS.primary : COLORS.grey }}
              >
                Tenant
              </Tabs.Label>
            )}
          </Tabs.Trigger>

          <Tabs.Trigger value="landlord" className="w-1/2">
            {({ isSelected }) => (
              <Tabs.Label
                style={{ color: isSelected ? COLORS.secondary : COLORS.grey }}
              >
                Landlord
              </Tabs.Label>
            )}
          </Tabs.Trigger>
        </Tabs.List>
      </Tabs>

      {googleError ? (
        <View className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <Text className="text-sm text-red-600 font-inter">
            {googleError}
          </Text>
        </View>
      ) : null}

      {/* Form inputs */}
      <View className="mt-8">
        <TextField
          isRequired
          isInvalid={!!emailError && !email.trim()}
        >
          <Label>Email Address:</Label>
          <AppInput 
            placeholder="Enter your email"
            value={email}
            onChangeText={handleEmailTextChange}
          />

          {!!emailError && !email.trim() && (
              <FieldError>Please enter your email address.</FieldError>
          )}
        </TextField>
      </View>

      {/* Sign In Button */}
      <View className="mt-5">
        {/* <PillButton
          label={checkingEmail ? "Please wait..." : "Continue"}
          isFullWidth={true}
          onPress={handleSignUp}
          isDisabled={checkingEmail}
        /> */}
        <Button
          onPress={handleSignUp}
          isDisabled={checkingEmail}
        >
          <Button.Label className="font-interMedium">
            {checkingEmail ? "Please wait..." : "Continue"}
          </Button.Label>
        </Button>
      </View>

      {/* Divider */}
      <View className="flex-row justify-center items-center my-5">
        <Separator orientation="horizontal" className="flex-1" />

        <Text className="mx-3 text-grey-400 font-inter">
          or sign up with
        </Text>

        <Separator orientation="horizontal" className="flex-1" />
      </View>

      {/* Third-party sign-in options */}
      <View className="flex-row justify-center items-center gap-4 mt-2">
        <Button
          variant="outline"
          onPress={() => signInWithGoogle(userSide)}
          isDisabled={googleLoading}
          className="flex-1"
        >
          <Image
            source={IMAGES.googleLogo}
            style={{ width: 20, height: 20 }}
            resizeMode="contain"
          />
          <Button.Label className="font-interMedium text-text">
            Continue with Google
          </Button.Label>
        </Button>
      </View>

      {/* Footer links */}
      <View className="flex-1" />

      <View className="mb-8 flex items-center gap-2">
        <View className="flex-row items-center justify-center gap-1">
          <Text className="text-text font-inter">
            Already have an account?
          </Text>

          <LinkButton
            onPress={() => router.replace("/sign-in")}
            className="p-0"
          >
            <LinkButton.Label className="text-primary font-interMedium underline">
              Sign In
            </LinkButton.Label>
          </LinkButton>
        </View>
      </View>
    </ScreenWrapper>
  );
}
