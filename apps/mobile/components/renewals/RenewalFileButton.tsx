import { View } from "react-native";
import { Button } from "heroui-native";
import { IconFileText, type Icon } from "@tabler/icons-react-native";
import { FONT_FAMILIES } from "@repo/constants";
import { useColors } from "@/hooks/useTheme";

interface RenewalFileButtonProps {
  label: string;
  onPress: () => void;
  isDisabled?: boolean;
  variant?: "outline" | "primary";
  icon?: Icon;
}

export default function RenewalFileButton({ label, onPress, isDisabled = false, variant = "outline", icon: IconComponent = IconFileText }: RenewalFileButtonProps) {
  const { colors } = useColors();
  return (
    <Button variant={variant} isDisabled={isDisabled} onPress={onPress} accessibilityLabel={label}
      className="w-full min-w-0" style={{ height: "auto", minHeight: 48, paddingVertical: 12 }}>
      <View style={{ width: "100%", flexDirection: "row", alignItems: "center", gap: 8 }}>
        <View style={{ width: 18, flexShrink: 0 }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <IconComponent size={18} color={variant === "primary" ? colors.secondaryForeground : colors.textPrimary} />
        </View>
        <Button.Label numberOfLines={0} textBreakStrategy="simple"
          style={{ flexBasis: 0, flexGrow: 1, flexShrink: 1, minWidth: 0, textAlign: "center", fontFamily: FONT_FAMILIES.nunito.semiBold }}>
          {label}
        </Button.Label>
        <View style={{ width: 18, flexShrink: 0 }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />
      </View>
    </Button>
  );
}
