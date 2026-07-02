import { useState } from "react";
import { View, Text } from "react-native";
import { Calendar } from "react-native-calendars";

import { BottomSheet, Button, useToast } from "heroui-native";

import { useColors } from "@/hooks/useTheme";

import TimeField from "@/components/inputs/TimeField";

import { ChevronLeft, ChevronRight } from "lucide-react-native";

import { formatDate } from "@repo/utils";

type Period = "AM" | "PM";

type Props = {
  isOpen: boolean;
  isLoading: boolean;
  onClose: () => void;
  onConfirm: (date: string, time: string) => void;
};

const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);

const minSelectableDate = tomorrow.toISOString().split("T")[0];

function toSupabaseTime(hour: string, period: Period): string {
  let h = parseInt(hour, 10);
  if (period === "AM" && h === 12) h = 0;
  if (period === "PM" && h !== 12) h += 12;
  return `${String(h).padStart(2, "0")}:00:00`;
}

export default function RescheduleSheet({
  isOpen,
  isLoading,
  onClose,
  onConfirm,
}: Props) {
  const { colors } = useColors();
  const { toast } = useToast();

  const [selectedDate, setSelectedDate] = useState("");
  const [hour, setHour] = useState("");
  const [period, setPeriod] = useState<Period>("AM");

  const handleConfirm = () => {
    if (!selectedDate || !hour) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const pickedDate = new Date(`${selectedDate}T00:00:00`);

    if (pickedDate <= today) {
      toast.show({
        label: "Invalid Date",
        description: "Please select a date starting tomorrow.",
        variant: "danger",
      });

      return;
    }

    onConfirm(selectedDate, toSupabaseTime(hour, period));
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setSelectedDate("");
      setHour("");
      setPeriod("AM");
      onClose();
    }
  };

  const canConfirm = !!selectedDate && !!hour;

  return (
    <BottomSheet isOpen={isOpen} onOpenChange={handleOpenChange}>
      <BottomSheet.Portal>
        <BottomSheet.Overlay />
        <BottomSheet.Content>
          <View className="gap-4">
            {/* Header */}
            <View className="gap-1">
              <BottomSheet.Title className="text-foreground text-lg font-interSemiBold">
                Propose New Schedule
              </BottomSheet.Title>
              <BottomSheet.Description className="text-muted text-sm font-inter">
                Pick a date and time for the tenant to confirm.
              </BottomSheet.Description>
            </View>

            {/* Date picker */}
            <Calendar
              minDate={minSelectableDate}
              onDayPress={(day) => setSelectedDate(day.dateString)}
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
              markedDates={
                selectedDate
                  ? {
                      [selectedDate]: {
                        selected: true,
                        selectedColor: colors.primary,
                      },
                    }
                  : {}
              }
              theme={{
                backgroundColor: "transparent",
                calendarBackground: "transparent",
                textSectionTitleColor: colors.gray400,
                selectedDayBackgroundColor: colors.primary,
                selectedDayTextColor: colors.white,
                todayTextColor: colors.primary,
                dayTextColor: colors.textPrimary,
                arrowColor: colors.primary,
                monthTextColor: colors.textPrimary,
                textDayFontFamily: "Inter_24pt-Medium",
              }}
            />

            {/* Time picker */}
            <TimeField
              label="Preferred Time"
              hour={hour}
              period={period}
              onHourChange={setHour}
              onPeriodChange={setPeriod}
              isInvalid={!hour && !!selectedDate}
            />

            {/* Footer buttons */}
            <View className="flex-row gap-3 mt-5">
              <Button
                className="flex-1"
                variant="danger-soft"
                onPress={() => handleOpenChange(false)}
                isDisabled={isLoading}
              >
                <Button.Label>Cancel</Button.Label>
              </Button>

              <Button
                className="flex-1"
                onPress={handleConfirm}
                isDisabled={!canConfirm || isLoading}
              >
                <Button.Label>Propose</Button.Label>
              </Button>
            </View>
          </View>
        </BottomSheet.Content>
      </BottomSheet.Portal>
    </BottomSheet>
  );
}
