import { View, Text, TouchableOpacity, Linking } from "react-native";
import { Image } from "expo-image";

import { FileText, ExternalLink } from "lucide-react-native";

import { useColors } from "@/hooks/useTheme";

type DocumentRowProps = {
  label: string;
  path: string;
  signedUrl: string | null;
  onPressImage?: (uri: string) => void;
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
}: DocumentRowProps) {
  const { colors } = useColors();
  const ext = getExtension(path);
  const isImage = IMAGE_EXTENSIONS.includes(ext);

  if (!signedUrl) {
    return (
      <View className="flex-row items-center justify-between py-2">
        <Text className="text-foreground font-interMedium">{label}</Text>
        <Text className="text-muted text-sm">Unavailable</Text>
      </View>
    );
  }

  if (isImage) {
    return (
      <TouchableOpacity
        className="flex-row items-center gap-3 py-2"
        activeOpacity={0.7}
        onPress={() => onPressImage?.(signedUrl)}
      >
        <Image
          source={{ uri: signedUrl }}
          className="w-14 h-14 rounded-xl"
          contentFit="cover"
          cachePolicy="disk"
        />
        <View className="flex-1">
          <Text className="text-foreground font-interMedium">{label}</Text>
          <Text className="text-muted text-sm">Tap to view</Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      className="flex-row items-center gap-3 py-2"
      activeOpacity={0.7}
      onPress={() => Linking.openURL(signedUrl)}
    >
      <View className="w-14 h-14 rounded-xl border border-border items-center justify-center">
        <FileText size={22} color={colors.gray400} />
      </View>
      <View className="flex-1">
        <Text className="text-foreground font-interMedium">{label}</Text>
        <Text className="text-muted text-sm">
          Tap to open · {ext.toUpperCase()}
        </Text>
      </View>

      <ExternalLink size={18} color={colors.gray400} />
    </TouchableOpacity>
  );
}
