import { View, Image } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";

import ScreenWrapper from "components/layout/ScreenWrapper";
import AuthDivider from "./components/AuthDivider";
import RoleTab from "./components/RoleTab";
import AuthButton from "./components/AuthButton";

import { IMAGES } from "constants/images";

import { useGoogleAuth } from "hooks/useGoogleAuth";
import { supabase } from "@repo/supabase"

import { isValidEmail } from "@repo/utils";

import { 
  Text, 
  TextField, 
  LinkButton, 
  Label, 
  FieldError, 
  Button,
  Input, 
} from "heroui-native";

export default function SignUp() {
  const router = useRouter();
  const { userType } = useLocalSearchParams<{ userType: string }>();

  const [email, setEmail] = useState<string>("");
  const [emailError, setEmailError] = useState<string>("");
  const [checkingEmail, setCheckingEmail] = useState<boolean>(false);

  const [userSide, setUserSide] = useState<"tenant" | "landlord">("tenant");

  useEffect(() => {
    setUserSide(userType === "landlord" ? "landlord" : "tenant");
  }, [userType]);

  const {
    signInWithGoogle,
    loading: googleLoading,
    error: googleError,
  } = useGoogleAuth();

  const handleGoogleSignIn = () => {
    if (emailError) setEmailError("");
    void signInWithGoogle(userSide);
  };

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
        params: { 
          email: email.trim().toLowerCase(), 
          userSide 
        },
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
      <RoleTab 
        userSide={userSide}
        onValueChange={(val) => {
          setUserSide(val as "tenant" | "landlord");
          if (emailError) setEmailError("");
        }}
      />

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
          <Input 
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
      <AuthDivider middleText="or sign up with" />

      {/* Third-party sign-in options */}
      <View className="flex-row justify-center items-center gap-4 mt-2">
        <AuthButton 
          onPress={handleGoogleSignIn}
          isDisabled={googleLoading}
          imageSource={IMAGES.googleLogo}
          label="Continue with Google"
        />
      </View>

      <View className="flex-1" />

      {/* Footer links */}
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
