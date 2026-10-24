import { useEffect, useRef, useState, type ComponentType, type ReactNode } from "react";
import { Pressable, Text, View, type LayoutChangeEvent } from "react-native";
import Svg, { Line } from "react-native-svg";
import { Chip } from "heroui-native";
import * as Clipboard from "expo-clipboard";
import {
  IconAlertCircle,
  IconCheck,
  IconCircleCheck,
  IconCircleX,
  IconClockHour4,
  IconCopy,
} from "@tabler/icons-react-native";

import {
  formatPesoDisplay,
  formatReceiptDate,
  landlordReceiptStatus,
  ledgerPeriodLabel,
  paymentBreakdown,
  type ReceiptStatusLabel,
  type ReceiptTone,
} from "@repo/utils";

import PaymentMethodChip from "@/components/display/PaymentMethodChip";
import ZigzagEdge from "@/app/tenant/payment/components/ZigzagEdge";
import { statusChipSurface, useStatusChipStyles } from "@/hooks/useStatusChipStyles";
import { useColors } from "@/hooks/useTheme";
import { formatReferenceId, type PaymentRecord } from "@/service/payments/paymentService";

type StatusIcon = ComponentType<{ size?: number; color?: string }>;

const STATUS_ICONS: Record<ReceiptStatusLabel, StatusIcon> = {
  Paid: IconCircleCheck,
  Pending: IconClockHour4,
  Rejected: IconCircleX,
  Failed: IconCircleX,
  Unpaid: IconAlertCircle,
};

// The receipt is an always-white paper, so its text uses fixed light-surface colors
// instead of the theme's, which would turn light on it in dark mode.
const PAPER = { text: "#18181B", muted: "#71717A", divider: "#D4D4D8" };
const TONE_COLORS: Record<ReceiptTone, string> = { success: "#16A34A", warning: "#F59E0B", danger: "#DC2626" };
const COPIED_MS = 1800;

function formatTime(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "—" : new Intl.DateTimeFormat("en-PH", { timeStyle: "short" }).format(date);
}

// A drawn dashed line: a dashed border on one side of a View renders solid on iOS.
function Divider() {
  const [width, setWidth] = useState(0);
  return (
    <View className="my-5 h-px" onLayout={(event: LayoutChangeEvent) => setWidth(Math.round(event.nativeEvent.layout.width))}>
      {width > 0 ? (
        <Svg width={width} height={1}>
          <Line x1={0} y1={0.5} x2={width} y2={0.5} stroke={PAPER.divider} strokeWidth={1} strokeDasharray="4 4" />
        </Svg>
      ) : null}
    </View>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View className="flex-row items-center justify-between gap-4">
      <Text className="text-sm font-inter" style={{ color: PAPER.muted }}>{label}</Text>
      <View className="flex-1 items-end">{children}</View>
    </View>
  );
}

function RowText({ children, strong = false }: { children: ReactNode; strong?: boolean }) {
  return (
    <Text
      className={`text-sm text-right ${strong ? "font-nunitoBold" : "font-nunitoSemiBold"}`}
      style={{ color: PAPER.text }}
    >
      {children}
    </Text>
  );
}

function CopyReference({ reference }: { reference: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const copy = async () => {
    try {
      await Clipboard.setStringAsync(reference);
      setCopied(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), COPIED_MS);
    } catch {
      // The reference stays selectable on screen if the clipboard refuses.
      console.error("The reference could not be copied.");
    }
  };

  return (
    <View className="flex-row items-center gap-1.5">
      <Text selectable className="text-[13px] font-nunitoSemiBold" style={{ color: PAPER.text }}>
        {reference}
      </Text>
      <Pressable
        onPress={() => void copy()}
        accessibilityRole="button"
        accessibilityLabel={copied ? "Reference copied" : "Copy reference"}
        hitSlop={8}
        className="size-7 items-center justify-center rounded-md active:opacity-60"
      >
        {copied ? <IconCheck size={15} color={TONE_COLORS.success} /> : <IconCopy size={15} color={PAPER.muted} />}
      </Pressable>
    </View>
  );
}

