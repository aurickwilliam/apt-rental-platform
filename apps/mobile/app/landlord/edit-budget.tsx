import { useLocalSearchParams, useRouter } from "expo-router";
import { Button, useToast } from "heroui-native";
import { View } from "react-native";
import { IconTargetArrow } from "@tabler/icons-react-native";
import {
  financeMonthFromParam,
  financeMonthLabel,
  manilaToday,
  parseFinanceAmount,
} from "@repo/utils";
import ScreenWrapper from "@/components/layout/ScreenWrapper";
import StandardHeader from "@/components/layout/StandardHeader";
import EmptyState from "@/components/display/EmptyState";
import { BudgetEntryPage } from "@/components/finance/FinanceEntrySheet";
import { FinanceError } from "@/components/finance/FinanceControls";
import {
  EntryFormFooterSkeleton,
  EntryFormSkeleton,
} from "@/components/finance/FinanceSkeleton";
import { useLandlordFinances } from "@/hooks/finance/useLandlordFinances";
import { useCurrentUser } from "@/hooks/auth";
import { useColors } from "@/hooks/useTheme";
import { financeErrorMessage } from "@/service/finance/financeService";

function EditBudget() {
  const params = useLocalSearchParams<{
    id?: string;
    month?: string;
    apartmentId?: string;
    amount?: string;
  }>();
  const router = useRouter();
  const { colors } = useColors();
  const { toast } = useToast();
  const month = financeMonthFromParam(params.month, manilaToday().slice(0, 7));
  const apartmentId =
    typeof params.apartmentId === "string" ? params.apartmentId : null;
  // The suggestion a landlord chose to review rides a param, so validate it.
  const suggestedAmount =
    typeof params.amount === "string"
      ? parseFinanceAmount(params.amount, true)
      : null;
  const finance = useLandlordFinances({ month, apartmentId });
  const data = finance.report.data;
  const budget = data?.budgets.find((item) => item.id === params.id);
  const close = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/landlord/analytics");
  };
  if (finance.userLoading || finance.report.isLoading)
    return (
      <ScreenWrapper
        header={<StandardHeader title="Edit budget" onBackPress={close} />}
        scrollable
        className="p-5"
        footer={
          <View className="px-5 py-3 border-t border-border bg-background">
            <EntryFormFooterSkeleton />
          </View>
        }
      >
        <EntryFormSkeleton
          label="Loading budget form"
          testID="budget-entry-skeleton"
        />
      </ScreenWrapper>
    );
  if (
    finance.userError ||
    !finance.enabled ||
    finance.report.error ||
    !data ||
    !data.properties.length
  )
    return (
      <ScreenWrapper
        header={<StandardHeader title="Edit budget" onBackPress={close} />}
        className="p-5"
      >
        <FinanceError
          message={
            !finance.enabled
              ? "Sign in with an active landlord account to change budgets."
              : data && !data.properties.length
                ? "Add a property before planning a budget."
                : financeErrorMessage(finance.report.error ?? finance.userError)
          }
          onRetry={() => {
            void finance.retry();
          }}
        />
      </ScreenWrapper>
    );
  if (!budget)
    return (
      <ScreenWrapper
        header={<StandardHeader title="Edit budget" onBackPress={close} />}
        className="p-5"
      >
        <EmptyState
          icon={<IconTargetArrow size={32} color={colors.gray500} />}
          title="Budget not found"
          description={`This plan is not part of ${financeMonthLabel(month)}'s report. Open the Budget tab and choose a plan to change.`}
        />
        <Button variant="secondary" onPress={close}>
          <Button.Label>Back to budgets</Button.Label>
        </Button>
      </ScreenWrapper>
    );
  return (
    <BudgetEntryPage
      properties={data.properties}
      apartmentId={apartmentId}
      month={month}
      initial={budget}
      suggestedAmount={suggestedAmount ?? undefined}
      onClose={close}
      onSave={async (draft) => {
        await finance.budget.mutateAsync(draft);
        toast.show({ label: "Budget saved", variant: "success" });
      }}
      onDelete={async (id) => {
        await finance.removeBudget.mutateAsync(id);
      }}
    />
  );
}

export default function EditBudgetScreen() {
  const user = useCurrentUser();
  // Account switches discard open forms and sensitive drafts.
  return <EditBudget key={user.data?.id ?? "signed-out"} />;
}
