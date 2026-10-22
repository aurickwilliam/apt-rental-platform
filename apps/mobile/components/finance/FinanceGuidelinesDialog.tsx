import { Text, View } from "react-native";
import { Button } from "heroui-native";
import { financeGuidelineSections, manilaToday } from "@repo/utils";
import AppDialog from "@/components/display/AppDialog";

interface FinanceGuidelinesDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Explains Profit & planning figures and the limits of the planning tools. */
export default function FinanceGuidelinesDialog({
  isOpen,
  onOpenChange,
}: FinanceGuidelinesDialogProps) {
  const today = manilaToday();
  const sections = financeGuidelineSections(today);

  return (
    <AppDialog
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title="Profit & planning guidelines"
      description="How figures are calculated and how to use your plan."
      scrollable
      footer={
        <Button size="sm" onPress={() => onOpenChange(false)}>
          <Button.Label>Got it</Button.Label>
        </Button>
      }
    >
      <View className="gap-4">
        {sections.map((section) => (
          <View key={section.title} className="gap-1">
            <Text className="font-nunitoBold text-sm text-foreground">
              {section.title}
            </Text>
            <Text className="font-inter text-sm text-muted leading-5">
              {section.body}
            </Text>
          </View>
        ))}
      </View>
    </AppDialog>
  );
}
