import { View, Text, Image, Platform, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link } from "expo-router";

import { IMAGES } from "@/constants/images";

import TextField from "@/components/TextField";
import PillButton from "@/components/PillButton";
import LogoButton from "@/components/LogoButton";

import { useState } from "react";

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [userSide, setUserSide] = useState('tenant'); // tenant | landlord

  const handleEmailTextChange = (text: string) => {
    setEmail(text);
  }

  const toggleUserSide = () => {
    if (userSide === 'tenant') {
      setUserSide('landlord');
    }
    else {
      setUserSide('tenant');
    }
  }

  return (
    <View className="bg-white h-full pt-5 px-5 flex-1">
      {/* Logo at the top */}
      <SafeAreaView className="mx-auto">
        <View className="w-32 h-32">
          <Image
            source={IMAGES.logo}
            style={{ width: "100%", height: "100%" }}
          />
        </View>
      </SafeAreaView>

      {/* Title at the top */}
      <View className="flex gap-2 mt-5">
        <Text className={`${userSide === 'landlord' ? 'text-3xl' : 'text-4xl'} text-text font-dmserif`}>
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
          onPress={() => console.log("Shibal")}
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
        <LogoButton 
          image={IMAGES.googleLogo}
        />
        <LogoButton 
          image={IMAGES.facebookLogo}
        />

        {/* Show Apple sign in when using iOS */}
        {
          Platform.OS === 'ios' && 
          <LogoButton 
            image={IMAGES.appleLogo}
          />
        }
      </View>

      {/* Footer links */}
      <SafeAreaView className="mt-auto mb-8 flex items-center gap-2">
        <View className="flex-row items-center justify-center gap-1">
          <Text className="text-text font-inter">
            Already have an account?
          </Text>
          <Link href={"/sign-in"} className="text-primary font-interMedium underline">
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
      </SafeAreaView>
    </View>
  );
}
