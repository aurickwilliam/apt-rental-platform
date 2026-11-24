import { View, Text, Alert, Linking, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Avatar, Button } from "heroui-native";

import { DEFAULT_IMAGES } from "constants/images";

import { useColors } from "@/hooks/useTheme";

import { IconChevronLeft, IconPhone } from '@tabler/icons-react-native';

interface ChatHeaderProps {
  name: string;
  profilePicture?: string;
  onBackPress?: () => void;
  phoneNumber?: string;
  apartmentTitle?: string;
  onViewProfile?: () => void;
}

export default function ChatHeader({
  name,
  profilePicture,
  onBackPress,
  phoneNumber,
  apartmentTitle,
  onViewProfile,
}: ChatHeaderProps) {
  const { colors } = useColors();
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

  // The other person's identity block; shared by the plain and tappable layouts.
  const titleContent = (
    <>
      <Avatar size="sm" className="mr-3 border border-white rounded-full overflow-hidden">
        <Avatar.Image
          source={
            profilePicture
              ? { uri: profilePicture }
              : DEFAULT_IMAGES.defaultProfilePicture
          }
        />
        <Avatar.Fallback delayMs={200} className="rounded-full">
          {name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .slice(0, 2)
            .toUpperCase()}
        </Avatar.Fallback>
      </Avatar>

      <View className="shrink">
        <Text
          className="text-base text-secondary-foreground font-nunitoSemiBold"
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {name}
        </Text>
        {apartmentTitle && (
          <Text
            className="text-xs text-secondary-foreground/70 font-inter"
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {apartmentTitle}
          </Text>
        )}
      </View>
    </>
  );

  return (
    <View
      className="flex-row items-center justify-between bg-accent px-4"
      style={{ paddingTop: insets.top, height: insets.top + 56 }}
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
          <IconChevronLeft size={24} color={colors.secondaryForeground} />
        </Button>
      </View>

      {/* Center (Title) — tapping it opens the other person's profile */}
      {onViewProfile ? (
        <Pressable
          onPress={onViewProfile}
          accessibilityRole="button"
          accessibilityLabel={`View ${name}'s profile`}
          className="flex-1 flex-row items-center justify-start ml-2"
          style={({ pressed }) => (pressed ? { opacity: 0.7 } : undefined)}
        >
          {titleContent}
        </Pressable>
      ) : (
        <View className="flex-1 flex-row items-center justify-start ml-2">
          {titleContent}
        </View>
      )}

      {/* Right Side Call Button */}
      <View className="w-10 items-end justify-center">
        <Button
          isIconOnly
          variant="ghost"
          size="sm"
          onPress={handleCall}
        >
          <IconPhone size={24} color={colors.secondaryForeground} />
        </Button>
      </View>
    </View>
  );
}
