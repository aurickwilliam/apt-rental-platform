import { Text, TouchableOpacity, View } from "react-native";
import { Image } from "expo-image";

import { Spinner } from "heroui-native";

import { IconChevronRight, IconFileText } from "@tabler/icons-react-native";

import PdfThumbnail from "@/components/display/PdfThumbnail";
import { useColors } from "@/hooks/useTheme";

import { getExtension, isPdfDocument, isPreviewable } from "../utils/fileType";

interface DocumentPreviewProps {
  docType: string;
  storagePath: string;
  signedUrl: string | null;
  mimeType?: string | null;
  loading: boolean;
  onPress: () => void;
}

export default function DocumentPreview({
  docType,
  storagePath,
  signedUrl,
  mimeType,
  loading,
  onPress,
}: DocumentPreviewProps) {
  const { colors } = useColors();

  const showAsImage = isPreviewable(mimeType, storagePath);
  const showAsPdf = !showAsImage && isPdfDocument(mimeType, storagePath);

  if (showAsPdf) {
    return (
      <TouchableOpacity
        className="bg-surface border border-border rounded-3xl overflow-hidden"
        activeOpacity={0.7}
        onPress={onPress}
        disabled={!signedUrl}
        accessibilityRole="button"
        accessibilityLabel={`Open ${docType}`}
      >
        <View className="w-full bg-gray-100 items-center justify-center">
          {loading || !signedUrl ? (
            <View className="min-h-56 items-center justify-center">
              <Spinner size="sm" color={colors.primary} />
            </View>
          ) : (
            <PdfThumbnail
              uri={signedUrl}
              style={{ width: "100%", aspectRatio: 4 / 3 }}
            />
          )}
        </View>
      </TouchableOpacity>
    );
  }

  if (showAsImage) {
    return (
      <TouchableOpacity
        className="bg-surface border border-border rounded-3xl overflow-hidden"
        activeOpacity={0.7}
        onPress={onPress}
        disabled={!signedUrl}
        accessibilityRole="button"
        accessibilityLabel={`Open ${docType}`}
      >
        <View className="w-full bg-gray-100 min-h-56 items-center justify-center">
          {loading ? (
            <Spinner size="sm" color={colors.primary} />
          ) : !signedUrl ? (
            <Text className="text-muted text-sm font-inter">
              Preview unavailable
            </Text>
          ) : (
            <Image
              source={{ uri: signedUrl }}
              style={{ width: "100%", aspectRatio: 4 / 3 }}
              contentFit="contain"
              cachePolicy="disk"
              transition={150}
            />
          )}
        </View>
      </TouchableOpacity>
    );
  }

  const extension = getExtension(storagePath).toUpperCase();

  return (
    <TouchableOpacity
      className="bg-surface border border-border rounded-2xl p-4 flex-row items-center gap-3"
      activeOpacity={0.7}
      onPress={onPress}
      disabled={!signedUrl}
      accessibilityRole="button"
      accessibilityLabel={`Open ${docType}`}
    >
      <View className="size-12 rounded-xl bg-gray-100 items-center justify-center">
        {loading || !signedUrl ? (
          <Spinner size="sm" color={colors.primary} />
        ) : (
          <IconFileText size={24} color={colors.gray400} />
        )}
      </View>
      <View className="flex-1">
        <Text
          className="text-foreground text-base font-nunitoSemiBold"
          numberOfLines={1}
        >
          {docType}
        </Text>
        <Text className="text-muted text-sm font-inter">
          {extension ? `${extension} · ` : ""}Tap to open
        </Text>
      </View>
      <IconChevronRight size={18} color={colors.gray400} />
    </TouchableOpacity>
  );
}
