import { View, Text } from "react-native";
import { Image } from "expo-image";

import { IMAGES } from "constants/images";

export default function EmptyChatState() {
  return (
    <View className="items-center gap-3 px-8">
      <View className="size-20">
        <Image
          source={IMAGES.aiIcon}
          style={{ width: "100%", height: "100%" }}
          contentFit="contain"
          accessibilityIgnoresInvertColors
        />
      </View>

      <Text className="text-3xl font-nunitoBold text-foreground text-center">
        Hi, I{`'`}m Ava
      </Text>
      <Text className="text-base font-inter text-muted text-center leading-6">
        Tell me the kind of place you{`'`}re looking for, in English or Tagalog, and
        I{`'`}ll find listings that fit.
      </Text>
      <Text className="text-xs font-inter text-muted text-center mt-2">
        Please don{`'`}t share personal details like your phone number.
      </Text>
    </View>
  );
}
