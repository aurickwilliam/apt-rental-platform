import { View } from "react-native";

import { formatPesoDisplay, ledgerDateLabel, type LedgerSummary } from "@repo/utils";

import DashboardStatTile from "@/app/(tabs)/components/dashboard/DashboardStatTile";

interface LandlordPaymentsSummaryProps {
  summary: LedgerSummary;
  /** "All years" or the selected year, shown under the collected figure. */
  scopeLabel: string;
  /** Opens the list on the cash payments waiting for the landlord. */
  onPressCashToConfirm?: () => void;
}

function plural(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? "" : "s"}`;
}

// Every figure comes from the loaded rows through the shared ledger logic.
// Collected counts paid money only.
export default function LandlordPaymentsSummary({
  summary,
  scopeLabel,
  onPressCashToConfirm,
}: LandlordPaymentsSummaryProps) {
  const { collected, paidCount, awaitingCount, awaitingAmount, declinedCount, lastPaid } = summary;

  return (
    <View className="gap-3">
      <View className="flex-row gap-3">
        <DashboardStatTile
          isLabelAccented
          label="Collected"
          value={formatPesoDisplay(collected)}
          caption={`${scopeLabel} · ${plural(paidCount, "paid payment")}`}
        />
        <DashboardStatTile
          isLabelAccented
          label="Cash to confirm"
          value={formatPesoDisplay(awaitingAmount)}
          caption={awaitingCount === 0 ? "Nothing waiting" : `${plural(awaitingCount, "payment")} waiting`}
          onPress={awaitingCount > 0 ? onPressCashToConfirm : undefined}
        />
      </View>
      <View className="flex-row gap-3">
        <DashboardStatTile
          isLabelAccented
          label="Last payment"
          value={lastPaid ? formatPesoDisplay(lastPaid.amount) : "—"}
          caption={lastPaid ? `Paid ${ledgerDateLabel(lastPaid.date)}` : "No paid payments yet"}
        />
        <DashboardStatTile
          isLabelAccented
          label="Declined or failed"
          value={String(declinedCount)}
          caption={declinedCount === 0 ? "All clear" : "Rejected, failed or unpaid"}
          isAlert={declinedCount > 0}
        />
      </View>
    </View>
  );
}
