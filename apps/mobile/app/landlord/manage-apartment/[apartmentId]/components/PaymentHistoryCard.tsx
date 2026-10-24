import { View, Text } from "react-native";

import { Card, Chip, PressableFeedback } from "heroui-native";

import { formatPesoDisplay, landlordReceiptStatus } from "@repo/utils";

import PaymentMethodChip from "@/components/display/PaymentMethodChip";
import { statusChipSurface, useStatusChipStyles } from "@/hooks/useStatusChipStyles";
import { formatReferenceId } from "@/service/payments/paymentService";

interface PaymentHistoryCardProps {
  month: string;
  amount: number;
  status: string;
  method?: string | null;
  referenceId?: string | null;
  /** Names the unit when payments from several units share one list. */
  unitName?: string | null;
  tenantName?: string | null;
  /** Shown on the footer's left when no unit or tenant name is given (a single unit's list). */
  paidDate?: string | null;
  onPress: () => void;
}

export default function PaymentHistoryCard({
  month,
  amount = 0,
  status = "paid",
  method,
  referenceId,
  unitName,
  tenantName,
  paidDate,
  onPress,
}: PaymentHistoryCardProps) {
  const chipStyles = useStatusChipStyles();

  // Worded like the receipt, so a declined payment never reads as plain "Unpaid".
  const { label, tone } = landlordReceiptStatus(status);
  const style = chipStyles[tone === "success" ? "success" : tone === "warning" ? "warning" : "danger"];

  return (
    <PressableFeedback
      onPress={onPress}
      className="rounded-3xl overflow-hidden"
    >
      <PressableFeedback.Highlight />

      <Card className="border border-border shadow-none px-4 py-3 gap-1">
        <Card.Header>
          <View className="flex-row items-center justify-between gap-2">
            <Text
              className="text-foreground font-nunitoSemiBold text-base flex-1"
              numberOfLines={1}
            >
              {month}
            </Text>

            <View className="flex-row items-center gap-1.5 shrink-0">
              {method ? <PaymentMethodChip method={method} /> : null}

              <Chip
                variant="soft"
                size="sm"
                animation="disable-all"
                style={statusChipSurface(style)}
              >
                <Chip.Label
                  style={{ color: style.textColor }}
                  className="text-[11px] font-nunitoSemiBold"
                >
                  {label}
                </Chip.Label>
              </Chip>
            </View>
          </View>
        </Card.Header>

        <Card.Body className="gap-0">
          <Text className="text-accent text-2xl font-nunitoBold">
            {formatPesoDisplay(amount)}
          </Text>
        </Card.Body>

        <Card.Footer className="flex-row items-end justify-between gap-3">
          <View className="flex-1 min-w-0">
            {unitName ? (
              <Text className="text-foreground text-sm font-interMedium" numberOfLines={1}>
                {unitName}
              </Text>
            ) : null}
            {tenantName ? (
              <Text className="text-gray-500 text-xs font-inter" numberOfLines={1}>
                {tenantName}
              </Text>
            ) : null}
            {!unitName && !tenantName && paidDate ? (
              <Text className="text-gray-500 text-[11px] font-inter" numberOfLines={1}>
                {label === "Paid" ? "Paid on" : "Recorded on"}: {paidDate}
              </Text>
            ) : null}
          </View>
          <Text
            className="text-gray-500 text-[11px] font-inter shrink-0"
            numberOfLines={1}
            ellipsizeMode="middle"
          >
            {formatReferenceId(referenceId ?? null)}
          </Text>
        </Card.Footer>
      </Card>
    </PressableFeedback>
  );
}
