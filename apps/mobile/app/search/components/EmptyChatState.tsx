import { View, Text } from "react-native";
import { Image } from "expo-image";

import { IMAGES } from "constants/images";

export default function EmptyChatState() {
  return (
    <View className="items-center gap-2 px-8">
      <View className="size-48">
        <Image
          source={IMAGES.aiIcon}
          style={{ width: "100%", height: "100%" }}
          contentFit="contain"
        />
      </View>

      <Text className="text-xl font-nunitoBold text-foreground text-center">
        Hey, what would you like to ask?
      </Text>
      <Text className="text-gray-400 text-base font-inter text-center">
        Try {`"`}2BR under ₱15k near Malabon{`"`}
      </Text>
    </View>
  );
}