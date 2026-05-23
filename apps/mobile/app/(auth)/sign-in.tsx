import {View, Image, Pressable} from "react-native";
import { useState } from "react";
import { Link, useRouter } from "expo-router";

import { IMAGES } from "constants/images";
import { COLORS } from "@repo/constants";

import ScreenWrapper from "components/layout/ScreenWrapper";
import LogoButton from "components/buttons/LogoButton";
import AppInput from "components/inputs/AppInput";

import {Button, Text, Tabs, TextField, Label, FieldError, LinkButton, Separator} from 'heroui-native';

import { Eye, EyeOff } from "lucide-react-native";

import { supabase } from "@repo/supabase";

import { useGoogleAuth } from "hooks/useGoogleAuth";

export default function SignIn() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  
  const [userSide, setUserSide] = useState<"tenant" | "landlord">("tenant");
  
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const [showPassword, setShowPassword] = useState(false);

  const router = useRouter();

  const {
    signInWithGoogle,
    loading: googleLoading,
    error: googleError,
  } = useGoogleAuth();

  const combinedError = error || googleError;

  const handleEmailTextChange = (text: string) => {
    setEmail(text);
    if (error) setError("");
  };

  const handlePasswordTextChange = (text: string) => {
    setPassword(text);
    if (error) setError("");
  };

  const handleGoogleSignIn = () => {
    if (error) setError("");
    signInWithGoogle(userSide);
  };

  const handleSignIn = async () => {
    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }
    if (!password.trim()) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { data: authData, error: signInError } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

      if (signInError) {
        if (signInError.message === "Invalid login credentials") {
          setError("Invalid email or password. Please try again.");
        } else if (signInError.message === "Email not confirmed") {
          setError("Please verify your email address before signing in.");
        } else if (signInError.message.includes("rate limit")) {
          setError("Too many sign-in attempts. Please try again later.");
        } else {
          setError(signInError.message);
        }
        return;
      }

      // Fetch role from public.users using the auth user id
      const { data: userProfile, error: profileError } = await supabase
        .from("users")
        .select("role")
        .eq("user_id", authData.user!.id)
        .single();

      if (profileError || !userProfile) {
        setError("Could not load your profile. Please try again.");
        return;
      }

      // Check if user is signing in on the correct portal
      if (userSide === "landlord" && userProfile.role !== "landlord") {
        setError(
          "No landlord account found. Try signing in as a tenant instead.",
        );
        await supabase.auth.signOut(); // clear the session since we're blocking access
        return;
      }

      if (userSide === "tenant" && userProfile.role !== "tenant") {
        setError(
          "No tenant account found. Try signing in as a landlord instead.",
        );
        await supabase.auth.signOut();
        return;
      }

      // Route based on actual role from DB
      router.replace(
        userProfile.role === "landlord"
          ? "../(tabs)/(landlord)/dashboard"
          : "../(tabs)/(tenant)/rentals",
      );
    } catch (err) {
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
          resizeMode="contain"
        />
      </View>

      {/* Title at the top */}
      <View className="flex gap-2 mt-5">
        <Text className="text-4xl text-text font-nunitoSemiBold">
          Welcome Back!
        </Text>

        <Text className="text-base text-text font-interMedium">
          {userSide === "tenant"
            ? "Log in to continue your apartment journey."
            : "Access your listings and manage your tenants easily."}
        </Text>
      </View>

      {/* Tab Group User Side */}
      <Tabs
        value={userSide}
        onValueChange={(val) => {
          setUserSide(val as "tenant" | "landlord");
          if (error) setError("");
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

      {/* Error message */}
      {combinedError ? (
        <View className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <Text className="text-sm text-red-600 font-inter">
            {combinedError}
          </Text>
        </View>
      ) : null}

      {/* Form inputs */}
      <View className="mt-8 flex gap-4">
        <TextField
            isRequired
            isInvalid={!!error && !email.trim()}
        >
          <Label>Email Address:</Label>
          <AppInput
            placeholder="Enter your email"
            value={email}
            onChangeText={handleEmailTextChange}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          {!!error && !email.trim() && (
              <FieldError>Please enter your email address.</FieldError>
          )}
        </TextField>

        <TextField isRequired isInvalid={!!error && !password.trim()}>
          <Label>Password:</Label>
          <View className="w-full flex-row items-center">
            <AppInput
              placeholder="Enter your password"
              value={password}
              onChangeText={handlePasswordTextChange}
              secureTextEntry={!showPassword}
              className="flex-1 pr-10"
            />
            <Pressable
              onPress={() => setShowPassword(!showPassword)}
              className="absolute right-3"
            >
              {showPassword ? (
                <EyeOff size={18} color={COLORS.grey} />
              ) : (
                <Eye size={18} color={COLORS.grey} />
              )}
            </Pressable>
          </View>
          {!!error && !password.trim() && (
            <FieldError>Please enter your password.</FieldError>
          )}
        </TextField>
      </View>

      {/* Forgot Password Link */}
      <LinkButton
        onPress={() => router.push("/forgot-password")}
        className="mt-3 self-start p-0"
      >
        <LinkButton.Label className="text-secondary font-interMedium underline">
          Forgot Password?
        </LinkButton.Label>
      </LinkButton>

      {/* Sign In Button */}
      <View className="mt-5">
        <Button
          onPress={handleSignIn}
          isDisabled={loading}
        >
          <Button.Label className="font-interMedium">
            {loading ? "Signing In..." : "Sign In"}
          </Button.Label>
        </Button>
      </View>

      {/* Divider */}
      <View className="flex-row justify-center items-center my-5">
        <Separator orientation="horizontal" className="flex-1" />

        <Text className="mx-3 text-grey-400 font-inter">
          or sign in with
        </Text>

        <Separator orientation="horizontal" className="flex-1" />
      </View>

      {/* Third-party sign-in options */}
      <View className="flex-row justify-center items-center gap-4 mt-2">
        <Button
          variant="outline"
          onPress={handleGoogleSignIn}
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

      <View className="mb-8 mt-10 flex items-center gap-2">
        <View className="flex-row items-center justify-center gap-1">
          <Text className="text-text font-inter">
            New here?
          </Text>

          <LinkButton
            onPress={() => router.replace("/sign-up")}
            className="p-0"
          >
            <LinkButton.Label className="text-primary font-interMedium underline">
              Sign Up
            </LinkButton.Label>
          </LinkButton>
        </View>
      </View>
    </ScreenWrapper>
  );
}
