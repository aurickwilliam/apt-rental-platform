import { View, Text, TouchableOpacity, Linking } from "react-native";
import { Image } from "expo-image";

import { IconFileText, IconExternalLink, IconShieldCheck } from "@tabler/icons-react-native";

import { useColors } from "@/hooks/useTheme";

type DocumentRowProps = {
  label: string;
  path: string;
  signedUrl: string | null;
  onPressImage?: (uri: string) => void;
  verified?: boolean;
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
}: DocumentRowProps) {
  const { colors } = useColors();
  const ext = getExtension(path);
  const isImage = IMAGE_EXTENSIONS.includes(ext);

  const labelRow = (
    <View className="flex-row items-center gap-1.5">
      <Text className="text-foreground font-nunitoSemiBold">{label}</Text>
      {verified ? (
        <View className="flex-row items-center gap-0.5">
          <IconShieldCheck size={14} color={colors.success} />
          <Text className="text-xs font-nunitoSemiBold" style={{ color: colors.success }}>
            Verified
          </Text>
        </View>
      ) : null}
    </View>
  );

  if (!signedUrl) {
    return (
      <View className="flex-row items-center justify-between py-2">
        <Text className="text-foreground font-nunitoSemiBold">{label}</Text>
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
          style={{
            width: 56,
            height: 56,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: colors.gray200,
          }}
          contentFit="cover"
          cachePolicy="disk"
        />
        <View className="flex-1">
          {labelRow}
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
        <IconFileText size={22} color={colors.gray400} />
      </View>
      <View className="flex-1">
        {labelRow}
        <Text className="text-muted text-sm">
          Tap to open · {ext.toUpperCase()}
        </Text>
      </View>

      <IconExternalLink size={18} color={colors.gray400} />
    </TouchableOpacity>
  );
}
