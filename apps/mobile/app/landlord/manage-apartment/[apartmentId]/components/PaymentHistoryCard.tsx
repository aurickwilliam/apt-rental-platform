import { View, Text, TouchableOpacity } from "react-native";

import { IconCalendar } from "@tabler/icons-react-native";

import { Card, Chip } from "heroui-native";

import { formatPesoDisplay } from "@repo/utils";

import { useColors } from "hooks/useTheme";
import { usePaymentStatusStyles } from "hooks/payments";
import { paymentStatusLabel } from "@/service/payments/paymentService";

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
              className="text-foreground font-interSemiBold text-base"
              numberOfLines={1}
            >
              {month} {year}
            </Text>
          </View>

          <Chip
            variant="soft"
            size="sm"
            animation="disable-all"
            style={{ backgroundColor: style.backgroundColor }}
          >
            <Chip.Label
              style={{ color: style.textColor }}
              className="text-xs font-interMedium"
            >
              {label}
            </Chip.Label>
          </Chip>
        </View>
      </Card.Header>

      <Card.Body className="pt-0 gap-1">
        <Text className="text-foreground text-xl font-interMedium">
          {formatPesoDisplay(amount)}
        </Text>

        <Text className="text-gray-500 text-sm font-inter">
          {label === "Paid" ? "Paid on" : "Recorded on"}: {paidDate}
        </Text>
        {method ? (
          <Text className="text-gray-500 text-sm font-inter">
            Method: {method}
          </Text>
        ) : null}
        {reference ? (
          <Text className="text-gray-500 text-sm font-inter">
            Reference: {reference}
          </Text>
        ) : null}
      </Card.Body>

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
            <Text className="text-success font-interSemiBold">
              Mark as Paid
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </Card>
  );
}