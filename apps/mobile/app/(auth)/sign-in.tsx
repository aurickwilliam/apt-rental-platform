import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";

import { IMAGES } from "@/constants/images";
import TextField from "@/components/TextField";

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
    </View>
  );
}
