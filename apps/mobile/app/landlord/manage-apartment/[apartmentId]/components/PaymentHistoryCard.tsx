import { View, Text } from "react-native";

import { Card, Chip, PressableFeedback } from "heroui-native";

import { formatPesoDisplay } from "@repo/utils";

import { useColors } from "hooks/useTheme";
import { usePaymentStatusStyles } from "hooks/payments";
import {
  formatReferenceId,
  methodLabel,
  paymentStatusLabel,
} from "@/service/payments/paymentService";

interface PaymentHistoryCardProps {
  month: string;
  amount: number;
  paidDate: string;
  status: string;
  method?: string | null;
  referenceId?: string | null;
  onPress: () => void;
}

export default function PaymentHistoryCard({
  month,
  amount = 0,
  paidDate = "0/0/0000",
  status = "paid",
  method,
  referenceId,
  onPress,
}: PaymentHistoryCardProps) {
  const { colors } = useColors();
  const statusStyles = usePaymentStatusStyles();

  const label = paymentStatusLabel(status);
  const style = statusStyles[label];

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
              {method ? (
                <Chip
                  variant="soft"
                  size="sm"
                  animation="disable-all"
                  style={{ backgroundColor: colors.gray100 }}
                >
                  <Chip.Label
                    style={{ color: colors.gray500 }}
                    className="text-[11px] font-nunitoSemiBold"
                  >
                    {methodLabel(method)}
                  </Chip.Label>
                </Chip>
              ) : null}

              <Chip
                variant="soft"
                size="sm"
                animation="disable-all"
                style={{ backgroundColor: style.backgroundColor }}
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
          <Text className="text-accent text-lg font-nunitoBold">
            {formatPesoDisplay(amount)}
          </Text>
        </Card.Body>

        <Card.Footer className="flex-row items-center justify-between gap-2">
          <Text
            className="text-gray-500 text-[11px] font-inter flex-1"
            numberOfLines={1}
          >
            {label === "Paid" ? "Paid on" : "Recorded on"}: {paidDate}
          </Text>
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
