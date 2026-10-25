"use client";

import { useState, useSyncExternalStore, type Ref } from "react";
import { Calendar, DateField, DatePicker, FieldError, Label } from "@heroui/react";
import { parseDate } from "@internationalized/date";
import { getBirthDateRange, getManilaDate, validateBirthDate } from "@/lib/birth-date";

const DAY_MS = 24 * 60 * 60 * 1000;
const MANILA_OFFSET_MS = 8 * 60 * 60 * 1000; // Asia/Manila has no daylight saving time.

// Keep an open form's bounds fresh at Manila midnight, including suspended tabs.
function subscribeManilaDay(notify: () => void) {
  let timer: ReturnType<typeof setTimeout>;
  const schedule = () => {
    clearTimeout(timer);
    timer = setTimeout(() => { notify(); schedule(); }, DAY_MS - ((Date.now() + MANILA_OFFSET_MS) % DAY_MS));
  };
  const resume = () => { notify(); schedule(); };
  schedule();
  window.addEventListener("focus", resume);
  document.addEventListener("visibilitychange", resume);
  return () => {
    clearTimeout(timer);
    window.removeEventListener("focus", resume);
    document.removeEventListener("visibilitychange", resume);
  };
}

interface RegistrationBirthDateFieldProps {
  name: string;
  value: string;
  onChange: (value: string) => void;
  error?: string | null;
  isDisabled?: boolean;
  inputRef?: Ref<HTMLDivElement>;
}

export default function RegistrationBirthDateField({ name, value, onChange, error, isDisabled, inputRef }: RegistrationBirthDateFieldProps) {
  const today = useSyncExternalStore(subscribeManilaDay, getManilaDate, getManilaDate);
  const { earliest, latest } = getBirthDateRange(today);
  const minValue = parseDate(earliest);
  const maxValue = parseDate(latest);
  const [focused, setFocused] = useState(false);
  const [blurred, setBlurred] = useState(false);
  const [open, setOpen] = useState(false);
  let parsed: ReturnType<typeof parseDate> | null = null;
  try { parsed = value ? parseDate(value) : null; } catch { /* Keep malformed legacy text visible below, never normalize it. */ }
  const fieldError = error ?? (value || (blurred && !focused && !open) ? validateBirthDate(value) : null);

  return (
    <DatePicker name={name} aria-label="Birth Date" className="registration-birth-date" isRequired isDisabled={isDisabled} validationBehavior="aria"
      value={parsed} minValue={minValue} maxValue={maxValue} placeholderValue={maxValue}
      isInvalid={!!fieldError} onChange={date => onChange(date ? String(date) : "")}
      onOpenChange={setOpen} onFocusChange={isFocused => { setFocused(isFocused); if (!isFocused) setBlurred(true); }}>
      <Label>Birth Date</Label>
      <DateField.Group ref={inputRef} fullWidth className="border border-grey-300">
        <DateField.Input>
          {segment => <DateField.Segment segment={segment} className="data-[placeholder=true]:text-foreground/40 text-foreground" />}
        </DateField.Input>
        <DateField.Suffix>
          <DatePicker.Trigger><DatePicker.TriggerIndicator className="text-grey-500" /></DatePicker.Trigger>
        </DateField.Suffix>
      </DateField.Group>
      {value && !parsed ? <span className="text-xs text-muted-foreground">Entered birth date: {value}</span> : null}
      <span aria-live="polite" aria-atomic="true" className={fieldError ? undefined : "sr-only"}>
        <FieldError className="text-xs">{fieldError}</FieldError>
      </span>
      <DatePicker.Popover>
        <Calendar aria-label="Birth Date" minValue={minValue} maxValue={maxValue}
          defaultFocusedValue={parsed && value >= earliest && value <= latest ? parsed : maxValue}>
          <Calendar.Header>
            <Calendar.YearPickerTrigger>
              <Calendar.YearPickerTriggerHeading />
              <Calendar.YearPickerTriggerIndicator className="text-grey-500" />
            </Calendar.YearPickerTrigger>
            <Calendar.NavButton slot="previous" className="text-grey-500" />
            <Calendar.NavButton slot="next" className="text-grey-500" />
          </Calendar.Header>
          <Calendar.Grid>
            <Calendar.GridHeader>{day => <Calendar.HeaderCell>{day}</Calendar.HeaderCell>}</Calendar.GridHeader>
            <Calendar.GridBody>{date => <Calendar.Cell date={date} className="data-selected:bg-primary data-selected:text-white" />}</Calendar.GridBody>
          </Calendar.Grid>
          <Calendar.YearPickerGrid>
            <Calendar.YearPickerGridBody>{yearProps => <Calendar.YearPickerCell year={yearProps.year} className="data-selected:bg-primary data-selected:text-white" />}</Calendar.YearPickerGridBody>
          </Calendar.YearPickerGrid>
        </Calendar>
      </DatePicker.Popover>
    </DatePicker>
  );
}