interface PaymentReceiptProps {
  payment: PaymentRecord;
  /** Rendered under the lines: the actions, or a closing note. */
  footer: ReactNode;
}

// The landlord's receipt, the same as the web's: a white paper with the status, the
// amount, who paid for what, the method and status chips, a breakdown with a total
// for move-in payments, a copyable reference, and a torn edge below.
export default function PaymentReceipt({ payment, footer }: PaymentReceiptProps) {
  const { colors } = useColors();
  const chipStyles = useStatusChipStyles();
  const status = landlordReceiptStatus(payment.status);
  const Icon = STATUS_ICONS[status.label];
  const toneColor = TONE_COLORS[status.tone];
  const chipStyle = chipStyles[status.tone];
  const period =
    payment.billing_kind === "move_in"
      ? "Move-in payment"
      : ledgerPeriodLabel(payment.due_date ?? payment.period_start ?? payment.date);
  const amount = formatPesoDisplay(payment.amount ?? 0);
  const breakdown = paymentBreakdown(payment);

  return (
    <View accessibilityLabel={`Receipt for ${period}`}>
      <View className="bg-white rounded-t-3xl px-6 pt-7 pb-14">
        <View className="items-center">
          <Icon size={44} color={toneColor} />
          <Text className="mt-2 text-lg font-nunitoBold" style={{ color: toneColor }}>
            {status.title}
          </Text>
          <Text className="mt-3 text-4xl font-nunitoBold" style={{ color: colors.primary }}>
            {amount}
          </Text>
          <Text className="mt-1 text-sm font-inter" style={{ color: PAPER.muted }}>{period}</Text>
        </View>

        <Divider />

        <View className="gap-3">
          <Row label="Tenant"><RowText>{payment.tenant_name ?? "—"}</RowText></Row>
          <Row label="Apartment"><RowText>{payment.apartment_name ?? "—"}</RowText></Row>
          <Row label={status.label === "Paid" ? "Paid on" : "Recorded on"}>
            <RowText>{formatReceiptDate(payment.date)}</RowText>
            <Text className="text-xs font-inter text-right" style={{ color: PAPER.muted }}>
              {formatTime(payment.created_at)}
            </Text>
          </Row>
          <Row label="Method"><View className="w-full flex-row justify-end"><PaymentMethodChip method={payment.method} /></View></Row>
          <Row label="Status">
            <View className="w-full flex-row justify-end">
              <Chip variant="soft" size="sm" animation="disable-all" style={statusChipSurface(chipStyle)}>
                <Chip.Label style={{ color: chipStyle.textColor }} className="text-[11px] font-nunitoSemiBold">
                  {status.label}
                </Chip.Label>
              </Chip>
            </View>
          </Row>
        </View>

        {breakdown.length > 0 ? (
          <>
            <Divider />
            <View className="gap-2.5">
              {breakdown.map((line) => (
                <Row key={line.label} label={line.label}><RowText>{formatPesoDisplay(line.amount)}</RowText></Row>
              ))}
              <View className="flex-row items-center justify-between gap-4 border-t pt-2.5" style={{ borderColor: "#E4E4E7" }}>
                <Text className="text-sm font-nunitoSemiBold" style={{ color: "#3F3F46" }}>Total</Text>
                <Text className="text-sm font-nunitoBold" style={{ color: colors.primary }}>{amount}</Text>
              </View>
            </View>
          </>
        ) : null}

        <Divider />

        <Row label="Reference No."><CopyReference reference={formatReferenceId(payment.reference_id)} /></Row>

        <View className="mt-6">{footer}</View>
      </View>

      {/* White teeth hang below the paper: a true transparent cut-out, no shadow to show through it. */}
      <ZigzagEdge hanging cutColor="#FFFFFF" depth={10} toothWidth={16} />
    </View>
  );
}
