import { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { Image } from "expo-image";

import { Chip, Button, Spinner } from "heroui-native";

import { IconRefresh, IconShieldCheck } from "@tabler/icons-react-native";

import { useColors } from "@/hooks/useTheme";

interface ValidIdCardProps {
  idType: string;
  frontUrl: string | null;
  backUrl: string | null;
  loading: boolean;
  onOpenViewer: (index: number) => void;
}

/**
 * Hero Valid ID card with a flip control. The icon button sits at the bottom
 * right of the ID and swaps the preview between the front and back captures.
 * Rendered with `key={doc.id}` so the shown side resets when the linked ID
 * changes. The flip button is a sibling of (not nested in) the viewer
 * trigger, so flipping never opens the lightbox.
 */
export default function ValidIdCard({
  idType,
  frontUrl,
  backUrl,
  loading,
  onOpenViewer,
}: ValidIdCardProps) {
  const { colors } = useColors();
  const [showBack, setShowBack] = useState(false);

  const currentUrl = showBack ? (backUrl ?? frontUrl) : frontUrl;

  return (
    <View className="gap-3">
      <View className="flex-row items-center justify-between gap-3">
        <View className="flex-1 gap-0.5">
          <Text className="text-foreground text-lg font-nunitoSemiBold">
            Valid ID / Government ID
          </Text>
          <Text className="text-muted text-sm font-inter">{idType}</Text>
        </View>

        <Chip variant="secondary" color="success" size="md">
          <IconShieldCheck size={14} color={colors.success} />
          <Chip.Label className="text-success font-nunitoSemiBold">
            Verified
          </Chip.Label>
        </Chip>
      </View>

      <View className="relative">
        <TouchableOpacity
          className="bg-surface border border-border rounded-3xl shadow-none overflow-hidden"
          activeOpacity={0.7}
          onPress={() => currentUrl && onOpenViewer(showBack ? 1 : 0)}
          disabled={!currentUrl}
        >
          <View className="w-full bg-gray-100 min-h-40 items-center justify-center">
            {currentUrl ? (
              <Image
                source={{ uri: currentUrl }}
                style={{ width: "100%", aspectRatio: 16 / 9 }}
                contentFit="contain"
                cachePolicy="disk"
                transition={150}
              />
            ) : loading ? (
              <Spinner size="sm" color={colors.primary} />
            ) : (
              <Text className="text-muted text-sm font-inter">
                Preview unavailable
              </Text>
            )}
          </View>
        </TouchableOpacity>

        {backUrl ? (
          <Button
            variant="secondary"
            size="sm"
            isIconOnly
            className="absolute bottom-3 right-3"
            accessibilityRole="button"
            accessibilityLabel={
              showBack ? "Show front of ID" : "Show back of ID"
            }
            onPress={() => setShowBack((prev) => !prev)}
          >
            <IconRefresh size={20} color={colors.primary} />
          </Button>
        ) : null}
      </View>
    </View>
  );
}
