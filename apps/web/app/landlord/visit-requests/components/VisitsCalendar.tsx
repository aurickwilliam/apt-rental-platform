"use client";

import { useMemo, useState } from "react";
import { Card } from "@heroui/react";
import { ChevronLeft, ChevronRight } from "lucide-react";

function toISODate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function parseISODate(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day);
}

const WEEKDAY_NAMES = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

type Props = {
  markedDates: string[];
  selectedDate: string | null;
  onSelectDate: (date: string | null) => void;
};

export default function VisitsCalendar({ markedDates, selectedDate, onSelectDate }: Props) {
  const today = useMemo(() => new Date(), []);
  const todayStr = toISODate(today);

  const anchorDate = selectedDate ? parseISODate(selectedDate) : today;
  const [monthOffset, setMonthOffset] = useState(0);

  const viewDate = useMemo(
    () => new Date(anchorDate.getFullYear(), anchorDate.getMonth() + monthOffset, 1),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedDate, monthOffset],
  );

  const cells = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const leadingBlanks = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const list: (string | null)[] = Array.from({ length: leadingBlanks }, () => null);
    for (let day = 1; day <= daysInMonth; day++) {
      list.push(toISODate(new Date(year, month, day)));
    }
    return list;
  }, [viewDate]);

  const marked = useMemo(() => new Set(markedDates), [markedDates]);

  const monthLabel = viewDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <Card className="border border-border bg-card text-card-foreground p-4 rounded-2xl">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-semibold text-card-foreground">{monthLabel}</p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Previous month"
            onClick={() => setMonthOffset((offset) => offset - 1)}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            aria-label="Next month"
            onClick={() => setMonthOffset((offset) => offset + 1)}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {WEEKDAY_NAMES.map((day) => (
          <p key={day} className="text-center text-[10px] font-medium text-muted-foreground py-1">
            {day}
          </p>
        ))}
        {cells.map((iso, index) =>
          iso === null ? (
            <span key={`empty-${index}`} />
          ) : (
            <button
              key={iso}
              type="button"
              onClick={() => onSelectDate(selectedDate === iso ? null : iso)}
              className={`flex flex-col items-center justify-center rounded-full py-1.5 text-xs transition-colors ${
                selectedDate === iso
                  ? "bg-primary text-white"
                  : iso === todayStr
                    ? "bg-muted font-semibold text-card-foreground"
                    : "text-muted-foreground hover:bg-muted"
              }`}
            >
              <span className="leading-none">{Number(iso.slice(8, 10))}</span>
              <span className="flex h-1 items-center">
                {marked.has(iso) && (
                  <span className={`h-1 w-1 rounded-full ${selectedDate === iso ? "bg-white" : "bg-amber-500"}`} />
                )}
              </span>
            </button>
          ),
        )}
      </div>
    </Card>
  );
}
