import { View, Text, Image } from "react-native";
import { Button, Card, PressableFeedback } from "heroui-native";

import { COLORS } from "@repo/constants";

import {
  IconFileText,
  IconMessage,
} from "@tabler/icons-react-native";

interface TenantCardProps {
  fullName: string;
  email: string;
  phoneNumber: string;
  profilePictureUrl: string | undefined;
  onPress: () => void;
  leaseStartMonthYear: string;
  leaseEndMonthYear: string;
  onMessagePress?: () => void;
  onDocumentsPress?: () => void;
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

export default function TenantCard({
  fullName,
  email,
  phoneNumber,
  profilePictureUrl,
  onPress,
  leaseStartMonthYear,
  leaseEndMonthYear,
  onMessagePress,
  onDocumentsPress,
}: TenantCardProps) {
  return (
    <PressableFeedback onPress={onPress}>
      <PressableFeedback.Highlight />
      <Card className="border border-grey-300 shadow-none rounded-3xl">
        <Card.Body className="gap-3">

          {/* Row 1: Avatar + Name/Email */}
          <View className="flex-row items-center gap-3">
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

            <View className="flex-1">
              <Text className="text-text font-interSemiBold text-base" numberOfLines={1}>
                {fullName}
              </Text>
              <Text className="text-grey-400 font-inter text-xs" numberOfLines={1}>
                {email}
              </Text>
            </View>
          </View>

          {/* Row 2: Lease Start / Lease End */}
          <View className="flex-row rounded-xl border border-grey-200 overflow-hidden">
            <View className="flex-1 items-center py-2.5 gap-0.5">
              <Text className="text-grey-400 font-inter text-xs">Lease Start</Text>
              <Text className="text-text font-interMedium text-sm">{leaseStartMonthYear}</Text>
            </View>
            <View className="w-px bg-grey-200" />
            <View className="flex-1 items-center py-2.5 gap-0.5">
              <Text className="text-grey-400 font-inter text-xs">Lease End</Text>
              <Text className="text-text font-interMedium text-sm">{leaseEndMonthYear}</Text>
            </View>
          </View>

          {/* Row 3: Action Buttons */}
          <View className="flex-row gap-2">
            <Button
              variant="tertiary"
              className="flex-1"
              onPress={onDocumentsPress}
              isDisabled={!onDocumentsPress}
            >
              <IconFileText size={16} color={COLORS.primary} />
              <Button.Label>
                Documents
              </Button.Label>
            </Button>
            <Button
              variant="tertiary"
              className="flex-1"
              onPress={onMessagePress}
              isDisabled={!onMessagePress}
            >
              <IconMessage size={16} color={COLORS.primary} />
              <Button.Label>
                Message
              </Button.Label>
            </Button>
          </View>

        </Card.Body>
      </Card>
    </PressableFeedback>
  );
}