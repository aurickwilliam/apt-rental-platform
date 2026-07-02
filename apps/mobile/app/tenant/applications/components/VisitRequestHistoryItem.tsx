import { View, Text } from "react-native";
import { Calendar, Clock } from "lucide-react-native";

import { formatDate, formatTime } from "@repo/utils";
import { useColors } from "@/hooks/useTheme";
import {
  type VisitRequestStatus,
  useVisitRequestStatusStyles,
} from "@/hooks/useVisitRequestStatusStyles";

type Props = {
  visitRequest: {
    visit_date: string;
    time: string;
    status: VisitRequestStatus;
    confirmed_visit_date: string | null;
    confirmed_time: string | null;
  };
};

export default function VisitRequestHistoryItem({ visitRequest }: Props) {
  const { colors } = useColors();
  const { getStatusStyle } = useVisitRequestStatusStyles();
  const { visit_date, time, status, confirmed_visit_date, confirmed_time } =
    visitRequest;

  const statusStyle = getStatusStyle(status);

  // Declined reschedules resolved around the proposed slot, not the original ask
  const displayDate =
    status === "cancelled" && confirmed_visit_date ? confirmed_visit_date : visit_date;
  const displayTime =
    status === "cancelled" && confirmed_time ? confirmed_time : time;

  return (
    <View className="bg-surface flex-row items-center justify-between rounded-2xl border border-border px-3.5 py-3">
      <View className="flex-row items-center gap-2.5">
        <Calendar size={14} color={colors.gray500} />
        <Text className="text-sm text-foreground font-interMedium">
          {formatDate(displayDate, "long")}
        </Text>
        <Clock size={14} color={colors.gray500} />
        <Text className="text-sm text-muted font-inter">
          {formatTime(displayTime)}
        </Text>
      </View>
      <View
        className="rounded-full px-2.5 py-1"
        style={{ backgroundColor: statusStyle.backgroundColor }}
      >
        <Text style={{ color: statusStyle.textColor }} className="text-xs font-interMedium">
          {statusStyle.label}
        </Text>
      </View>
    </View>
  );
}
