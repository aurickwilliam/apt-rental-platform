import { View, Text } from "react-native";
import { Calendar, Clock } from "lucide-react-native";
import { formatDate, formatTime } from "@repo/utils";
import { useColors } from "@/hooks/useTheme";
import {
  type VisitRequestStatus,
  useVisitRequestStatusStyles,
} from "@/hooks/visitRequests";

type Props = {
  visitRequest: {
    visit_date: string;
    time: string;
    status: VisitRequestStatus;
    confirmed_visit_date: string | null;
    confirmed_time: string | null;
    created_at: string;
    responded_at: string | null;
    tenant_responded_at: string | null;
  };
};

export default function VisitRequestHistoryItem({ visitRequest }: Props) {
  const { colors } = useColors();
  const { getStatusStyle } = useVisitRequestStatusStyles();
  const {
    visit_date,
    time,
    status,
    confirmed_visit_date,
    confirmed_time,
    created_at,
    responded_at,
    tenant_responded_at,
  } = visitRequest;

  const statusStyle = getStatusStyle(status);

  const displayDate =
    status === "cancelled" && confirmed_visit_date ? confirmed_visit_date : visit_date;
  const displayTime =
    status === "cancelled" && confirmed_time ? confirmed_time : time;

  const lastRespondedAt = [responded_at, tenant_responded_at]
    .filter((t): t is string => !!t)
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0] ?? null;

  return (
    <View className="bg-surface rounded-2xl border border-border px-3.5 py-3 gap-2.5">
      <View className="flex-row items-center justify-between">
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

      <View className="flex-row items-center p-1 pt-2 border-t border-border">
        <View className="flex-1">
          <Text className="text-xs text-muted font-inter">
            Submitted: {formatDate(created_at, "medium")}
          </Text>
        </View>
        {lastRespondedAt && (
          <View className="flex-1">
            <Text className="text-xs text-muted font-inter">
              Responded: {formatDate(lastRespondedAt, "medium")}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}
