import { View, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Image } from "expo-image";

import { formatDate } from "@repo/utils";

import { Card, Chip, PressableFeedback } from "heroui-native";

import { IconMapPin, IconPhoto } from "@tabler/icons-react-native";

import { useColors } from "@/hooks/useTheme";
import { statusChipSurface } from "@/hooks/useStatusChipStyles";
import {
  useApplicationStatusStyles,
  type ApplicationStatus
} from "@/hooks/applications";

interface ApplicationStatusCardProps {
  applicationId: string;
  apartmentId: string;
  status: ApplicationStatus;
  apartmentName: string;
  location: string;
  thumbnailUrl: string | null;
  submittedAt: string;
}

// Compact application row: apartment thumbnail, name, location and submitted
// date, with the status chip top-right. Tapping opens the application details.
export default function ApplicationStatusCard({
  applicationId,
  apartmentId,
  status,
  apartmentName,
  location,
  thumbnailUrl,
  submittedAt,
}: ApplicationStatusCardProps) {
  const router = useRouter();
  const { colors } = useColors();
  const { getStatusStyle } = useApplicationStatusStyles();
  const { label, chipStyle, Icon: StatusIcon } = getStatusStyle(status);

  const handlePress = () => router.push({
    pathname: '/tenant/applications/[applicationId]',
    params: { applicationId, apartmentId },
  });

  return (
    <PressableFeedback
      onPress={handlePress}
      className="rounded-3xl overflow-hidden border border-border"
      accessibilityRole="button"
      accessibilityLabel={`${apartmentName}, application ${label.toLowerCase()}`}
    >
      <PressableFeedback.Highlight />
      <Card className="shadow-none p-0">
        <Card.Body className="p-0 flex-row items-stretch">
          {/* Apartment thumbnail — flush to the card's top, left and bottom
              edges; the card's rounded overflow clips its corners. The image
              fills absolutely so the text column alone sets the card height. */}
          <View className="w-24 self-stretch">
            {thumbnailUrl ? (
              <Image
                source={thumbnailUrl}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
                cachePolicy="disk"
              />
            ) : (
              <View className="flex-1 items-center justify-center bg-gray-200">
                <IconPhoto size={24} color={colors.gray400} />
              </View>
            )}
          </View>

          <View className="flex-1 min-w-0 gap-1 p-3">
            {/* Name + status */}
            <View className="flex-row items-start justify-between gap-2">
              <Text
                className="flex-1 text-foreground text-lg font-nunitoSemiBold"
                numberOfLines={1}
              >
                {apartmentName}
              </Text>
              <Chip
                size="sm"
                variant="soft"
                animation="disable-all"
                style={statusChipSurface(chipStyle)}
              >
                <StatusIcon size={14} color={chipStyle.textColor} />
                <Chip.Label
                  className="font-nunitoSemiBold"
                  style={{ color: chipStyle.textColor }}
                >
                  {label}
                </Chip.Label>
              </Chip>
            </View>

            {/* Location */}
            {!!location && (
              <View className="flex-row items-center gap-1">
                <IconMapPin size={16} color={colors.gray500} />
                <Text
                  className="flex-1 text-muted text-sm font-inter"
                  numberOfLines={1}
                >
                  {location}
                </Text>
              </View>
            )}

            {/* Submitted date */}
            <Text className="text-muted text-sm font-inter">
              Submitted {formatDate(submittedAt, "medium")}
            </Text>
          </View>
        </Card.Body>
      </Card>
    </PressableFeedback>
  );
}
