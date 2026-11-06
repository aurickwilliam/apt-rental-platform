import { View } from "react-native";
import { Chip } from "heroui-native";
import { IconCheck, IconClock, IconInfoCircle, IconX } from "@tabler/icons-react-native";
import { RENEWAL_STATUS_LABELS, renewalStatusLabel, type RenewalStatus } from "@repo/utils";
import { statusChipSurface, useStatusChipStyles } from "@/hooks/useStatusChipStyles";
import { renewalTone } from "@/utils/renewalPresentation";

interface RenewalStatusChipProps {
  status: RenewalStatus | null;
  start?: string | null;
  today?: string;
}

export default function RenewalStatusChip({ status, start = null, today }: RenewalStatusChipProps) {
  const styles = useStatusChipStyles();
  const tone = renewalTone(status);
  const style = styles[tone];
  const Icon = tone === "success" ? IconCheck : tone === "danger" ? IconX : tone === "warning" ? IconClock : IconInfoCircle;
  const label = status ? today ? renewalStatusLabel(status, start, today) : RENEWAL_STATUS_LABELS[status] : "No renewal yet";
  return (
    <View className="items-start">
      <Chip size="sm" variant="soft" className="h-auto max-w-full py-1" style={statusChipSurface(style)}>
        <Icon size={14} color={style.textColor} />
        <Chip.Label numberOfLines={0} className="shrink font-nunitoSemiBold" style={{ color: style.textColor }}>{label}</Chip.Label>
      </Chip>
    </View>
  );
}
