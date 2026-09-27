"use client";

import { useRouter } from "next/navigation";
import { DateField, DateRangePicker, Label, RangeCalendar } from "@heroui/react";
import { parseDate } from "@internationalized/date";

interface DateRangeControlProps {
  from: string;
  to: string;
  today: string;
}

export default function DateRangeControl({ from, to, today }: DateRangeControlProps) {
  const router = useRouter();

  return (
    <DateRangePicker
      key={`${from}-${to}`}
      className="w-full sm:w-80"
      defaultValue={{ start: parseDate(from), end: parseDate(to) }}
      minValue={parseDate(today).subtract({ days: 89 })}
      maxValue={parseDate(today)}
      onChange={(range) => {
        if (range?.start && range.end) {
          router.push(`/admin/dashboard?from=${range.start.toString()}&to=${range.end.toString()}`);
        }
      }}
    >
      <Label className="font-nunito text-sm font-semibold">Reporting period</Label>
      <DateField.Group fullWidth className="rounded-xl border border-border bg-card focus-within:ring-2 focus-within:ring-primary/15">
        <DateField.Input slot="start">{(segment) => <DateField.Segment segment={segment} />}</DateField.Input>
        <DateRangePicker.RangeSeparator />
        <DateField.Input slot="end">{(segment) => <DateField.Segment segment={segment} />}</DateField.Input>
        <DateField.Suffix>
          <DateRangePicker.Trigger aria-label="Choose reporting period">
            <DateRangePicker.TriggerIndicator className="text-primary" />
          </DateRangePicker.Trigger>
        </DateField.Suffix>
      </DateField.Group>
      <DateRangePicker.Popover>
        <RangeCalendar aria-label="Reporting period">
          <RangeCalendar.Header>
            <RangeCalendar.YearPickerTrigger>
              <RangeCalendar.YearPickerTriggerHeading />
              <RangeCalendar.YearPickerTriggerIndicator />
            </RangeCalendar.YearPickerTrigger>
            <RangeCalendar.NavButton slot="previous" />
            <RangeCalendar.NavButton slot="next" />
          </RangeCalendar.Header>
          <RangeCalendar.Grid>
            <RangeCalendar.GridHeader>{(day) => <RangeCalendar.HeaderCell>{day}</RangeCalendar.HeaderCell>}</RangeCalendar.GridHeader>
            <RangeCalendar.GridBody>{(date) => <RangeCalendar.Cell date={date} className="data-selected:bg-primary data-selected:text-white" />}</RangeCalendar.GridBody>
          </RangeCalendar.Grid>
          <RangeCalendar.YearPickerGrid>
            <RangeCalendar.YearPickerGridBody>{({ year }) => <RangeCalendar.YearPickerCell year={year} />}</RangeCalendar.YearPickerGridBody>
          </RangeCalendar.YearPickerGrid>
        </RangeCalendar>
      </DateRangePicker.Popover>
    </DateRangePicker>
  );
}
