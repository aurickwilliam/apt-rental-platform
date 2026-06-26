import { useCallback } from "react";
import { Pressable, Text, View } from "react-native";
import { Calendar, DateData } from "react-native-calendars";

import { Bell, ChevronLeft, ChevronRight } from "lucide-react-native";

import { Separator } from 'heroui-native';

import { useColors } from "@/hooks/useTheme";

import { formatDate } from "@repo/utils";

interface VisitRequestCalendarProps {
  markedDates: string[];
  selectedDate: string | null;
  onSelectDate: (date: string | null) => void;
  pendingCount: number;
  onPendingPress: () => void;
}

export default function VisitRequestCalendar({
  markedDates,
  selectedDate,
  onSelectDate,
  pendingCount,
  onPendingPress
}: VisitRequestCalendarProps) {
  const { colors } = useColors();

  const markedSet = new Set(markedDates);

  const handleDayPress = useCallback(
    (day: DateData) => {
      onSelectDate(selectedDate === day.dateString ? null : day.dateString);
    },
    [selectedDate, onSelectDate]
  );

  return (
    <View>
      <Calendar
        onDayPress={handleDayPress}
        enableSwipeMonths
        renderHeader={(date) => {
          // date here is a XDate object from the library
          const label = formatDate(date, "month") + " " + formatDate(date, "year");
          return (
            <Text className="text-base font-interSemiBold text-foreground">
              {label}
            </Text>
          );
        }}
        renderArrow={(direction) =>
          direction === "left" ? (
            <ChevronLeft size={20} color={colors.gray500} />
          ) : (
            <ChevronRight size={20} color={colors.gray500} />
          )
        }
        dayComponent={({ date, state }) => {
          if (!date) return <View className="w-10 h-10"/>;

          const dateStr = date.dateString;
          const isSelected = selectedDate === dateStr;
          const hasRequest = markedSet.has(dateStr);
          const isDisabled = state === "disabled";

          // Priority: selected > has request > default
          const bgColor = isSelected
            ? colors.primary
            : hasRequest
            ? colors.secondary
            : colors.surface;

          const textColor = isSelected || hasRequest
            ? colors.white
            : isDisabled
            ? colors.gray400
            : colors.textPrimary;

          return (
            <Pressable
              onPress={() => handleDayPress(date as DateData)}
              className="w-10 h-10 items-center justify-center"
            >
              <View
                style={{
                  backgroundColor: bgColor,
                  opacity: isDisabled ? 0.4 : 1,
                }}
                className={`w-9 h-9 rounded-full items-center justify-center`}
              >
                <Text
                  style={{ color: textColor }}
                  className="font-interMedium text-foreground"
                >
                  {date.day}
                </Text>
              </View>
            </Pressable>
          );
        }}
        theme={{
          backgroundColor: "transparent",
          calendarBackground: "transparent",
          textSectionTitleColor: colors.gray500,
          textDayHeaderFontFamily: "Inter_24pt-Medium",
          textDayHeaderFontSize: 12,
        }}
      />

      <Separator className="my-2" />

      <Pressable
        onPress={onPendingPress}
        className="flex-row items-center justify-between p-2"
      >
        <View className="flex-row items-center gap-3">
          <View className="bg-accent-light rounded-full p-1">
            <Bell size={18} color={colors.primary} />
          </View>
          <Text className="text-foreground text-sm font-interMedium">
            Pending Visit Requests
          </Text>
        </View>

        <View className="flex-row items-center gap-1">
          {pendingCount > 0 && (
            <View className="bg-accent rounded-full px-2 py-1">
              <Text className="text-white text-xs font-interSemiBold">
                {pendingCount}
              </Text>
            </View>
          )}
          <ChevronRight size={18} color={colors.gray500} />
        </View>
      </Pressable>
    </View>
  );
}
