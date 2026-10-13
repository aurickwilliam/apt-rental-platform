"use client";

import { parseDate, today } from "@internationalized/date";
import {
  DateField,
  DateRangePicker,
  FieldError,
  RangeCalendar,
} from "@heroui/react";
import type { JoinedPreset } from "@/lib/admin-filters";
import FilterPillGroup from "./FilterPillGroup";
import type { FilterOption } from "./types";

const MANILA_TIME_ZONE = "Asia/Manila";
// Placeholder segments stay readable (muted, not faded) on the white popover.
const SEGMENT_CLASSES =
  "text-card-foreground data-[placeholder=true]:text-muted-foreground";

export const DATE_PRESET_OPTIONS: readonly FilterOption<JoinedPreset>[] = [
  { id: "any", label: "Any time" },
  { id: "7d", label: "Last 7 days" },
  { id: "30d", label: "Last 30 days" },
  { id: "90d", label: "Last 90 days" },
  { id: "custom", label: "Custom range" },
];

export interface IsoDateRange {
  from: string;
  to: string;
}

interface DateRangeFilterProps {
  label: string;
  preset: JoinedPreset;
  onPresetChange: (preset: JoinedPreset) => void;
  range: IsoDateRange | null;
  onRangeChange: (range: IsoDateRange | null) => void;
}

export default function DateRangeFilter({
  label,
  preset,
  onPresetChange,
  range,
  onRangeChange,
}: DateRangeFilterProps) {
  const maxDate = today(MANILA_TIME_ZONE);

  return (
    <div className="space-y-2">
      <FilterPillGroup
        selectionMode="single"
        label={label}
        options={DATE_PRESET_OPTIONS}
        value={preset}
        onChange={onPresetChange}
      />

      {preset === "custom" ? (
        <DateRangePicker
          aria-label={`${label} range`}
          className="flex w-full flex-col gap-1"
          maxValue={maxDate}
          value={
            range
              ? { start: parseDate(range.from), end: parseDate(range.to) }
              : null
          }
          onChange={(value) =>
            onRangeChange(
              value
                ? { from: value.start.toString(), to: value.end.toString() }
                : null,
            )
          }
        >
          <DateField.Group
            fullWidth
            className="rounded-xl border border-border bg-card shadow-none focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15 data-invalid:border-danger"
          >
            <DateField.Input slot="start">
              {(segment) => (
                <DateField.Segment
                  segment={segment}
                  className={SEGMENT_CLASSES}
                />
              )}
            </DateField.Input>
            <DateRangePicker.RangeSeparator className="text-muted-foreground" />
            <DateField.Input slot="end">
              {(segment) => (
                <DateField.Segment
                  segment={segment}
                  className={SEGMENT_CLASSES}
                />
              )}
            </DateField.Input>
            <DateField.Suffix>
              <DateRangePicker.Trigger
                aria-label={`Choose ${label.toLowerCase()} range`}
                className="cursor-pointer"
              >
                <DateRangePicker.TriggerIndicator className="text-primary" />
              </DateRangePicker.Trigger>
            </DateField.Suffix>
          </DateField.Group>
          <FieldError className="text-xs text-danger">
            Pick dates up to today. Nobody can join in the future.
          </FieldError>
          <DateRangePicker.Popover>
            <RangeCalendar aria-label={`${label} range`}>
              <RangeCalendar.Header>
                <RangeCalendar.YearPickerTrigger className="cursor-pointer">
                  <RangeCalendar.YearPickerTriggerHeading />
                  <RangeCalendar.YearPickerTriggerIndicator className="text-muted-foreground" />
                </RangeCalendar.YearPickerTrigger>
                <RangeCalendar.NavButton
                  slot="previous"
                  className="cursor-pointer text-muted-foreground"
                />
                <RangeCalendar.NavButton
                  slot="next"
                  className="cursor-pointer text-muted-foreground"
                />
              </RangeCalendar.Header>
              <RangeCalendar.Grid>
                <RangeCalendar.GridHeader>
                  {(day) => (
                    <RangeCalendar.HeaderCell>{day}</RangeCalendar.HeaderCell>
                  )}
                </RangeCalendar.GridHeader>
                <RangeCalendar.GridBody>
                  {(date) => (
                    <RangeCalendar.Cell
                      date={date}
                      className="cursor-pointer data-selected:bg-primary data-selected:text-white data-disabled:cursor-not-allowed"
                    />
                  )}
                </RangeCalendar.GridBody>
              </RangeCalendar.Grid>
              <RangeCalendar.YearPickerGrid>
                <RangeCalendar.YearPickerGridBody>
                  {({ year }) => (
                    <RangeCalendar.YearPickerCell
                      year={year}
                      className="cursor-pointer data-selected:bg-primary data-selected:text-white"
                    />
                  )}
                </RangeCalendar.YearPickerGridBody>
              </RangeCalendar.YearPickerGrid>
            </RangeCalendar>
          </DateRangePicker.Popover>
        </DateRangePicker>
      ) : null}
    </div>
  );
}
