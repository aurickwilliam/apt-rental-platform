import { View, Text, TouchableOpacity } from "react-native";

import { IconCalendar } from "@tabler/icons-react-native";

import { Card, Chip } from "heroui-native";

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
  year: string;
  amount: number;
  paidDate: string;
  status: string;
  method?: string | null;
  reference?: string | null;
  onFlipPress?: () => void;
  flipDisabled?: boolean;
}

export default function PaymentHistoryCard({
  month,
  year,
  amount = 0,
  paidDate = "0/0/0000",
  status = "paid",
  method,
  reference,
  onFlipPress,
  flipDisabled = false,
}: PaymentHistoryCardProps) {
  const { colors } = useColors();
  const statusStyles = usePaymentStatusStyles();

  const label = paymentStatusLabel(status);
  const style = statusStyles[label];

  return (
    <Card className="border border-border shadow-none rounded-3xl">
      <Card.Header>
        <View className="flex-row items-center justify-between gap-3">
          <View className="flex-row items-center gap-2 flex-1">
            <IconCalendar size={20} color={colors.gray500} />
            <Text
              className="text-foreground font-nunitoSemiBold text-base"
              numberOfLines={1}
            >
              {month} {year}
            </Text>
          </View>

          <View className="flex-row items-center gap-2">
            {method ? (
              <Chip
                variant="soft"
                size="md"
                animation="disable-all"
                style={{ backgroundColor: colors.gray100 }}
              >
                <Chip.Label
                  style={{ color: colors.gray500 }}
                  className="text-xs font-nunitoSemiBold"
                >
                  {methodLabel(method ?? null)}
                </Chip.Label>
              </Chip>
            ) : null}

            <Chip
              variant="soft"
              size="md"
              animation="disable-all"
              style={{ backgroundColor: style.backgroundColor }}
            >
              <Chip.Label
                style={{ color: style.textColor }}
                className="text-xs font-nunitoSemiBold"
              >
                {label}
              </Chip.Label>
            </Chip>
          </View>
        </View>
      </Card.Header>

      <Card.Body className="pt-3 gap-1">
        <Text className="text-foreground text-xl font-nunitoBold">
          {formatPesoDisplay(amount)}
        </Text>
      </Card.Body>

      <Card.Footer>
        <View className="flex-row items-center justify-between gap-3 mt-3">
          <Text className="text-gray-500 text-xs font-inter">
            Ref. No: {formatReferenceId(reference ?? null)}
          </Text>

          <Text className="text-gray-500 text-xs font-inter">
            {label === "Paid" ? "Paid on" : "Recorded on"}: {paidDate}
          </Text>
        </View>
      </Card.Footer>

      {onFlipPress && (
        <View className="px-4 pb-4">
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onFlipPress}
            disabled={flipDisabled}
            className={`px-4 py-2 rounded-full items-center ${
              flipDisabled ? "opacity-50" : ""
            }`}
            style={{ backgroundColor: colors.successLight }}
          >
            <Text className="text-success font-nunitoSemiBold">
              Mark as Paid
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </Card>
  );
}