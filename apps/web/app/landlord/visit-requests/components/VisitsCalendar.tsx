"use client";

import { useMemo, useState } from "react";
import { Card } from "@heroui/react";
import { ChevronLeft, ChevronRight, Hourglass } from "lucide-react";

function toISODate(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

type Props = {
  markedDates: string[];
  selectedDate: string | null;
  onSelectDate: (date: string | null) => void;
  pendingCount: number;
  onPendingPress: () => void;
};

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export default function VisitsCalendar({
  markedDates,
  selectedDate,
  onSelectDate,
  pendingCount,
  onPendingPress,
}: Props) {
  const today = useMemo(() => new Date(), []);
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const marked = useMemo(() => new Set(markedDates), [markedDates]);
  const todayStr = toISODate(today.getFullYear(), today.getMonth(), today.getDate());

  const cells = useMemo(() => {
    const firstWeekday = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const list: (string | null)[] = Array.from({ length: firstWeekday }, () => null);
    for (let day = 1; day <= daysInMonth; day++) {
      list.push(toISODate(viewYear, viewMonth, day));
    }
    return list;
  }, [viewYear, viewMonth]);

  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const shiftMonth = (delta: number) => {
    const next = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
  };

  return (
    <Card className="border border-border bg-card text-card-foreground p-4 rounded-2xl">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-semibold text-card-foreground">{monthLabel}</p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Previous month"
            onClick={() => shiftMonth(-1)}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            aria-label="Next month"
            onClick={() => shiftMonth(1)}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {WEEKDAYS.map((day) => (
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
              {marked.has(iso) && (
                <span className={`mt-0.5 h-1 w-1 rounded-full ${selectedDate === iso ? "bg-white" : "bg-amber-500"}`} />
              )}
            </button>
          ),
        )}
      </div>

      <button
        type="button"
        onClick={onPendingPress}
        className="mt-3 flex w-full items-center gap-2 rounded-2xl px-3 py-2.5 text-left transition-colors"
        style={{ backgroundColor: "#FFF8E1" }}
      >
        <Hourglass size={16} style={{ color: "#FACC15" }} className="shrink-0" />
        <span className="flex-1 text-sm font-medium" style={{ color: "#FACC15" }}>
          {pendingCount} pending request{pendingCount === 1 ? "" : "s"} waiting for review
        </span>
      </button>
    </Card>
  );
}
