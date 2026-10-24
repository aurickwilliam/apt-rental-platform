import { View, Text, TouchableOpacity } from "react-native";
import type { ComponentType } from "react";

import {
  IconAlertTriangle,
  IconCash,
  IconCalendarEvent,
  IconCircleCheck,
  IconChevronRight,
  IconFileDescription,
  IconTool,
  type IconProps,
} from "@tabler/icons-react-native";

import { formatPesoDisplay } from "@repo/utils";

import { useColors } from "@/hooks/useTheme";

import type {
  AttentionItem,
  AttentionKey,
} from "@/service/dashboard/dashboardService";

type Tone = "danger" | "warning" | "primary";

interface AttentionRowConfig {
  Icon: ComponentType<IconProps>;
  tone: Tone;
  describe: (item: AttentionItem) => { title: string; detail?: string };
}

const plural = (count: number, singular: string, pluralForm = `${singular}s`) =>
  `${count} ${count === 1 ? singular : pluralForm}`;

const ROWS: Record<AttentionKey, AttentionRowConfig> = {
  overdue: {
    Icon: IconAlertTriangle,
    tone: "danger",
    describe: (item) => ({
      title: `${plural(item.count, "overdue payment")}`,
      detail: formatPesoDisplay(item.amount ?? 0),
    }),
  },
  cash: {
    Icon: IconCash,
    tone: "warning",
    describe: (item) => ({
      title: `${plural(item.count, "cash payment")} to confirm`,
      detail: formatPesoDisplay(item.amount ?? 0),
    }),
  },
  applications: {
    Icon: IconFileDescription,
    tone: "primary",
    describe: (item) => ({ title: `${plural(item.count, "new application")}` }),
  },
  visits: {
    Icon: IconCalendarEvent,
    tone: "primary",
    describe: (item) => ({ title: `${plural(item.count, "visit request")}` }),
  },
  maintenance: {
    Icon: IconTool,
    tone: "warning",
    describe: (item) => ({
      title: `${plural(item.count, "open maintenance request")}`,
    }),
  },
};

const CHIP_CLASS: Record<Tone, string> = {
  danger: "bg-danger-light",
  warning: "bg-warning-light",
  primary: "bg-primary-light",
};

interface AttentionCardProps {
  items: AttentionItem[];
  /** Null means the row is informational (e.g. overdue rent is listed below). */
  onPressItem: (item: AttentionItem) => (() => void) | null;
}

export default function AttentionCard({
  items,
  onPressItem,
}: AttentionCardProps) {
  const { colors } = useColors();

  const toneColor: Record<Tone, string> = {
    danger: colors.danger,
    warning: colors.warningText,
    primary: colors.primaryLightForeground,
  };

  return (
    <View className="bg-surface rounded-3xl border border-border p-4 gap-3">
      <Text className="text-accent font-nunitoBold text-xl">
        Needs attention
      </Text>

      {items.length === 0 ? (
        <View className="flex-row items-center gap-3">
          <IconCircleCheck size={22} color={colors.successText} />
          <Text className="text-muted font-inter flex-1">
            You&apos;re all caught up. Nothing needs your action right now.
          </Text>
        </View>
      ) : (
        items.map((item) => {
          const { Icon, tone, describe } = ROWS[item.key];
          const { title, detail } = describe(item);
          const onPress = onPressItem(item);

          return (
            <TouchableOpacity
              key={item.key}
              className="flex-row items-center gap-3"
              activeOpacity={0.7}
              disabled={onPress === null}
              onPress={onPress ?? undefined}
              accessibilityRole={onPress ? "button" : "text"}
              accessibilityLabel={detail ? `${title}, ${detail}` : title}
            >
              <View className={`rounded-full p-2 ${CHIP_CLASS[tone]}`}>
                <Icon size={20} color={toneColor[tone]} />
              </View>

              <View className="flex-1">
                <Text className="text-foreground font-nunitoSemiBold">
                  {title}
                </Text>
                {detail ? (
                  <Text className="text-muted font-inter text-sm">
                    {detail}
                  </Text>
                ) : null}
              </View>

              {onPress ? (
                <IconChevronRight size={18} color={colors.gray500} />
              ) : null}
            </TouchableOpacity>
          );
        })
      )}
    </View>
  );
}
