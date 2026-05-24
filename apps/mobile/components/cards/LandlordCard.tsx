import { View, Text, Image } from "react-native";
import { Button, Card, PressableFeedback } from "heroui-native";

import { COLORS } from "@repo/constants";

import {
  IconMessage2,
  IconStarFilled,
  IconHomeFilled,
} from "@tabler/icons-react-native";

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
  const parts = fullName.trim().split(" ");
  const initials =
    parts.length >= 2
      ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
      : parts[0]?.[0]?.toUpperCase() ?? "?";

  return (
    <View className="size-12 rounded-full border border-grey-300 bg-primary items-center justify-center">
      <Text className="text-white font-interMedium text-lg">
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
    <PressableFeedback onPress={onPress}>
      <PressableFeedback.Highlight />
      <Card className="border border-grey-300 shadow-none rounded-3xl">
        <Card.Body className="flex-row items-center gap-3">
          {/* Avatar */}
          {profilePictureUrl ? (
            <View className="size-12 rounded-full overflow-hidden border border-grey-300 shrink-0">
              <Image
                source={{ uri: profilePictureUrl }}
                style={{ width: "100%", height: "100%" }}
              />
            </View>
          ) : (
            <InitialsAvatar fullName={fullName} />
          )}

          {/* Name + Email */}
          <View className="flex-1">
            <Text className="text-text font-interSemiBold text-base" numberOfLines={1}>
              {fullName}
            </Text>
            <Text className="text-grey-400 font-inter text-xs" numberOfLines={1}>
              {email}
            </Text>

            {withRentalInfo && (
              <View className="flex-row items-center gap-4 mt-1">
                <View className="flex-row items-center gap-1">
                  <IconStarFilled size={12} color={COLORS.secondary} />
                  <Text className="text-text text-xs font-inter">
                    {averageRating > 0 ? averageRating.toFixed(1) : "No ratings"}
                  </Text>
                </View>
                <View className="flex-row items-center gap-1">
                  <IconHomeFilled size={12} color={COLORS.primary} />
                  <Text className="text-text text-xs font-inter">
                    {totalRentals} {totalRentals === 1 ? "Property" : "Properties"}
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Message Icon Button */}
          <Button
            isIconOnly
            variant="tertiary"
            onPress={onMessagePress}
            isDisabled={!onMessagePress}
          >
            <IconMessage2 size={18} color={COLORS.primary} />
          </Button>
        </Card.Body>
      </Card>
    </PressableFeedback>
  );
}