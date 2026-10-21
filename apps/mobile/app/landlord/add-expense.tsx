import { useLocalSearchParams, useRouter } from "expo-router";
import { useToast } from "heroui-native";
import { View } from "react-native";
import { financeMonthFromParam, manilaToday } from "@repo/utils";
import ScreenWrapper from "@/components/layout/ScreenWrapper";
import StandardHeader from "@/components/layout/StandardHeader";
import ExpenseEntryPage from "@/components/finance/ExpenseEntryPage";
import FinanceError from "@/components/finance/FinanceError";
import EntryFormFooterSkeleton from "@/components/finance/EntryFormFooterSkeleton";
import EntryFormSkeleton from "@/components/finance/EntryFormSkeleton";
import { useLandlordFinances } from "@/hooks/finance/useLandlordFinances";
import { useCurrentUser } from "@/hooks/auth";
import { financeErrorMessage } from "@/service/finance/financeService";

function AddExpense() {
  const params = useLocalSearchParams<{
    month?: string;
    apartmentId?: string;
  }>();
  const router = useRouter();
  const { toast } = useToast();
  const currentMonth = manilaToday().slice(0, 7);
  const month = financeMonthFromParam(params.month, currentMonth);
  const finance = useLandlordFinances({ month, apartmentId: null });
  const data = finance.report.data;
  const close = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/landlord/analytics");
  };
  if (finance.userLoading || finance.report.isLoading)
    return (
      <ScreenWrapper
        header={<StandardHeader title="Add expense" onBackPress={close} />}
        scrollable
        className="p-5"
        footer={
          <View className="px-5 py-3 border-t border-border bg-background">
            <EntryFormFooterSkeleton />
          </View>
        }
      >
        <EntryFormSkeleton
          label="Loading expense form"
          testID="expense-entry-skeleton"
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
        header={<StandardHeader title="Add expense" onBackPress={close} />}
        className="p-5"
      >
        <FinanceError
          message={
            !finance.enabled
              ? "Sign in with an active landlord account to add expenses."
              : data && !data.properties.length
                ? "Add a property before recording an expense."
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
    <ExpenseEntryPage
      properties={data.properties}
      apartmentId={apartmentId}
      month={month}
      onClose={close}
      onSave={async (draft, editing) => {
        await finance.expense.mutateAsync({ draft, editing });
        toast.show({ label: "Expense saved", variant: "success" });
      }}
    />
  );
}

export default function AddExpenseScreen() {
  const user = useCurrentUser();
  return <AddExpense key={user.data?.id ?? "signed-out"} />;
}
