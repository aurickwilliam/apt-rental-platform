import { View, Text } from "react-native";
import { Image } from "expo-image";

import { Card, Chip, PressableFeedback } from "heroui-native";

import {
  IconChevronRight,
  IconFileText,
  IconHourglass,
  IconShieldCheck,
} from "@tabler/icons-react-native";

import { useColors } from "@/hooks/useTheme";
import { isPdfDocument, isPreviewable } from "../utils/fileType";
import PdfThumbnail from "@/components/display/PdfThumbnail";

interface DocumentCardProps {
  filePath: string | null;
  storagePath?: string;
  label: string;
  onPress: () => void;
  verified?: boolean;
  pending?: boolean;
  subtitle?: string;
  mimeType?: string | null;
}

export default function DocumentCard({
  filePath,
  storagePath,
  label,
  onPress,
  verified = false,
  pending = false,
  subtitle,
  mimeType,
}: DocumentCardProps) {
  const { colors } = useColors();
  const isImage =
    !!filePath && isPreviewable(mimeType, storagePath ?? filePath);
  const isPdf =
    !!filePath && !isImage && isPdfDocument(mimeType, storagePath ?? filePath);

  return (
    <PressableFeedback
      onPress={onPress}
      className="w-[48%] rounded-3xl overflow-hidden"
    >
      <PressableFeedback.Highlight />
      <Card className="border border-border rounded-3xl p-0 shadow-none overflow-hidden">
        <View
          className="w-full bg-gray-200 items-center justify-center"
          style={{ aspectRatio: 1 }}
        >
          {isImage ? (
            <Image
              source={{ uri: filePath }}
              style={{ width: "100%", height: "100%" }}
              contentFit="cover"
              cachePolicy="disk"
              transition={150}
            />
          ) : isPdf ? (
            <PdfThumbnail
              uri={filePath}
              style={{ width: "100%", height: "100%" }}
            />
          ) : (
            <IconFileText size={40} color={colors.gray400} />
          )}
        </View>

        <Card.Body className="p-3 gap-0.5">
          <Card.Title
            className="text-base text-foreground font-nunitoSemiBold"
            numberOfLines={1}
          >
            {label}
          </Card.Title>

          {verified ? (
            <Chip
              variant="soft"
              color="success"
              size="sm"
              className="self-start"
            >
              <IconShieldCheck size={12} color={colors.success} />
              <Chip.Label className="text-success font-nunitoSemiBold">
                Verified
              </Chip.Label>
            </Chip>
          ) : pending ? (
            <Chip
              variant="soft"
              color="warning"
              size="sm"
              className="self-start"
            >
              <IconHourglass size={12} color={colors.warning} />
              <Chip.Label className="font-nunitoSemiBold" style={{ color: colors.warning }}>
                Under review
              </Chip.Label>
            </Chip>
          ) : null}

          <View className="flex-row items-center gap-0.5">
            <Text className="text-xs text-muted">
              {subtitle ?? "Tap to View"}
            </Text>
            <IconChevronRight size={14} color={colors.gray400} />
          </View>
        </Card.Body>
      </Card>
    </PressableFeedback>
  );
}
