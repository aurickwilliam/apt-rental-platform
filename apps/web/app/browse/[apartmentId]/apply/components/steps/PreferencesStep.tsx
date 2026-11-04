"use client";

import { useMemo } from "react";
import { parseDate, type CalendarDate } from "@internationalized/date";
import {
  Calendar,
  DateField,
  DatePicker,
  Description,
  FieldError,
  Input,
  Label,
  Separator,
  TextArea,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
} from "@heroui/react";

import { manilaToday } from "@repo/utils";

import FormStepActions from "@/app/components/layout/FormStepActions";

import type { ApplicationForm, ApplicationStepProps } from "../../types";

const INPUT_CLASS = "bg-card border-border text-card-foreground placeholder:text-muted-foreground";
const NOTES_MAX_LENGTH = 1000;

type YesNoField = "hasPets" | "isSmoker" | "needParking";

const YES_NO_QUESTIONS: { field: YesNoField; title: string }[] = [
  { field: "hasPets", title: "Do you have pets?" },
  { field: "isSmoker", title: "Are you a smoker?" },
  { field: "needParking", title: "Do you need parking?" },
];

function toCalendarDate(value: string): CalendarDate | null {
  try {
    return parseDate(value);
  } catch {
    return null;
  }
}

interface PreferencesStepProps extends ApplicationStepProps {
  maxOccupants: number | null;
  /** The yes/no answers started from the tenant's saved rental preferences. */
  isPrefilled?: boolean;
  onBack: () => void;
  onNext: () => void;
}

export default function PreferencesStep({
  form,
  errors,
  onChange,
  clearError,
  maxOccupants,
  isPrefilled = false,
  onBack,
  onNext,
}: PreferencesStepProps) {
  // The earliest move-in is tomorrow; `validatePreferences` repeats this.
  const earliestMoveIn = useMemo(() => parseDate(manilaToday()).add({ days: 1 }), []);

  return (
    <div>
      <div className="flex flex-col gap-5">
        <DatePicker
          className="flex w-full flex-col gap-1"
          value={toCalendarDate(form.moveInDate)}
          onChange={(value) => {
            onChange({ moveInDate: value ? value.toString() : "" });
            if (value) clearError("moveInDate");
          }}
          minValue={earliestMoveIn}
          isInvalid={!!errors.moveInDate}
          isRequired
        >
          <Label>Preferred Move-In Date</Label>
          <DateField.Group fullWidth className="border border-border bg-card">
            <DateField.Input>
              {(segment) => (
                <DateField.Segment
                  segment={segment}
                  className="text-foreground data-[placeholder=true]:text-muted-foreground"
                />
              )}
            </DateField.Input>
            <DateField.Suffix>
              <DatePicker.Trigger className="cursor-pointer">
                <DatePicker.TriggerIndicator className="text-muted-foreground" />
              </DatePicker.Trigger>
            </DateField.Suffix>
          </DateField.Group>
          <FieldError>{errors.moveInDate}</FieldError>
          {maxOccupants !== null && !errors.moveInDate && (
            <Description className="text-muted-foreground">
              This unit allows a maximum of {maxOccupants} occupant(s).
            </Description>
          )}
          <DatePicker.Popover>
            {/* Set here too: HeroUI's Calendar default limits override the DatePicker's. */}
            <Calendar aria-label="Preferred move-in date" minValue={earliestMoveIn}>
              <Calendar.Header>
                <Calendar.YearPickerTrigger className="cursor-pointer">
                  <Calendar.YearPickerTriggerHeading />
                  <Calendar.YearPickerTriggerIndicator className="text-muted-foreground" />
                </Calendar.YearPickerTrigger>
                <Calendar.NavButton slot="previous" className="cursor-pointer text-muted-foreground" />
                <Calendar.NavButton slot="next" className="cursor-pointer text-muted-foreground" />
              </Calendar.Header>
              <Calendar.Grid>
                <Calendar.GridHeader>
                  {(day) => <Calendar.HeaderCell className="text-muted-foreground">{day}</Calendar.HeaderCell>}
                </Calendar.GridHeader>
                <Calendar.GridBody>
                  {(day) => (
                    <Calendar.Cell
                      date={day}
                      className="cursor-pointer data-selected:bg-primary data-selected:text-white data-disabled:cursor-not-allowed"
                    />
                  )}
                </Calendar.GridBody>
              </Calendar.Grid>
              <Calendar.YearPickerGrid>
                <Calendar.YearPickerGridBody>
                  {(yearProps) => (
                    <Calendar.YearPickerCell
                      year={yearProps.year}
                      className="cursor-pointer data-selected:bg-primary data-selected:text-white"
                    />
                  )}
                </Calendar.YearPickerGridBody>
              </Calendar.YearPickerGrid>
            </Calendar>
          </DatePicker.Popover>
        </DatePicker>

        <TextField
          isRequired
          isInvalid={!!errors.noOccupants}
          value={form.noOccupants}
          onChange={(value: string) => {
            const digits = value.replace(/\D/g, "");
            onChange({ noOccupants: digits });
            const count = parseInt(digits, 10);
            if (!Number.isNaN(count) && count > 0 && (maxOccupants === null || count <= maxOccupants)) {
              clearError("noOccupants");
            }
          }}
        >
          <Label>Number of Occupants</Label>
          <Input type="number" placeholder="Enter number of occupants" inputMode="numeric" className={INPUT_CLASS} />
          <FieldError>{errors.noOccupants}</FieldError>
        </TextField>

        <Separator />

        {isPrefilled ? (
          <p className="-mb-2 text-xs text-muted-foreground">
            Filled in from your saved rental preferences. Change any answer for this application.
          </p>
        ) : null}

        {YES_NO_QUESTIONS.map(({ field, title }) => {
          const value = form[field];
          return (
            <div key={field}>
              <Label className="mb-2 block text-sm font-medium text-card-foreground">
                {title} <span className="text-danger">*</span>
              </Label>
              <ToggleButtonGroup
                selectionMode="single"
                selectedKeys={value ? [value] : []}
                onSelectionChange={(keys) => {
                  const first = Array.from(keys as Set<string>)[0] as string | undefined;
                  if (!first) return;
                  onChange({ [field]: first } as Partial<ApplicationForm>);
                  clearError(field);
                }}
                className="flex gap-2"
              >
                {["Yes", "No"].map((option) => (
                  <ToggleButton
                    key={option}
                    id={option.toLowerCase()}
                    className="rounded-full border px-5 py-2 text-sm font-medium data-[selected=true]:border-primary data-[selected=true]:bg-primary data-[selected=true]:text-white"
                  >
                    {option}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
              {errors[field] && <p className="mt-1 text-xs text-danger">{errors[field]}</p>}
            </div>
          );
        })}

        <Separator />

        <TextField value={form.additionalNotes} onChange={(value: string) => onChange({ additionalNotes: value })}>
          <Label>Additional Notes</Label>
          <TextArea
            placeholder="Enter any additional information or preferences"
            rows={5}
            maxLength={NOTES_MAX_LENGTH}
            className={INPUT_CLASS}
          />
          <Description className="text-muted-foreground">
            {form.additionalNotes.length}/{NOTES_MAX_LENGTH} characters
          </Description>
        </TextField>
      </div>
      <FormStepActions isFirstStep={false} onBack={onBack} onContinue={onNext} />
    </div>
  );
}
