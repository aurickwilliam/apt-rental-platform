import { Text, View } from "react-native";
import { Button } from "heroui-native";
import { manilaToday } from "@repo/utils";
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
  const sections = [
    {
      title: "Collected rent",
      body: "Only confirmed rent payments linked to a tenancy and rental period count. Untagged payments and security deposits are excluded.",
    },
    {
      title: "Operating income",
      body: "Net operating income is cash-based. It excludes improvements, loan payments, depreciation and reserve allocations, so it is not taxable profit or an account balance.",
    },
    {
      title: "Improvements & planned reserves",
      body: "Cash after spending also subtracts improvements and planned reserves. Planned reserves are amounts you intend to set aside, not transfers.",
    },
    {
      title: "Expense review",
      body: "Review all selected properties’ expenses, including zero-spending months. Adding, editing or deleting an expense reopens review, because missing expenses are never treated as zero.",
    },
    {
      title: "Payment dates & comparison",
      body: `Payment dates use the recorded payment date. Current-month results are through ${today}; the comparison uses equivalent elapsed days, clamped to the previous month’s end.`,
    },
    {
      title: "Planning guidance",
      body: "Budgets and reserve goals help you plan, but they do not move, hold or transfer money. They are not tax, accounting, legal or investment advice.",
    },
    {
      title: "What the report includes",
      body: "Collection expectations cover active leases and ended leases with a recorded end date. Removed listings are excluded. PayMongo transactions currently use test funds.",
    },
  ];

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
