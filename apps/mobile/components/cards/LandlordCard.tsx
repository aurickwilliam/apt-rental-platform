import { View, Text, Image, TouchableOpacity } from "react-native";
import { COLORS } from "@repo/constants";

import {
  IconMail,
  IconPhone,
  IconMessage2,
  IconStarFilled,
  IconHomeFilled,
} from '@tabler/icons-react-native';

import PillButton from "components/buttons/PillButton";

interface LandlordCardProps {
  fullName: string;
  email: string;
  phoneNumber: string;
  profilePictureUrl?: string | null;
  withRentalInfo?: boolean;
  averageRating?: number;
  totalRentals?: number;
  onPress?: () => void;
  onMessagePress?: () => void;
}

function InitialsAvatar({ fullName }: { fullName: string }) {
  const parts = fullName.trim().split(' ');
  const initials = parts.length >= 2
    ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    : parts[0]?.[0]?.toUpperCase() ?? '?';

  return (
    <View className="w-36 h-36 rounded-xl border border-grey-300 bg-primary items-center justify-center">
      <Text className="text-white font-poppinsSemiBold text-3xl">
        {initials}
      </Text>
    </View>
  );
}

export default function LandlordCard({
  fullName,
  email,
  phoneNumber,
  profilePictureUrl,
  withRentalInfo = false,
  averageRating = 0.0,
  totalRentals = 0,
  onPress,
  onMessagePress,
}: LandlordCardProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      className="border-2 border-grey-300 p-2 rounded-2xl flex gap-3"
    >
      <View className="flex-row items-start gap-4">
        {/* Profile Picture or Initials */}
        {profilePictureUrl ? (
          <View className="w-36 h-36 rounded-xl overflow-hidden border border-grey-300">
            <Image
              source={{ uri: profilePictureUrl }}
              style={{ width: '100%', height: '100%' }}
            />
          </View>
        ) : (
          <InitialsAvatar fullName={fullName} />
        )}

        {/* Information Details */}
        <View className="flex-1 h-36 justify-between">
          <Text className="font-interSemiBold text-lg text-text">
            {fullName}
          </Text>

          <View className="flex gap-1">
            <View className="flex-row items-center gap-2">
              <IconMail size={20} color="#999" />
              <Text className="text-sm text-grey-500 font-inter" numberOfLines={1}>
                {email}
              </Text>
            </View>

            <View className="flex-row items-center gap-2">
              <IconPhone size={20} color="#999" />
              <Text className="text-sm text-grey-500 font-inter">
                {phoneNumber}
              </Text>
            </View>
          </View>

          {withRentalInfo ? (
            <View className="flex-row items-center gap-5 mb-3">
              <View className="flex-row items-center gap-2">
                <IconStarFilled size={16} color={COLORS.secondary} />
                <Text className="text-text text-sm font-inter">
                  {averageRating > 0 ? averageRating.toFixed(1) : 'No ratings'}
                </Text>
              </View>

              <View className="flex-row items-center gap-2">
                <IconHomeFilled size={16} color={COLORS.primary} />
                <Text className="text-text text-sm font-inter">
                  {totalRentals} {totalRentals === 1 ? 'Property' : 'Properties'}
                </Text>
              </View>
            </View>
          ) : (
            <PillButton
              label={"Message"}
              size="sm"
              type="outline"
              leftIconName={IconMessage2}
              onPress={onMessagePress}
              isDisabled={!!onMessagePress === false}
            />
          )}
        </View>
      </View>

      {withRentalInfo && (
        <PillButton
          label={"Message"}
          size="sm"
          type="outline"
          leftIconName={IconMessage2}
          onPress={onMessagePress}
        />
      )}
    </TouchableOpacity>
  );
}