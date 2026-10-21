import { useLocalSearchParams, useRouter } from "expo-router";
import { Button, useToast } from "heroui-native";
import { View } from "react-native";
import { IconReceipt2 } from "@tabler/icons-react-native";
import {
  financeMonthFromParam,
  financeMonthLabel,
  manilaToday,
} from "@repo/utils";
import ScreenWrapper from "@/components/layout/ScreenWrapper";
import StandardHeader from "@/components/layout/StandardHeader";
import EmptyState from "@/components/display/EmptyState";
import ExpenseEntryPage from "@/components/finance/ExpenseEntryPage";
import FinanceError from "@/components/finance/FinanceError";
import EntryFormFooterSkeleton from "@/components/finance/EntryFormFooterSkeleton";
import EntryFormSkeleton from "@/components/finance/EntryFormSkeleton";
import {
  useFinanceExpense,
  useLandlordFinances,
} from "@/hooks/finance/useLandlordFinances";
import { useCurrentUser } from "@/hooks/auth";
import { useColors } from "@/hooks/useTheme";
import { financeErrorMessage } from "@/service/finance/financeService";

function EditExpense() {
  // Only the expense id and report month travel in route params; the record is
  // read again by id, so form fields never leave local state.
  const params = useLocalSearchParams<{
    id?: string;
    month?: string;
    apartmentId?: string;
  }>();
  const router = useRouter();
  const { colors } = useColors();
  const { toast } = useToast();
  const month = financeMonthFromParam(params.month, manilaToday().slice(0, 7));
  const apartmentId =
    typeof params.apartmentId === "string" ? params.apartmentId : null;
  const finance = useLandlordFinances({ month, apartmentId });
  const expense = useFinanceExpense(
    finance.ownerId,
    typeof params.id === "string" ? params.id : null,
  );
  const data = finance.report.data;
  const close = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/landlord/analytics");
  };
  if (finance.userLoading || finance.report.isLoading || expense.isLoading)
    return (
      <ScreenWrapper
        header={<StandardHeader title="Edit expense" onBackPress={close} />}
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
    expense.error ||
    !data ||
    !data.properties.length
  )
    return (
      <ScreenWrapper
        header={<StandardHeader title="Edit expense" onBackPress={close} />}
        className="p-5"
      >
        <FinanceError
          message={
            !finance.enabled
              ? "Sign in with an active landlord account to change expenses."
              : financeErrorMessage(
                  finance.report.error ?? expense.error ?? finance.userError,
                )
          }
          onRetry={() => {
            void finance.retry();
            if (expense.error) void expense.refetch();
          }}
        />
      </ScreenWrapper>
    );
  if (!expense.data)
    return (
      <ScreenWrapper
        header={<StandardHeader title="Edit expense" onBackPress={close} />}
        className="p-5"
      >
        <EmptyState
          icon={<IconReceipt2 size={32} color={colors.gray500} />}
          title="Expense not found"
          description={`This expense is no longer part of ${financeMonthLabel(month)}'s records. Open the category and choose an expense to change.`}
        />
        <Button variant="secondary" onPress={close}>
          <Button.Label>Back</Button.Label>
        </Button>
      </ScreenWrapper>
    );
  return (
    <ExpenseEntryPage
      properties={data.properties}
      apartmentId={apartmentId}
      month={month}
      initial={expense.data}
      onClose={close}
      onSave={async (draft, editing) => {
        await finance.expense.mutateAsync({ draft, editing });
        toast.show({ label: "Expense saved", variant: "success" });
      }}
      onDelete={async (id) => {
        await finance.removeExpense.mutateAsync(id);
      }}
    />
  );
}

export default function EditExpenseScreen() {
  const user = useCurrentUser();
  // Account switches discard open forms and sensitive drafts.
  return <EditExpense key={user.data?.id ?? "signed-out"} />;
}
