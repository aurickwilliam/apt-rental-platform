import { View, Pressable} from "react-native";
import { useState } from "react";
import { Image } from "expo-image";
import { useRouter } from "expo-router";

import { IMAGES } from "constants/images";

import ScreenWrapper from "components/layout/ScreenWrapper";
import AuthDivider from "./components/AuthDivider";
import RoleTab from "./components/RoleTab";
import AuthButton from "./components/AuthButton";
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
  Eye, 
  EyeOff 
} from "lucide-react-native";

import { supabase } from "@repo/supabase";

import { useGoogleAuth } from "hooks/useGoogleAuth";
import { useColors } from "hooks/useTheme";

import { isValidEmail } from "@repo/utils";

export default function SignIn() {
  const router = useRouter();
  const { colors } = useColors();

  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [userSide, setUserSide] = useState<"tenant" | "landlord">("tenant");
  
  const [loading, setLoading] = useState<boolean>(false);

  const [emailError, setEmailError] = useState<string>("");
  const [passwordError, setPasswordError] = useState<string>("");
  const [error, setError] = useState<string>("");

  const {
    signInWithGoogle,
    loading: googleLoading,
    error: googleError,
    resetError: resetGoogleError,
  } = useGoogleAuth();

  const handleGoogleSignIn = () => {
    if (error) setError("");
    if (googleError) resetGoogleError();
    void signInWithGoogle(userSide);
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
          contentFit="contain"
        />
      </View>

      {/* Title at the top */}
      <View className="flex gap-2 mt-5">
        <Text className="text-4xl text-foreground font-nunitoSemiBold">
          Welcome Back!
        </Text>

        <Text className="text-base text-muted font-interMedium">
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
                    <EyeOff size={20} color={colors.gray400} />
                  ) : (
                    <Eye size={20} color={colors.gray400} />
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
            <LinkButton.Label className="text-accent font-interMedium underline">
              Sign Up
            </LinkButton.Label>
          </LinkButton>
        </View>
      </View>

      {/* Error Dialog */}
      <ErrorDialog
        isOpen={!!(error || googleError)}
        onClose={() => {
          setError("");
          resetGoogleError();
        }}
        message={googleError || error}
      />
    </ScreenWrapper>
  );
}
