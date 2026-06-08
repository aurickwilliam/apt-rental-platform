import {View, Image, Pressable} from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";

import { IMAGES } from "constants/images";
import { COLORS } from "@repo/constants";

import ScreenWrapper from "components/layout/ScreenWrapper";
import AuthDivider from "./components/AuthDivider";
import RoleTab from "./components/RoleTab";

import {
  Button, 
  Text, 
  TextField, 
  Label, 
  FieldError, 
  LinkButton,
  Input,
  InputGroup
} from 'heroui-native';

import { 
  Eye, 
  EyeOff 
} from "lucide-react-native";

import { supabase } from "@repo/supabase";

import { useGoogleAuth } from "hooks/useGoogleAuth";
import AuthButton from "./components/AuthButton";

export default function SignIn() {
  const router = useRouter();

  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [userSide, setUserSide] = useState<"tenant" | "landlord">("tenant");
  
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const {
    signInWithGoogle,
    loading: googleLoading,
    error: googleError,
  } = useGoogleAuth();

  const handleGoogleSignIn = () => {
    if (error) setError("");
    void signInWithGoogle(userSide);
  };

  const handleEmailTextChange = (text: string) => {
    setEmail(text);
    if (error) setError("");
  };

  const handlePasswordTextChange = (text: string) => {
    setPassword(text);
    if (error) setError("");
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
      <RoleTab 
        userSide={userSide}
        onValueChange={(val) => {
          setUserSide(val as "tenant" | "landlord");
          if (error) setError("");
        }}
      />

      {/* Google Error message */}
      {googleError ? (
        <View className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl">
          <Text className="text-sm text-red-600 font-inter">
            {googleError}
          </Text>
        </View>
      ) : null}

      {/* General Error Message */}
      {error && email.trim() && password.trim() ? (
        <View className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl">
          <Text className="text-sm text-red-600 font-inter">{error}</Text>
        </View>
      ) : null}

      {/* Form inputs */}
      <View className="mt-8 flex gap-4">
        <TextField
            isRequired
            isInvalid={!!error && !email.trim()}
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

          {!!error && !email.trim() && (
              <FieldError>Please enter your email address.</FieldError>
          )}
        </TextField>

        <TextField 
          isRequired 
          isInvalid={!!error && !password.trim()}
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
                    <EyeOff size={18} color={COLORS.grey} />
                  ) : (
                    <Eye size={18} color={COLORS.grey} />
                  )}
                </Pressable>
              </InputGroup.Suffix>
            )}
          </InputGroup>

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
