import { Text, View } from "react-native";
import { Chip, Separator } from "heroui-native";
import { formatPesoDisplay, type MaintenanceFeeStatus } from "@repo/utils";
import { statusChipSurface, useStatusChipStyles } from "@/hooks/useStatusChipStyles";

interface MaintenanceFeeCardProps {
  amount: number | null;
  status: MaintenanceFeeStatus | null;
}

export default function MaintenanceFeeCard({ amount, status }: MaintenanceFeeCardProps) {
  const styles = useStatusChipStyles();
  if (amount === null || amount <= 0) return null;
  const style = status === "paid" ? styles.success : status === "waived" ? styles.neutral : styles.warning;
  const label = status === "paid" ? "Paid" : status === "waived" ? "Waived" : "Added to next rent";

  return (
    <View>
      <Separator className="my-3" />
      <Text className="text-foreground text-base font-nunitoSemiBold mb-2">Maintenance Fee</Text>
      <View className="flex-row items-center justify-between gap-3 bg-surface rounded-3xl p-3">
        <Text selectable className="text-accent text-base font-nunitoSemiBold">{formatPesoDisplay(amount)}</Text>
        <Chip size="sm" variant="soft" style={statusChipSurface(style)}>
          <Chip.Label className="font-nunitoSemiBold" style={{ color: style.textColor }}>{label}</Chip.Label>
        </Chip>
      </View>
    </View>
  );
}
