import { View, Text, TouchableOpacity, Image } from "react-native";
import { useNavigation } from "expo-router";

import { COLORS } from "@repo/constants";
import { DEFAULT_IMAGES } from "constants/images";

import {
  IconChevronLeft,
  IconPhone
} from '@tabler/icons-react-native';

interface ChatHeaderProps {
  name: string;
  profilePicture?: string;
  onBackPress?: () => void;
}

export default function ChatHeader({ 
    name, 
    profilePicture,
    onBackPress 
  }: ChatHeaderProps) {

  const navigation = useNavigation();
  
  const handleBack = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      navigation.goBack();
    }
  };

  return (
    <View className="flex-row items-center justify-between bg-primary px-4 py-5">

      {/* Left Back Button */}
      <View className="w-10 items-start justify-center">
        <TouchableOpacity 
          activeOpacity={0.7}
          onPress={handleBack} 
          className="p-1 -ml-1"
        >
          <IconChevronLeft 
            size={24} 
            color={COLORS.white} 
          />
        </TouchableOpacity>
      </View>

      {/* Center (Title) */}
      <View className="flex-1 flex-row items-center justify-start ml-2">
        <View className="size-12 overflow-hidden rounded-full mr-3 border border-secondary">
          <Image 
            source={profilePicture ? { uri: profilePicture } : DEFAULT_IMAGES.defaultProfilePicture}
            style={{
              width: '100%',
              height: '100%',
            }}
          />
        </View>

        <Text className="text-lg text-white font-interMedium">
          {name}
        </Text>
      </View>

      {/* Right Side Call Button */}
      <View className="w-10 items-end justify-center">
        <IconPhone 
          size={24}
          color={COLORS.white}
        />
      </View>
    </View>
  );
}