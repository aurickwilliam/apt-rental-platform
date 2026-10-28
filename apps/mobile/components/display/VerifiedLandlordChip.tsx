import { View, Text } from "react-native";

import { IconShieldCheckFilled } from "@tabler/icons-react-native";

import { statusChipSurface, useStatusChipStyles } from "@/hooks/useStatusChipStyles";

/** Shown when an admin approved one of the landlord's ownership documents. */
export default function VerifiedLandlordChip() {
  const { success } = useStatusChipStyles();

  return (
    <View
      accessible
      accessibilityLabel="Verified landlord"
      className="self-start flex-row items-center gap-1 rounded-full px-2 py-1"
      style={statusChipSurface(success)}
    >
      <IconShieldCheckFilled size={14} color={success.textColor} />
      <Text className="font-nunitoSemiBold text-xs" style={{ color: success.textColor }}>
        Verified landlord
      </Text>
    </View>
  );
}
