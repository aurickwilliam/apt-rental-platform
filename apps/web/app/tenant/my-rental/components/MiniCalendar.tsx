"use client";

import { useState } from "react";
import { Calendar } from "@heroui/react";
import { endOfMonth, parseDate } from "@internationalized/date";

import DashboardCard from "./DashboardCard";

type MiniCalendarProps = {
  focusDate: Date;
  highlightDate?: Date | null;
  highlightLabel?: string;
};

function formatShortDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
}

function toCalendarDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return parseDate(`${year}-${month}-${day}`);
}

export default function MiniCalendar({ focusDate, highlightDate, highlightLabel }: MiniCalendarProps) {
  const [focusedValue, setFocusedValue] = useState(() => toCalendarDate(focusDate));
  const selectedValue = highlightDate ? toCalendarDate(highlightDate) : null;
  const monthEnd = endOfMonth(focusedValue);
  const highlightKey = selectedValue ? selectedValue.toString() : null;

  // Refocus when the parent moves to another month (compared by value, so a
  // new Date for the same day doesn't reset the user's navigation).
  const [syncedFocusTime, setSyncedFocusTime] = useState(focusDate.getTime());
  if (syncedFocusTime !== focusDate.getTime()) {
    setSyncedFocusTime(focusDate.getTime());
    setFocusedValue(toCalendarDate(focusDate));
  }

  return (
    <DashboardCard>
      <div className="mx-auto w-full max-w-sm">
        <Calendar
          aria-label="Rent calendar"
          value={selectedValue as unknown as never}
          focusedValue={focusedValue as unknown as never}
          onFocusChange={(value) => setFocusedValue(value as unknown as typeof focusedValue)}
          isReadOnly
          className="w-full! max-w-none!"
          style={{ width: "100%", maxWidth: "none" }}
        >
          <Calendar.Header className="flex items-center justify-between pb-2" style={{ width: "100%" }}>
            <Calendar.Heading className="font-nunito text-base font-bold text-card-foreground" />
            <div className="flex items-center gap-1">
              <Calendar.NavButton
                slot="previous"
                className="text-muted-foreground hover:text-card-foreground"
              />
              <Calendar.NavButton
                slot="next"
                className="text-muted-foreground hover:text-card-foreground"
              />
            </div>
          </Calendar.Header>

          <Calendar.Grid className="w-full" style={{ width: "100%", tableLayout: "fixed", marginLeft: "auto", marginRight: "auto" }}>
            <Calendar.GridHeader>
              {(day) => (
                <Calendar.HeaderCell className="pb-1 text-center font-inter text-xs font-medium text-muted-foreground">
                  {day}
                </Calendar.HeaderCell>
              )}
            </Calendar.GridHeader>
            <Calendar.GridBody>
              {(date) => (
                <Calendar.Cell
                  date={date}
                  className="p-0.5 text-center font-inter text-sm text-muted-foreground"
                  // The inner circle owns date colors, not HeroUI's selected/today fill.
                  style={{ backgroundColor: "transparent" }}
                >
                  {({ formattedDate, isToday, isOutsideMonth }) => (
                    <div
                      className={`relative mx-auto flex aspect-square w-full max-w-10 flex-col items-center justify-center rounded-full border-2 ${isToday ? "border-black" : "border-transparent"} ${date.toString() === highlightKey ? "bg-orange-500 text-white" : !isOutsideMonth && date.compare(monthEnd) === 0 ? "bg-primary text-white" : "text-muted-foreground"}`}
                    >
                      <span className="leading-none">{formattedDate}</span>
                      {!isOutsideMonth && date.compare(monthEnd) === 0 && date.toString() === highlightKey && (
                        <span aria-label="Month end" className="absolute bottom-1 h-1 w-1 rounded-full bg-primary" />
                      )}
                    </div>
                  )}
                </Calendar.Cell>
              )}
            </Calendar.GridBody>
          </Calendar.Grid>
        </Calendar>

        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2">
          {highlightDate && (
            <div className="flex items-center gap-2 font-inter text-[12px] text-muted-foreground">
              <div className="size-2 shrink-0 rounded-full bg-orange-500" />
              {formatShortDate(highlightDate)} — {highlightLabel ?? "Rent due"}
            </div>
          )}
          <div className="flex items-center gap-2 font-inter text-[12px] text-muted-foreground">
            <div className="size-2 shrink-0 rounded-full bg-primary" />
            {formatShortDate(new Date(monthEnd.year, monthEnd.month - 1, monthEnd.day))} — Month end
          </div>
        </div>
      </div>
    </DashboardCard>
  );
}
