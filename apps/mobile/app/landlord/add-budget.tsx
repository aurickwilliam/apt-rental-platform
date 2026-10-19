import { useLocalSearchParams, useRouter } from "expo-router";
import { useToast } from "heroui-native";
import { View } from "react-native";
import {
  budgetKindFromParam,
  financeCategoryFromParam,
  financeMonthFromParam,
  manilaToday,
} from "@repo/utils";
import ScreenWrapper from "@/components/layout/ScreenWrapper";
import StandardHeader from "@/components/layout/StandardHeader";
import { BudgetEntryPage } from "@/components/finance/FinanceEntrySheet";
import { FinanceError } from "@/components/finance/FinanceControls";
import {
  EntryFormFooterSkeleton,
  EntryFormSkeleton,
} from "@/components/finance/FinanceSkeleton";
import { useLandlordFinances } from "@/hooks/finance/useLandlordFinances";
import { useCurrentUser } from "@/hooks/auth";
import { financeErrorMessage } from "@/service/finance/financeService";

function AddBudget() {
  const params = useLocalSearchParams<{
    month?: string;
    apartmentId?: string;
    category?: string;
    kind?: string;
  }>();
  const router = useRouter();
  const { toast } = useToast();
  const currentMonth = manilaToday().slice(0, 7);
  const month = financeMonthFromParam(params.month, currentMonth);
  // Presets come from deep links, so each is validated before it seeds the form.
  const category = financeCategoryFromParam(params.category);
  const kind = budgetKindFromParam(params.kind);
  const finance = useLandlordFinances({ month, apartmentId: null });
  const data = finance.report.data;
  const close = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/landlord/analytics");
  };
  if (finance.userLoading || finance.report.isLoading)
    return (
      <ScreenWrapper
        header={<StandardHeader title="Plan a budget" onBackPress={close} />}
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
        header={<StandardHeader title="Plan a budget" onBackPress={close} />}
        className="p-5"
      >
        <FinanceError
          message={
            !finance.enabled
              ? "Sign in with an active landlord account to plan budgets."
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
  const apartmentId =
    data.properties.find((property) => property.id === params.apartmentId)
      ?.id ?? null;
  return (
    <BudgetEntryPage
      properties={data.properties}
      apartmentId={apartmentId}
      month={month}
      presetCategory={category}
      presetKind={kind}
      onClose={close}
      onSave={async (budget) => {
        await finance.budget.mutateAsync(budget);
        toast.show({ label: "Budget saved", variant: "success" });
      }}
    />
  );
}

export default function AddBudgetScreen() {
  const user = useCurrentUser();
  return <AddBudget key={user.data?.id ?? "signed-out"} />;
}
