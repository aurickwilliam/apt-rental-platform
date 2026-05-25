"use client";

import { useEffect, useState } from "react";
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

  useEffect(() => {
    setFocusedValue(toCalendarDate(focusDate));
  }, [focusDate]);

  return (
    <DashboardCard>
      <Calendar
        aria-label="Rent calendar"
        value={selectedValue as unknown as never}
        focusedValue={focusedValue as unknown as never}
        onFocusChange={(value) => setFocusedValue(value as unknown as typeof focusedValue)}
        isReadOnly
        className="w-full"
      >
        <Calendar.Header className="flex items-center justify-between pb-2">
          <Calendar.Heading className="text-sm font-medium text-zinc-900 dark:text-zinc-100" />
          <div className="flex items-center gap-1">
            <Calendar.NavButton
              slot="previous"
              className="text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
            />
            <Calendar.NavButton
              slot="next"
              className="text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
            />
          </div>
        </Calendar.Header>

        <Calendar.Grid>
          <Calendar.GridHeader>
            {(day) => (
              <Calendar.HeaderCell className="text-[10px] font-medium text-zinc-400 text-center">
                {day}
              </Calendar.HeaderCell>
            )}
          </Calendar.GridHeader>
          <Calendar.GridBody>
            {(date) => (
              <Calendar.Cell
                date={date}
                className="h-7 w-7 mx-auto flex flex-col items-center justify-center text-[12px] text-zinc-500 dark:text-zinc-400 rounded-full data-[selected=true]:bg-amber-500 data-[selected=true]:text-white data-[today=true]:bg-zinc-900 data-[today=true]:text-white dark:data-[today=true]:bg-zinc-100 dark:data-[today=true]:text-zinc-900"
              >
                {({ formattedDate }) => (
                  <>
                    <span className="leading-none">{formattedDate}</span>
                    {highlightKey && date.toString() === highlightKey && (
                      <Calendar.CellIndicator className="mt-0.5 h-1 w-1 rounded-full bg-amber-500 data-[selected=true]:bg-white" />
                    )}
                  </>
                )}
              </Calendar.Cell>
            )}
          </Calendar.GridBody>
        </Calendar.Grid>
      </Calendar>

      <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800 space-y-1.5">
        {highlightDate && (
          <div className="flex items-center gap-2 text-[12px] text-zinc-500 dark:text-zinc-400">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            {formatShortDate(highlightDate)} — {highlightLabel ?? "Rent due"}
          </div>
        )}
        <div className="flex items-center gap-2 text-[12px] text-zinc-400">
          <div className="w-2 h-2 rounded-full bg-zinc-300 dark:bg-zinc-600" />
          {formatShortDate(monthEnd)} — Month end
        </div>
      </div>
    </DashboardCard>
  );
}
