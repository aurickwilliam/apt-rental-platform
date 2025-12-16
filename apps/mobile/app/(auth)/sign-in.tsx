import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";

import { IMAGES } from "@/constants/images";
import TextField from "@/components/TextField";
import PillButton from "@/components/PillButton";

import { useState } from "react";

export default function SignIn() {
  const [email, setEmail] = useState('');

  const handleEmailTextChange = (text: string) => {
    setEmail(text);
  }

  return (
    <View className="bg-white h-full pt-5 px-5">
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
        <Text className="text-4xl text-text font-dmserif">
          Create Your Account
        </Text>
        <Text className="text-md text-text font-poppins">
          Join as tenant to start renting.
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
          onPress={() => console.log("Shibal")}
        />
      </View>

      {/* Divider */}
      <View className="flex-row justify-center items-center mt-7 mb-7">
        <View className="flex-1 h-1 bg-grey-400 rounded-full mt-1" />
        
        <Text className="mx-3 text-mediumGrey font-inter">
          or sign up with
        </Text>
        
        <View className="flex-1 h-1 bg-grey-400 rounded-full mt-1" />
      </View>

      
    </View>
  );
}
