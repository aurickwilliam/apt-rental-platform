import { View, Text, Image, Platform, Pressable } from "react-native";
import { Link, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";

import ScreenWrapper from "../../components/ScreenWrapper";
import TextField from "../../components/TextField";
import PillButton from "../../components/PillButton";
import LogoButton from "../../components/LogoButton";
import { IMAGES } from "../../constants/images";

export default function SignUp() {
  const [email, setEmail] = useState<string>("");
  const [userSide, setUserSide] = useState<"tenant" | "landlord">("tenant");

  const router = useRouter();
  const { userType } = useLocalSearchParams<{ userType: string }>();

  useEffect(() => {
    setUserSide(userType === "landlord" ? "landlord" : "tenant");
  }, [userType]);

  const handleEmailTextChange = (text: string) => setEmail(text);
  const toggleUserSide = () => setUserSide(prev => prev === "tenant" ? "landlord" : "tenant");

  const handleSignUp = () => {
    console.log("Sign Up pressed:");
    console.log(email);
    console.log(userSide);

    router.push({
      pathname: "/(auth)/complete-profile",
      params: { email, userSide }
    });
  }

  return (
    <ScreenWrapper hasInput scrollable>
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
        <Text className={`${userSide === 'landlord' ? 'text-3xl' : 'text-4xl'}
          text-text font-dmserif`}>
          Create Your {userSide === 'landlord' ? "Landlord " : ""}Account
        </Text>
        <Text className="text-md text-text font-poppins">
          {
            userSide === 'tenant' ?
            'Join as tenant to start renting.' :
            'Join us and start listing your properties in minutes.'
          }
        </Text>
      </View>

      {/* Form inputs */}
      <View className="mt-8">
        <TextField
          label="Email Address:"
          placeholder="Enter your email"
          value={email}
          onChangeText={handleEmailTextChange}
          error=""
          required={true}
        />
      </View>

      {/* Sign In Button */}
      <View className="mt-5">
        <PillButton
          label="Continue"
          isFullWidth={true}
          onPress={handleSignUp}
        />
      </View>

      {/* Divider */}
      <View className="flex-row justify-center items-center mt-7 mb-7">
        <View className="flex-1 h-[2px] bg-grey-300 rounded-full mt-1" />

        <Text className="mx-3 text-grey-400 font-inter">
          or sign up with
        </Text>

        <View className="flex-1 h-[2px] bg-grey-300 rounded-full mt-1" />
      </View>

      {/* Third-party sign-in options */}
      <View className="flex-row justify-center items-center gap-10">
        <LogoButton image={IMAGES.googleLogo} />
        <LogoButton image={IMAGES.facebookLogo} />

        {/* Show Apple sign in when using iOS */}
        {Platform.OS === 'ios' && (
          <LogoButton image={IMAGES.appleLogo} />
        )}
      </View>

      {/* Footer links - Push to bottom with flex-1 spacer */}
      <View className="flex-1" />

      <View className="mb-8 flex items-center gap-2">
        <View className="flex-row items-center justify-center gap-1">
          <Text className="text-text font-inter">
            Already have an account?
          </Text>
          <Link
            href="/sign-in"
            className="text-primary font-interMedium underline"
            replace={true}
          >
            Sign In
          </Link>
        </View>

        <View className="flex-row items-center justify-center gap-1">
          <Text className="text-text font-inter">
            {
              userSide === 'tenant' ?
              'Want to rent out your space?' :
              'Here to find a place?'
            }
          </Text>
          <Pressable onPress={toggleUserSide}>
            <Text className="text-primary font-interMedium underline">
              {
                userSide === 'tenant' ?
                'Register as Landlord' :
                'Continue as Tenant'
              }
            </Text>
          </Pressable>
        </View>
      </View>
    </ScreenWrapper>
  );
}
