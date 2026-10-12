"use client";

import {
  Button,
  Card,
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

import type { ApplicationForm, ApplicationStepProps } from "../../types";

const INPUT_CLASS = "bg-card border-border text-card-foreground placeholder:text-muted-foreground";
const NOTES_MAX_LENGTH = 1000;

type YesNoField = "hasPets" | "isSmoker" | "needParking";

const YES_NO_QUESTIONS: { field: YesNoField; title: string }[] = [
  { field: "hasPets", title: "Do you have pets?" },
  { field: "isSmoker", title: "Are you a smoker?" },
  { field: "needParking", title: "Do you need parking?" },
];

interface PreferencesStepProps extends ApplicationStepProps {
  maxOccupants: number | null;
  onBack: () => void;
  onNext: () => void;
}

export default function PreferencesStep({
  form,
  errors,
  onChange,
  clearError,
  maxOccupants,
  onBack,
  onNext,
}: PreferencesStepProps) {
  return (
    <Card className="border border-border bg-card p-5 text-card-foreground shadow-none md:p-8">
      <h2 className="mb-5 text-lg font-semibold text-card-foreground">Rental Preferences</h2>
      <div className="flex flex-col gap-5">
        <TextField
          isRequired
          isInvalid={!!errors.moveInDate}
          value={form.moveInDate}
          onChange={(value: string) => {
            onChange({ moveInDate: value });
            if (value) clearError("moveInDate");
          }}
        >
          <Label>Preferred Move-In Date</Label>
          <Input type="date" className={INPUT_CLASS} />
          <FieldError>{errors.moveInDate}</FieldError>
          {maxOccupants !== null && !errors.moveInDate && (
            <Description>This unit allows a maximum of {maxOccupants} occupant(s).</Description>
          )}
        </TextField>

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
          <Description>
            {form.additionalNotes.length}/{NOTES_MAX_LENGTH} characters
          </Description>
        </TextField>
      </div>
      <div className="mt-8 flex gap-3">
        <Button variant="outline" className="flex-1" onPress={onBack}>
          Back
        </Button>
        <Button className="flex-1" onPress={onNext}>
          Next
        </Button>
      </div>
    </Card>
  );
}
