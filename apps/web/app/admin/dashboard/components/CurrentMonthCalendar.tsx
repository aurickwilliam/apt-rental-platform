"use client";

import { Calendar } from "@heroui/react";
import { parseDate } from "@internationalized/date";

interface CurrentMonthCalendarProps {
  today: string;
}

export default function CurrentMonthCalendar({
  today,
}: CurrentMonthCalendarProps) {
  return (
    <section
      className="min-w-0 rounded-3xl border border-border bg-card p-4 sm:p-5"
      aria-labelledby="current-month-heading"
    >
      <Calendar
        aria-label="Current month calendar"
        defaultValue={parseDate(today)}
        className="w-full max-w-none"
      >
        <Calendar.Header>
          <Calendar.YearPickerTrigger>
            <Calendar.YearPickerTriggerHeading />
            <Calendar.YearPickerTriggerIndicator className="text-muted-foreground" />
          </Calendar.YearPickerTrigger>
          <Calendar.NavButton
            slot="previous"
            className="text-muted-foreground"
          />
          <Calendar.NavButton slot="next" className="text-muted-foreground" />
        </Calendar.Header>
        <Calendar.Grid className="w-full">
          <Calendar.GridHeader>
            {(day) => <Calendar.HeaderCell>{day}</Calendar.HeaderCell>}
          </Calendar.GridHeader>
          <Calendar.GridBody>
            {(date) => (
              <Calendar.Cell
                date={date}
                className="data-selected:bg-primary data-selected:text-white"
              />
            )}
          </Calendar.GridBody>
        </Calendar.Grid>
        <Calendar.YearPickerGrid>
          <Calendar.YearPickerGridBody>
            {(yearProps) => (
              <Calendar.YearPickerCell
                year={yearProps.year}
                className="data-selected:bg-primary data-selected:text-white"
              />
            )}
          </Calendar.YearPickerGridBody>
        </Calendar.YearPickerGrid>
      </Calendar>
    </section>
  );
}
