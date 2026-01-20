import { View, Text, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { ReactNode } from "react";

interface StandardHeaderProps {
  title?: string;
  showBack?: boolean;
  onBackPress?: () => void;
  rightComponent?: ReactNode;
  textColor?: string;
}

export default function StandardHeader({
  title = "",
  showBack = true,
  onBackPress,
  rightComponent,
  textColor = "text-white",
}: StandardHeaderProps) {
  const navigation = useNavigation();

  const handleBack = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      navigation.goBack();
    }
  };

  return (
    <View className="flex-row items-center justify-between mt-4">

      {/* Left Side (Back Button or Empty Spacer) */}
      <View className="w-10 items-start justify-center">
        {showBack ? (
          <TouchableOpacity 
            activeOpacity={0.7}
            onPress={handleBack} 
            className="p-1 -ml-1"
          >
            <Ionicons 
              name="chevron-back" 
              size={24} 
              color={textColor === "text-white" ? "white" : "black"} 
            />
          </TouchableOpacity>
        ) : (
          /* Spacer to keep title centered if no back button */
          <View />
        )}
      </View>

      {/* Center (Title) */}
      <View className="flex-1 items-center justify-center">
        <Text 
          className={`font-poppinsMedium text-lg ${textColor}`} 
          numberOfLines={1}
        >
          {title}
        </Text>
      </View>

      {/* Right Side (Custom Component or Empty Spacer) */}
      <View className="w-10 items-end justify-center">
        {
          rightComponent 
            ? rightComponent 
            : <View />
        }
      </View>
    </View>
  );
}