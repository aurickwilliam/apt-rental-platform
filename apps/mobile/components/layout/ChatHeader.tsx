import { View, Text, TouchableOpacity, Image, Alert, Linking } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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
  phoneNumber?: string;
}

export default function ChatHeader({ 
    name, 
    profilePicture,
    onBackPress,
    phoneNumber,
  }: ChatHeaderProps) {

  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleCall = async () => {
    if (!phoneNumber) {
      Alert.alert('No phone number', 'This user has no phone number on record.');
      return;
    }

    try {
      await Linking.openURL(`tel:${phoneNumber}`);
    } catch {
      Alert.alert('Error', 'Unable to open the phone dialer.');
    }
  };
  
  const handleBack = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  return (
    <View className="flex-row items-center justify-between bg-primary px-4 py-5"  style={{ paddingTop: insets.top + 20 }}>

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
        <TouchableOpacity 
          activeOpacity={0.7}
          onPress={handleCall} 
          className="p-1 -ml-1"
        >
          <IconPhone 
            size={24}
            color={COLORS.white}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}