import { View, Text } from "react-native";

import {
  Button,
  Card,
  Chip,
  PressableFeedback,
  Separator,
  useThemeColor,
} from "heroui-native";

import {
  Calendar,
  Clock,
  Users,
  CalendarCheck,
  CalendarX,
  AlertCircle,
  MessageCircle,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Hourglass,
  LucideIcon,
} from "lucide-react-native";

import { formatDate } from "@repo/utils";

import { useColors } from "@/hooks/useTheme";

type VisitStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "cancelled"
  | "rescheduled";
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
  /** Optional tap target for the whole card (e.g. open full details). */
  onPress?: () => void;
  /** rescheduled -> tenant accepts the landlord's proposed slot */
  onAccept?: () => void;
  /** rescheduled -> tenant declines the landlord's proposed slot */
  onDecline?: () => void;
  /** rejected / declined-reschedule -> open chat with landlord */
  onMessageLandlord?: () => void;
  /** rejected / declined-reschedule -> open a fresh visit request form */
  onRequestAgain?: () => void;
};

const STATUS_CHIP: Record<VisitStatus, { color: ChipColor; label: string }> = {
  pending: { color: "warning", label: "Pending" },
  approved: { color: "success", label: "Approved" },
  rejected: { color: "danger", label: "Rejected" },
  cancelled: { color: "default", label: "Cancelled" },
  rescheduled: { color: "accent", label: "Rescheduled" },
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
        <Text className="text-sm text-foreground font-interMedium">
          {value}
        </Text>
      </View>
    </View>
  );
}

function SectionLabel({
  children,
  className = "text-muted",
}: {
  children: string;
  className?: string;
}) {
  return (
    <Text
      className={`text-xs font-interMedium uppercase tracking-wide ${className}`}
    >
      {children}
    </Text>
  );
}

function ActionButton({
  icon,
  label,
  onPress,
  variant = "secondary",
}: {
  icon: React.ReactElement<LucideIcon>;
  label: string;
  onPress?: () => void;
  variant?: "primary" | "secondary" | "danger";
}) {
  return (
    <Button variant={variant} size="sm" onPress={onPress} className="flex-1">
      {icon}
      <Button.Label>{label}</Button.Label>
    </Button>
  );
}

