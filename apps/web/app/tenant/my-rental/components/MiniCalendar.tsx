"use client";

import { useState } from "react";
import { Calendar } from "@heroui/react";
import { parseDate } from "@internationalized/date";

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
  const monthEnd = new Date(focusDate.getFullYear(), focusDate.getMonth() + 1, 0);
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
      <Calendar
        aria-label="Rent calendar"
        value={selectedValue as unknown as never}
        focusedValue={focusedValue as unknown as never}
        onFocusChange={(value) => setFocusedValue(value as unknown as typeof focusedValue)}
        isReadOnly
        className="w-full"
        style={{ width: "100%" }}
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
                className="group p-0.5 text-center font-inter text-sm text-muted-foreground"
              >
                {({ formattedDate }) => (
                  <div className="mx-auto flex h-10 w-10 flex-col items-center justify-center rounded-full group-data-[selected=true]:bg-orange-500 group-data-[selected=true]:text-white group-data-[today=true]:bg-primary group-data-[today=true]:text-white">
                    <span className="leading-none">{formattedDate}</span>
                    {highlightKey && date.toString() === highlightKey && (
                      <Calendar.CellIndicator className="mt-0.5 h-1 w-1 rounded-full bg-orange-500 group-data-[selected=true]:bg-white" />
                    )}
                  </div>
                )}
              </Calendar.Cell>
            )}
          </Calendar.GridBody>
        </Calendar.Grid>
      </Calendar>

      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
        {highlightDate && (
          <div className="flex items-center gap-2 font-inter text-[12px] text-muted-foreground">
            <div className="w-2 h-2 rounded-full bg-orange-500" />
            {formatShortDate(highlightDate)} — {highlightLabel ?? "Rent due"}
          </div>
        )}
        <div className={`flex items-center gap-2 font-inter text-[12px] text-muted-foreground ${highlightDate ? "border-l border-border pl-4" : ""}`}>
          <div className="w-2 h-2 rounded-full bg-primary" />
          {formatShortDate(monthEnd)} — Month end
        </div>
      </div>
    </DashboardCard>
  );
}
