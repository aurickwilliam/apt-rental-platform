import { View, Text } from "react-native";
import { Image } from "expo-image";
import { Avatar, Button, Card, PressableFeedback } from "heroui-native";
import { useColors } from "hooks/useTheme";
import { FileText, MessageCircleMore } from "lucide-react-native";
import { getInitials } from "@repo/utils";

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
  const { colors } = useColors();

  return (
    <PressableFeedback onPress={onPress} className="rounded-3xl overflow-hidden">
      <PressableFeedback.Highlight />
      <Card className="border border-border shadow-none rounded-3xl">
        <Card.Body className="gap-3">
          {/* Row 1: Avatar + Name/Email */}
          <View className="flex-row items-center gap-3">
            <Avatar size="md" color="accent" className="border border-border">
              {profilePictureUrl && (
                <Avatar.Image source={{ uri: profilePictureUrl }} asChild>
                  <Image
                    style={{
                      width: "100%",
                      height: "100%",
                    }}
                    contentFit="cover"
                    cachePolicy="disk"
                  />
                </Avatar.Image>
              )}
              <Avatar.Fallback delayMs={profilePictureUrl ? 600 : 0}>
                {getInitials(fullName)}
              </Avatar.Fallback>
            </Avatar>
            <View className="flex-1">
              <Text
                className="text-foreground font-interSemiBold text-base"
                numberOfLines={1}
              >
                {fullName}
              </Text>
              <Text className="text-muted font-inter text-xs" numberOfLines={1}>
                {email}
              </Text>
            </View>
          </View>

          {/* Row 2: Lease Start / Lease End */}
          <View className="flex-row rounded-xl border border-border overflow-hidden">
            <View className="flex-1 items-center py-2.5 gap-0.5">
              <Text className="text-muted font-inter text-xs">Lease Start</Text>
              <Text className="text-foreground font-interMedium text-sm">
                {leaseStartMonthYear}
              </Text>
            </View>
            <View className="w-px bg-border" />
            <View className="flex-1 items-center py-2.5 gap-0.5">
              <Text className="text-muted font-inter text-xs">Lease End</Text>
              <Text className="text-foreground font-interMedium text-sm">
                {leaseEndMonthYear}
              </Text>
            </View>
          </View>

          {/* Row 3: Action Buttons */}
          <View className="flex-row gap-2">
            <Button
              variant="tertiary"
              className="flex-1"
              onPress={onDocumentsPress}
              isDisabled={!onDocumentsPress}
              size="sm"
            >
              <FileText size={16} color={colors.primary} />
              <Button.Label>Documents</Button.Label>
            </Button>
            <Button
              variant="tertiary"
              className="flex-1"
              onPress={onMessagePress}
              isDisabled={!onMessagePress}
              size="sm"
            >
              <MessageCircleMore size={16} color={colors.primary} />
              <Button.Label>Message</Button.Label>
            </Button>
          </View>
        </Card.Body>
      </Card>
    </PressableFeedback>
  );
}
