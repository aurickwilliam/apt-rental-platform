import { View, Text, Alert, Linking } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Avatar, Button } from "heroui-native";

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
    <View
      className="flex-row items-center justify-between bg-primary px-4 py-3"
      style={{ paddingTop: insets.top }}
    >

      {/* Left Back Button */}
      <View className="w-10 items-start justify-center">
        <Button
          isIconOnly
          variant="ghost"
          size="sm"
          onPress={handleBack}
          className="-ml-1"
        >
          <IconChevronLeft size={24} color={COLORS.white} />
        </Button>
      </View>

      {/* Center (Title) */}
      <View className="flex-1 flex-row items-center justify-start ml-2">
        <Avatar size="sm" className="mr-3 border border-secondary">
          <Avatar.Image
            source={
              profilePicture
                ? { uri: profilePicture }
                : DEFAULT_IMAGES.defaultProfilePicture
            }
          />
          <Avatar.Fallback delayMs={200}>
            {name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .slice(0, 2)
              .toUpperCase()}
          </Avatar.Fallback>
        </Avatar>

        <Text className="text-base text-white font-interMedium">
          {name}
        </Text>
      </View>

      {/* Right Side Call Button */}
      <View className="w-10 items-end justify-center">
        <Button
          isIconOnly
          variant="ghost"
          size="sm"
          onPress={handleCall}
        >
          <IconPhone size={24} color={COLORS.white} />
        </Button>
      </View>
    </View>
  );
}