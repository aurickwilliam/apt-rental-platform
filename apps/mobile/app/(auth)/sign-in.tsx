import { View, Text, Image, Pressable } from "react-native";
import { useState } from "react";
import { Link, useRouter } from "expo-router";

import { IMAGES } from "../../constants/images";
import { COLORS } from "@repo/constants";

import ScreenWrapper from "components/layout/ScreenWrapper";
import TextField from "components/inputs/TextField";
import PillButton from "components/buttons/PillButton";
import LogoButton from "components/buttons/LogoButton";

import { supabase } from "@repo/supabase";

import { useGoogleAuth } from "hooks/useGoogleAuth";

export default function SignIn() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [userSide, setUserSide] = useState<"tenant" | "landlord">("tenant");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

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
        <Text className="text-4xl text-text font-dmserif">Welcome Back!</Text>
        <Text className="text-md text-text font-poppins">
          {userSide === "tenant"
            ? "Log in to continue your apartment journey."
            : "Access your listings and manage your tenants easily."}
        </Text>
      </View>

      {/* Toggle User Side */}
      <View className="flex-row bg-gray-100 p-1 rounded-2xl mt-8">
        <Pressable
          onPress={() => {
            setUserSide("tenant");
            if (error) setError("");
          }}
          className="flex-1 py-3 rounded-xl"
          style={
            userSide === "tenant"
              ? { backgroundColor: "white", elevation: 1 }
              : {}
          }
        >
          <Text
            className="text-center font-interMedium"
            style={{
              color: userSide === "tenant" ? COLORS.primary : COLORS.grey,
            }}
          >
            Tenant
          </Text>
        </Pressable>

        <Pressable
          onPress={() => {
            setUserSide("landlord");
            if (error) setError("");
          }}
          className="flex-1 py-3 rounded-xl"
          style={
            userSide === "landlord"
              ? { backgroundColor: "white", elevation: 1 }
              : {}
          }
        >
          <Text
            className="text-center font-interMedium"
            style={{
              color: userSide === "landlord" ? COLORS.secondary : COLORS.grey,
            }}
          >
            Landlord
          </Text>
        </Pressable>
      </View>

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
          label="Email Address:"
          placeholder="Enter your email"
          value={email}
          onChangeText={handleEmailTextChange}
          error=""
          required={true}
        />

        <TextField
          label="Password:"
          placeholder="Enter your password"
          value={password}
          onChangeText={handlePasswordTextChange}
          error=""
          isPassword={true}
          required={true}
        />
      </View>

      <Link href="/forgot-password" asChild>
        <Text className="mt-3 self-start text-left text-secondary font-interMedium underline">
          Forgot Password?
        </Text>
      </Link>

      {/* Sign In Button */}
      <View className="mt-5">
        <PillButton
          label={loading ? "Signing In..." : "Sign In"}
          isFullWidth={true}
          onPress={handleSignIn}
          isDisabled={loading}
        />
      </View>

      {/* Divider */}
      <View className="flex-row justify-center items-center mt-7 mb-7">
        <View className="flex-1 h-[2px] bg-grey-300 rounded-full mt-1" />

        <Text className="mx-3 text-grey-400 font-inter">or sign in with</Text>

        <View className="flex-1 h-[2px] bg-grey-300 rounded-full mt-1" />
      </View>

      {/* Third-party sign-in options */}
      <View className="flex-row justify-center items-center gap-10">
        <LogoButton
          image={IMAGES.googleLogo}
          onPress={handleGoogleSignIn}
          disabled={googleLoading}
        />
      </View>

      {/* Footer links */}
      <View className="flex-1" />

      <View className="mb-8 mt-5 flex items-center gap-2">
        <View className="flex-row items-center justify-center gap-1">
          <Text className="text-text font-inter">
            New here?
          </Text>
          <Link
            href="/sign-up"
            className="text-primary font-interMedium underline"
            replace={true}
          >
            Sign Up
          </Link>
        </View>
      </View>
    </ScreenWrapper>
  );
}
