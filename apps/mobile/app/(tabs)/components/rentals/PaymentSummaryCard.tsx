import { View, Text } from "react-native";

import {
  useStatusChipStyles,
  statusChipSurface,
} from "@/hooks/useStatusChipStyles";
import { formatPesoDisplay, type TenancyBill } from "@repo/utils";
import { COLORS } from "@repo/constants";

import { Button, Chip } from "heroui-native";
import {
  IconHistory,
  IconCircleCheck,
  IconClock,
  IconCreditCard,
} from "@tabler/icons-react-native";

interface PaymentSummaryCardProps {
  bill?: TenancyBill | null;
  periodMonth?: string;
  periodYear?: string;
  status?: "Pending" | "Paid";
  totalRent?: number;
  // Maintenance fees inside the amount shown (a server bill's fees, or a legacy tenancy's
  // pending ones), so the tenant can see how much of it is not rent.
  feesTotal?: number;
  // An online checkout the tenant started but has not finished; Pay Now opens it for checking.
  hasPendingPayment?: boolean;
  dueDate?: string | null;
  onPayNowPress?: () => void;
  onViewHistoryPress?: () => void;
}

export default function PaymentSummaryCard({
  bill,
  periodMonth = "Month",
  periodYear = "Year",
  status = "Pending",
  totalRent = 0,
  feesTotal = 0,
  hasPendingPayment = false,
  dueDate,
  onPayNowPress,
  onViewHistoryPress,
}: PaymentSummaryCardProps) {
  const palette = useStatusChipStyles();
  const isMoveIn = bill?.kind === "move_in";

  const isPending = bill ? bill.totalDue > 0 : status === "Pending";
  const displayStatus = isPending ? "Pending" : "Paid";
  const isFeesOnly = bill?.kind === "fees" && isPending;
  const totalPayment = bill && isPending ? bill.totalDue : totalRent;
  const statusStyle = isPending ? palette.warning : palette.success;
  // Same icons as the application status chips.
  const StatusIcon = isPending ? IconClock : IconCircleCheck;

  return (
    <View className="bg-accent rounded-3xl p-4 border border-white/10">
      {/* Header — no icon beside title per request */}
      <View className="flex-row items-center justify-between">
        <Text className="text-white text-lg font-nunitoBold">
          {isMoveIn ? "Move-in payment" : isFeesOnly ? "Maintenance fees" : "Monthly rent"}
        </Text>

        <Chip size="sm" variant="soft" style={statusChipSurface(statusStyle)}>
          <StatusIcon size={14} color={statusStyle.textColor} />
          <Chip.Label
            className="font-nunitoSemiBold text-sm"
            style={{ color: statusStyle.textColor }}
          >
            {displayStatus}
          </Chip.Label>
        </Chip>
      </View>

      <View className="mt-2 gap-1">
        <Text className="text-white text-2xl font-nunitoBold">
          {formatPesoDisplay(totalPayment)}
        </Text>
        <Text className="text-white text-sm font-nunitoSemiBold">
          {periodMonth} {periodYear}
          {dueDate ? ` · Due ${dueDate}` : ""}
        </Text>
        {isPending && hasPendingPayment ? (
          <Text className="text-white/80 text-sm font-inter">
            A payment is waiting for confirmation. Tap Pay Now to check it.
          </Text>
        ) : null}
        {isPending && !isFeesOnly && feesTotal > 0 ? (
          <Text className="text-white/80 text-sm font-inter">
            Includes {formatPesoDisplay(feesTotal)} in maintenance fees
          </Text>
        ) : null}
      </View>

      <View className="flex-row items-center gap-4 mt-2">
        {isPending && (
          <Button size="sm" onPress={onPayNowPress} className="flex-1 bg-white">
            {/* Brand blue in both modes: the lighter dark-mode blue is too
                faint on white. */}
            <IconCreditCard
              size={16}
              color={COLORS.light.primary}
              strokeWidth={2}
            />
            <Button.Label style={{ color: COLORS.light.primary }}>
              Pay Now
            </Button.Label>
          </Button>
        )}

        {/* Pending: the history shortcut stays a compact icon beside Pay Now.
            Paid: nothing else competes for the row, so it expands into an
            icon-and-label button. */}
        <View className={isPending ? undefined : "flex-1"}>
          {isPending ? (
            <Button
              isIconOnly
              variant="ghost"
              size="md"
              onPress={onViewHistoryPress}
              className="size-11 rounded-full bg-white/15"
              accessibilityLabel="View payment history"
            >
              <IconHistory size={22} color="#FFFFFF" strokeWidth={2} />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="md"
              onPress={onViewHistoryPress}
              className="h-11 rounded-full bg-white/15"
              accessibilityLabel="View payment history"
            >
              <IconHistory size={20} color="#FFFFFF" strokeWidth={2} />
              <Button.Label className="text-white font-nunitoSemiBold">
                Payment history
              </Button.Label>
            </Button>
          )}
        </View>
      </View>
    </View>
  );
}
