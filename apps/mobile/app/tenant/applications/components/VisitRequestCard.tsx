import { View, Text } from "react-native";
import { Card, Chip, PressableFeedback, Separator } from "heroui-native";
import { Calendar, Clock, Users, FileText, CalendarCheck, LucideIcon } from "lucide-react-native";

import { formatDate } from "@repo/utils";

import { useColors } from "@/hooks/useTheme";

type VisitStatus = "pending" | "approved" | "rejected" | "cancelled" | "rescheduled";
type ChipColor = "accent" | "default" | "success" | "warning" | "danger";

export type VisitRequest = {
  id: string;
  visit_date: string;
  time: string;
  no_visitors: number;
  notes: string | null;
  status: VisitStatus;
  rejected_reason: string | null;
  responded_at: string | null;
  confirmed_visit_date: string | null;
  confirmed_time: string | null;
  created_at: string;
};

type Props = {
  visitRequest: VisitRequest;
  onPress?: () => void;
};

const STATUS_CHIP: Record<VisitStatus, { color: ChipColor; label: string }> = {
  pending:     { color: "warning", label: "Pending" },
  approved:    { color: "success", label: "Approved" },
  rejected:    { color: "danger",  label: "Rejected" },
  cancelled:   { color: "default", label: "Cancelled" },
  rescheduled: { color: "accent",  label: "Rescheduled" },
};

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactElement<LucideIcon>;
  label: string;
  value: string;
}) {
  return (
    <View className="flex-row items-center gap-2.5">
      {icon}
      <View className="flex-1 flex-row items-center justify-between">
        <Text className="text-sm text-muted font-inter">{label}</Text>
        <Text className="text-sm text-foreground font-interMedium">{value}</Text>
      </View>
    </View>
  );
}

export default function VisitRequestCard({ visitRequest, onPress }: Props) {
  const { colors } = useColors();

  const {
    visit_date,
    time,
    no_visitors,
    notes,
    status,
    rejected_reason,
    confirmed_visit_date,
    confirmed_time,
    created_at,
  } = visitRequest;

  const chipConfig = STATUS_CHIP[status];
  const iconColor = colors.gray400;
  const iconSize = 16;

  // Format time string (HH:MM:SS → HH:MM AM/PM)
  const formatTime = (t: string) => {
    const [hours, minutes] = t.split(":").map(Number);
    const period = hours >= 12 ? "PM" : "AM";
    const h = hours % 12 || 12;
    return `${h}:${String(minutes).padStart(2, "0")} ${period}`;
  };

  const isRescheduled = status === "rescheduled" && confirmed_visit_date && confirmed_time;

  return (
    <PressableFeedback onPress={onPress} className="rounded-3xl">
      <Card className="gap-3">
        <Card.Body className="gap-3">
          {/* Header row */}
          <View className="flex-row items-center justify-between">
            <Text className="text-base text-foreground font-interMedium">
              Visit Request Details
            </Text>
            <Chip variant="soft" color={chipConfig.color}>
              <Chip.Label>
                {chipConfig.label}
              </Chip.Label>
            </Chip>
          </View>

          {/* Requested schedule */}
          <View className="gap-2">
            <InfoRow
              icon={<Calendar size={iconSize} color={iconColor} />}
              label="Date"
              value={formatDate(visit_date, "long")}
            />
            <InfoRow
              icon={<Clock size={iconSize} color={iconColor} />}
              label="Time"
              value={formatTime(time)}
            />
            <InfoRow
              icon={<Users size={iconSize} color={iconColor} />}
              label="Visitors"
              value={`${no_visitors} ${no_visitors === 1 ? "person" : "people"}`}
            />
          </View>

          {/* Confirmed schedule (rescheduled) */}
          {isRescheduled && (
            <>
              <Separator />
              <View className="gap-2">
                <Text className="text-xs text-muted font-interMedium uppercase tracking-wide">
                  Confirmed Schedule
                </Text>
                <InfoRow
                  icon={<CalendarCheck size={iconSize} color={colors.success} />}
                  label="Date"
                  value={formatDate(confirmed_visit_date!, "long")}
                />
                <InfoRow
                  icon={<Clock size={iconSize} color={colors.success} />}
                  label="Time"
                  value={formatTime(confirmed_time!)}
                />
              </View>
            </>
          )}

          {/* Notes */}
          {notes && (
            <>
              <Separator />
              <View className="flex-1 gap-1">
                <Text className="text-sm text-muted font-interMedium leading-0">
                  Additional Notes
                </Text>
                <Text className="text-sm text-foreground font-inter leading-5">
                  {notes}
                </Text>
              </View>
            </>
          )}

          {/* Rejection reason */}
          {status === "rejected" && rejected_reason && (
            <>
              <Separator />
              <View className="flex-row gap-2.5">
                <FileText size={iconSize} color={colors.danger} />
                <View className="flex-1 gap-1">
                  <Text className="text-xs text-danger font-interMedium uppercase tracking-wide">
                    Rejection Reason
                  </Text>
                  <Text className="text-sm text-foreground font-inter leading-5">
                    {rejected_reason}
                  </Text>
                </View>
              </View>
            </>
          )}

          <Separator />

          <Text className="text-xs text-muted font-inter">
            Submitted: {formatDate(created_at, "long")}
          </Text>
        </Card.Body>
      </Card>
    </PressableFeedback>
  );
}