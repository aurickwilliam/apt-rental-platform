import { Keyboard, Text, View } from "react-native";
import { Button } from "heroui-native";
import {
  BottomSheetFooter,
  type BottomSheetFooterProps,
} from "@gorhom/bottom-sheet";
import { financeMonthLabel } from "@repo/utils";

interface FinanceFilterFooterProps extends BottomSheetFooterProps {
  bottomInset: number;
  propertyName: string;
  month: string;
  onClose: () => void;
  onApply: () => void;
}

export default function FinanceFilterFooter({
  bottomInset,
  propertyName,
  month,
  onClose,
  onApply,
  ...props
}: FinanceFilterFooterProps) {
  return (
    <BottomSheetFooter {...props} bottomInset={bottomInset}>
      <View className="px-5 py-3 gap-3 border-t border-border bg-surface">
        <Text
          className="font-inter text-sm text-foreground"
          accessibilityLiveRegion="polite"
        >
          {propertyName} · {financeMonthLabel(month)}
        </Text>
        <View className="flex-row gap-3">
          <Button className="flex-1" variant="tertiary" onPress={onClose}>
            <Button.Label>Cancel</Button.Label>
          </Button>
          <Button
            className="flex-1"
            onPress={() => {
              Keyboard.dismiss();
              onApply();
            }}
          >
            <Button.Label>Apply filters</Button.Label>
          </Button>
        </View>
      </View>
    </BottomSheetFooter>
  );
}
