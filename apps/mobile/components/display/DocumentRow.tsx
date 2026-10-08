import { View, Text, Linking } from "react-native";
import { Image } from "expo-image";

import { PressableFeedback } from "heroui-native";

import {
  IconFileText,
  IconExternalLink,
  IconShieldCheck,
} from "@tabler/icons-react-native";

import { useColors } from "@/hooks/useTheme";
import PdfThumbnail from "./PdfThumbnail";

type DocumentRowProps = {
  label: string;
  path: string;
  signedUrl: string | null;
  onPressImage?: (uri: string) => void;
  verified?: boolean;
  expired?: boolean;
  mimeType?: string | null;
  /** Overrides both default handlers (viewer for images, external link for
   * files) — e.g. to route to a detail screen instead. */
  onPress?: () => void;
};

const IMAGE_EXTENSIONS = ["png", "jpg", "jpeg", "webp", "heic"];

function getExtension(path: string) {
  return path.split(".").pop()?.toLowerCase() ?? "";
}

export default function DocumentRow({
  label,
  path,
  signedUrl,
  onPressImage,
  verified = false,
  expired = false,
  mimeType,
  onPress,
}: DocumentRowProps) {
  const { colors } = useColors();
  const ext = getExtension(path);
  const isImage = mimeType
    ? mimeType.toLowerCase().startsWith("image/")
    : IMAGE_EXTENSIONS.includes(ext);
  const isPdf =
    !isImage &&
    (mimeType ? mimeType.toLowerCase() === "application/pdf" : ext === "pdf");

  const labelRow = (
    <View className="flex-row items-center gap-1.5">
      <Text className="text-foreground font-nunitoSemiBold">{label}</Text>
      {verified ? (
        <View className="flex-row items-center gap-0.5">
          <IconShieldCheck size={14} color={colors.success} />
          <Text
            className="text-xs font-nunitoSemiBold"
            style={{ color: colors.success }}
          >
            Verified
          </Text>
        </View>
      ) : null}
      {expired ? (
        <Text className="text-danger text-xs font-nunitoSemiBold">Expired</Text>
      ) : null}
    </View>
  );

  // A custom handler wins. Otherwise images open in the in-app viewer and
  // everything else (PDFs, documents) opens externally — the image viewer
  // cannot render a PDF.
  const handlePress = () => {
    if (!signedUrl) return;
    if (onPress) {
      onPress();
      return;
    }
    if (isImage && onPressImage) {
      onPressImage(signedUrl);
      return;
    }
    void Linking.openURL(signedUrl);
  };

  if (!signedUrl) {
    return (
      <View className="flex-row items-center justify-between py-2">
        <View className="flex-1">{labelRow}</View>
        <Text className="text-muted text-sm">
          {path ? "Unavailable" : "Not provided"}
        </Text>
      </View>
    );
  }

  if (isImage || isPdf) {
    return (
      <PressableFeedback
        className="flex-row items-center gap-3 py-2"
        onPress={handlePress}
      >
        <PressableFeedback.Highlight />
        <View
          className="border border-border items-center justify-center overflow-hidden"
          style={{ width: 56, height: 56, borderRadius: 12 }}
        >
          {isImage ? (
            <Image
              source={{ uri: signedUrl }}
              style={{ width: 56, height: 56 }}
              contentFit="cover"
              cachePolicy="disk"
            />
          ) : (
            <PdfThumbnail
              uri={signedUrl}
              style={{ width: 56, height: 56 }}
              iconSize={22}
            />
          )}
        </View>
        <View className="flex-1">
          {labelRow}
          <Text className="text-muted text-sm">Tap to view</Text>
        </View>
      </PressableFeedback>
    );
  }

  return (
    <PressableFeedback
      className="flex-row items-center gap-3 py-2"
      onPress={handlePress}
    >
      <PressableFeedback.Highlight />
      <View className="w-14 h-14 rounded-xl border border-border items-center justify-center">
        <IconFileText size={22} color={colors.gray400} />
      </View>
      <View className="flex-1">
        {labelRow}
        <Text className="text-muted text-sm">
          Tap to open · {ext.toUpperCase()}
        </Text>
      </View>

      <IconExternalLink size={18} color={colors.gray400} />
    </PressableFeedback>
  );
}
