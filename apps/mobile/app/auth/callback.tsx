import { useEffect } from "react";
import { View, ActivityIndicator, Text } from "react-native";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";

WebBrowser.maybeCompleteAuthSession();

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to sign-in if somehow landed here directly
    const timeout = setTimeout(() => {
      router.replace("/(auth)/sign-in");
    }, 3000);

    return () => clearTimeout(timeout);
  }, [router]);

  return (
    <View className="flex-1 items-center justify-center bg-white">
      <ActivityIndicator size="large" />
      <Text className="mt-4 text-text font-inter text-sm">
        Completing sign-in...
      </Text>
    </View>
  );
}
