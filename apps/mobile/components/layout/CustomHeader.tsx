import { View, Text, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

interface CustomHeaderProps {
  title: string;
  backgroundColor?: string;
  showBack?: boolean;
  onBackPress?: () => void;
}

export default function CustomHeader({ 
    title, 
    backgroundColor = "bg-primary", 
    showBack = false, 
    onBackPress 
  }: CustomHeaderProps) {

  const insets = useSafeAreaInsets();
  const router = useRouter();

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  return (
    <View
      className={`flex-row items-center px-4 pb-4 ${backgroundColor}`}
      style={{ paddingTop: insets.top + 10 }}
    >
      {showBack && (
        <Pressable onPress={handleBackPress} className="mr-3">
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </Pressable>
      )}
      <Text className="text-xl font-semibold text-white">{title}</Text>
    </View>
  );
}