export default function VisitRequestCard({
  visitRequest,
  onPress,
  onAccept,
  onDecline,
  onMessageLandlord,
  onRequestAgain,
}: Props) {
  const { colors } = useColors();
  const [
    themeColorAccentForeground,
    themeColorAccentSoftForeground,
    themeColorDangerForeground,
  ] = useThemeColor([
    "accent-foreground",
    "accent-soft-foreground",
    "danger-foreground",
  ]);

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

  // Format time string (HH:MM:SS -> HH:MM AM/PM)
  const formatTime = (t: string) => {
    const [hours, minutes] = t.split(":").map(Number);
    const period = hours >= 12 ? "PM" : "AM";
    const h = hours % 12 || 12;
    return `${h}:${String(minutes).padStart(2, "0")} ${period}`;
  };

  const visitorsLabel = `${no_visitors} ${no_visitors === 1 ? "person" : "people"}`;

  // "approved" can be reached either directly, or via an accepted reschedule —
  // confirmed_visit_date/time win whenever they're set, since that's the real visit time.
  const finalVisitDate = confirmed_visit_date ?? visit_date;
  const finalVisitTime = confirmed_time ?? time;

  // "cancelled" covers two different tenant actions. If confirmed_visit_date is set,
  // this row came from declining a reschedule rather than a plain self-cancel.
  const isDeclinedReschedule =
    status === "cancelled" && !!confirmed_visit_date && !!confirmed_time;

  return (
    <PressableFeedback 
      onPress={onPress} 
      className="rounded-3xl shadow-none border border-border"
    >
      <Card className="gap-3">
        <Card.Body className="gap-3">
          {/* Header row */}
          <View className="flex-row items-center justify-between">
            <Text className="text-base text-foreground font-interMedium">
              Visit Request Details
            </Text>
            <Chip variant="soft" color={chipConfig.color}>
              <Chip.Label>{chipConfig.label}</Chip.Label>
            </Chip>
          </View>

          {/* PENDING — waiting on the landlord, show what was requested */}
          {status === "pending" && (
            <View className="gap-3">
              <View className="flex-row items-center gap-2 rounded-2xl bg-warning-light px-3 py-2.5">
                <Hourglass size={iconSize} color={colors.warning} />
                <Text className="flex-1 text-sm text-warning font-interMedium">
                  Waiting for the landlord to respond
                </Text>
              </View>
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
                  value={visitorsLabel}
                />
              </View>
            </View>
          )}

          {/* APPROVED — confirmed_visit_date/time win if set, else the original request */}
          {status === "approved" && (
            <View className="gap-3">
              <View className="flex-row items-center gap-2 rounded-2xl bg-success/10 px-3 py-2.5">
                <CheckCircle2 size={iconSize} color={colors.success} />
                <Text className="flex-1 text-sm text-success font-interMedium">
                  Visit confirmed
                </Text>
              </View>
              <View className="gap-2">
                <InfoRow
                  icon={<Calendar size={iconSize} color={iconColor} />}
                  label="Date"
                  value={formatDate(finalVisitDate, "long")}
                />
                <InfoRow
                  icon={<Clock size={iconSize} color={iconColor} />}
                  label="Time"
                  value={formatTime(finalVisitTime)}
                />
                <InfoRow
                  icon={<Users size={iconSize} color={iconColor} />}
                  label="Visitors"
                  value={visitorsLabel}
                />
              </View>
            </View>
          )}

          {/* REJECTED — original request (muted), the reason, and next steps */}
          {status === "rejected" && (
            <View className="gap-3">
              <View className="gap-2 opacity-70">
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
                  value={visitorsLabel}
                />
              </View>

              {rejected_reason && (
                <View className="flex-row gap-2.5 rounded-2xl bg-danger/10 px-3 py-2.5">
                  <AlertCircle size={iconSize} color={colors.danger} />
                  <View className="flex-1 gap-1">
                    <SectionLabel className="text-danger">
                      Rejection Reason
                    </SectionLabel>
                    <Text className="text-sm text-foreground font-inter leading-5">
                      {rejected_reason}
                    </Text>
                  </View>
                </View>
              )}

              <View className="flex-row gap-2">
                <ActionButton
                  icon={
                    <MessageCircle
                      size={iconSize}
                      color={themeColorAccentSoftForeground}
                    />
                  }
                  label="Message Landlord"
                  onPress={onMessageLandlord}
                  variant="secondary"
                />
                <ActionButton
                  icon={
                    <RotateCcw
                      size={iconSize}
                      color={themeColorAccentForeground}
                    />
                  }
                  label="Request Again"
                  onPress={onRequestAgain}
                  variant="primary"
                />
              </View>
            </View>
          )}

          {/* RESCHEDULED — landlord's proposed slot, tenant accepts or declines */}
          {status === "rescheduled" && (
            <View className="gap-3">
              {confirmed_visit_date && confirmed_time ? (
                <>
                  <View className="gap-1">
                    <SectionLabel>Originally requested</SectionLabel>
                    <Text className="text-sm text-muted font-inter">
                      {formatDate(visit_date, "long")} • {formatTime(time)}
                    </Text>
                  </View>

                  <Separator />

                  <View className="gap-2">
                    <SectionLabel className="text-accent">
                      Landlord proposed a new time
                    </SectionLabel>
                    <InfoRow
                      icon={
                        <CalendarCheck size={iconSize} color={colors.primary} />
                      }
                      label="Date"
                      value={formatDate(confirmed_visit_date, "long")}
                    />
                    <InfoRow
                      icon={<Clock size={iconSize} color={colors.primary} />}
                      label="Time"
                      value={formatTime(confirmed_time)}
                    />
                    <InfoRow
                      icon={<Users size={iconSize} color={iconColor} />}
                      label="Visitors"
                      value={visitorsLabel}
                    />
                  </View>

                  <View className="flex-row gap-2">
                    <ActionButton
                      icon={
                        <XCircle
                          size={iconSize}
                          color={themeColorDangerForeground}
                        />
                      }
                      label="Decline"
                      onPress={onDecline}
                      variant="danger"
                    />
                    <ActionButton
                      icon={
                        <CheckCircle2
                          size={iconSize}
                          color={themeColorAccentForeground}
                        />
                      }
                      label="Accept"
                      onPress={onAccept}
                      variant="primary"
                    />
                  </View>
                </>
              ) : (
                <Text className="text-sm text-muted font-inter">
                  The landlord proposed a new time, but the details aren&apos;t
                  available yet.
                </Text>
              )}
            </View>
          )}

          {/* CANCELLED — either a self-cancel, or a declined reschedule */}
          {status === "cancelled" && (
            <View className="gap-3">
              <View className="flex-row items-center gap-2 rounded-2xl bg-muted/10 px-3 py-2.5">
                <CalendarX size={iconSize} color={iconColor} />
                <Text className="flex-1 text-sm text-muted font-interMedium">
                  {isDeclinedReschedule
                    ? "You declined the reschedule"
                    : "You cancelled this visit"}
                </Text>
              </View>

              <View className="gap-2 opacity-70">
                <InfoRow
                  icon={<Calendar size={iconSize} color={iconColor} />}
                  label="Date"
                  value={formatDate(
                    isDeclinedReschedule ? confirmed_visit_date! : visit_date,
                    "long",
                  )}
                />
                <InfoRow
                  icon={<Clock size={iconSize} color={iconColor} />}
                  label="Time"
                  value={formatTime(
                    isDeclinedReschedule ? confirmed_time! : time,
                  )}
                />
                <InfoRow
                  icon={<Users size={iconSize} color={iconColor} />}
                  label="Visitors"
                  value={visitorsLabel}
                />
              </View>

              {isDeclinedReschedule && (
                <ActionButton
                  icon={
                    <RotateCcw
                      size={iconSize}
                      color={themeColorAccentForeground}
                    />
                  }
                  label="Request Again"
                  onPress={onRequestAgain}
                  variant="primary"
                />
              )}
            </View>
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

          <Separator />

          <Text className="text-xs text-muted font-inter">
            Submitted: {formatDate(created_at, "long")}
          </Text>
        </Card.Body>
      </Card>
    </PressableFeedback>
  );
}
