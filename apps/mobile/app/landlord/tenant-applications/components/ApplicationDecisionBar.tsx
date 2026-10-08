import { Text, View } from "react-native";

import { Button } from "heroui-native";

import { useColors } from "@/hooks/useTheme";

interface ApplicationDecisionBarProps {
  isUnitOccupied: boolean;
  isLoading: boolean;
  onReject: () => void;
  onApprove: () => void;
}

/** Reject / Approve actions for a pending application. */
export default function ApplicationDecisionBar({
  isUnitOccupied,
  isLoading,
  onReject,
  onApprove,
}: ApplicationDecisionBarProps) {
  const { colors } = useColors();

  return (
    <View className="gap-3">
      {isUnitOccupied ? (
        <Text
          className="text-sm font-inter"
          style={{ color: colors.danger }}
          accessibilityRole="alert"
        >
          This unit is already occupied and cannot accept another tenant. Vacate
          it first, then approve.
        </Text>
      ) : null}
      <View className="flex-row gap-3">
        <Button
          variant="danger-soft"
          className="flex-1"
          isDisabled={isLoading}
          onPress={onReject}
        >
          <Button.Label className="font-nunitoSemiBold">Reject</Button.Label>
        </Button>
        <Button
          className="flex-1"
          isDisabled={isLoading || isUnitOccupied}
          onPress={onApprove}
        >
          <Button.Label className="font-nunitoSemiBold">Approve</Button.Label>
        </Button>
      </View>
    </View>
  );
}
