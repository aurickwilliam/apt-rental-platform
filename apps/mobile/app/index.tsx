import { Text, View } from "react-native";
import { Link } from "expo-router";

export default function Index() {
  return (
    <View className="flex-1 justify-center items-center">
      <Text className="text-amber-500 text-5xl font-inter">Shibaloma!</Text>

      <View className="flex-row justify-center items-center gap-10 mt-10">
        <Link href="/sign-in">
          <Text>Sign In</Text>
        </Link>

        <Link href="/sign-up">
          <Text>Sign Up</Text>
        </Link>
      </View>
    </View>
  );
}
