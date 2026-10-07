import { Text, View } from "react-native";

import { Button } from "heroui-native";

import { IconFileUpload, IconPlus } from "@tabler/icons-react-native";

import { useColors } from "@/hooks/useTheme";

interface EmptySupportingDocsProps {
  onAddDocument: () => void;
}

/**
 * Section-level empty state for the supporting documents grid: the wallet
 * holds the verified ID but no supporting documents yet. Compact by design —
 * the full-wallet empty state lives in the screen itself.
 */
export default function EmptySupportingDocs({
  onAddDocument,
}: EmptySupportingDocsProps) {
  const { colors } = useColors();

  return (
    <View className="items-center gap-3 py-10 px-4">
      <IconFileUpload size={64} color={colors.primary} />
      <Text className="text-foreground text-xl font-nunitoBold text-center">
        No supporting documents yet
      </Text>
      <Text className="text-gray-400 text-base font-inter text-center px-8 leading-relaxed">
        Add payslips, billing statements, or clearances so they&apos;re ready
        when you apply for an apartment.
      </Text>

      <Button size="md" onPress={onAddDocument}>
        <IconPlus size={18} color="#FFFFFF" />
        <Button.Label className="text-white font-nunitoSemiBold">
          Add a Document
        </Button.Label>
      </Button>
    </View>
  );
}
