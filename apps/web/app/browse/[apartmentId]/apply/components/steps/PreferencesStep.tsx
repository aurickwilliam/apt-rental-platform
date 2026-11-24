"use client";

import { useMemo } from "react";
import { parseDate, type CalendarDate } from "@internationalized/date";
import {
  Calendar,
  DateField,
  DatePicker,
  Description,
  FieldError,
  Label,
  NumberField,
  Separator,
  TextArea,
  TextField,
} from "@heroui/react";

import { IconAccessible, IconCar, IconPaw, IconSmoking } from "@tabler/icons-react";
import { formatDate, manilaToday } from "@repo/utils";

import { useTranslation } from "@/app/components/i18n/LocaleProvider";
import FormStepActions from "@/app/components/layout/FormStepActions";
import PreferenceParkingFields from "@/app/components/preferences/PreferenceParkingFields";
import PreferencePetFields from "@/app/components/preferences/PreferencePetFields";
import PreferenceYesNoField from "@/app/components/preferences/PreferenceYesNoField";

import type { ApplicationForm, ApplicationStepProps } from "../../types";

const INPUT_CLASS = "bg-card border-border text-card-foreground placeholder:text-muted-foreground";
const NOTES_MAX_LENGTH = 1000;

type YesNoAnswer = "yes" | "no";

/** The four Yes/No questions; the details of pets and parking follow a "yes". */
const toBoolean = (answer: string | null): boolean | null => (answer === null ? null : answer === "yes");
const toYesNo = (value: boolean): YesNoAnswer => (value ? "yes" : "no");

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
  const { language, t } = useTranslation();
  // The earliest move-in is tomorrow; `validatePreferences` repeats this.
  const earliestMoveIn = useMemo(() => parseDate(manilaToday()).add({ days: 1 }), []);
  const earliestMoveInLabel = formatDate(earliestMoveIn.toString(), "long", language);

  const answer = (
    field: "hasPets" | "isSmoker" | "needParking" | "hasDisability",
    value: boolean,
    errorKey: string,
    details: Partial<ApplicationForm> = {},
  ) => {
    onChange({ [field]: toYesNo(value), ...details });
    clearError(errorKey);
  };

  return (
    <div>
      <div className="flex flex-col gap-5">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
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
            <Label>{t("apply.prefs.moveInDate")}</Label>
            <DateField.Group fullWidth className="border border-border bg-card">
              <DateField.Input>
                {(segment) => (
                  <DateField.Segment
                    segment={segment}
                    className="date-segment-cursor cursor-text text-foreground data-[placeholder=true]:text-muted-foreground"
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
            {!errors.moveInDate && (
              <Description className="text-muted-foreground">
                {t("apply.prefs.earliestMoveIn", { date: earliestMoveInLabel })}
              </Description>
            )}
            <DatePicker.Popover>
              {/* Set here too: HeroUI's Calendar default limits override the DatePicker's. */}
              <Calendar aria-label={t("apply.prefs.moveInDate")} minValue={earliestMoveIn}>
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

          <NumberField
            className="form-number-stepper"
            minValue={1}
            maxValue={maxOccupants ?? undefined}
            value={form.noOccupants ? Number(form.noOccupants) : Number.NaN}
            onChange={(value) => {
              onChange({ noOccupants: Number.isNaN(value) ? "" : String(value) });
              if (!Number.isNaN(value) && value > 0 && (maxOccupants === null || value <= maxOccupants)) {
                clearError("noOccupants");
              }
            }}
            isInvalid={!!errors.noOccupants}
            isRequired
          >
            <Label>{t("apply.prefs.occupants")}</Label>
            <NumberField.Group className="flex items-center border border-border rounded-field overflow-hidden bg-card focus-within:border-primary! focus-within:ring-1 focus-within:ring-primary/20 transition-colors">
              <NumberField.DecrementButton className="px-4 py-3 text-muted-foreground hover:bg-muted active:bg-muted/80 border-r border-border flex items-center justify-center min-w-11 cursor-pointer disabled:cursor-not-allowed" />
              <NumberField.Input
                placeholder="0"
                className="w-full text-center bg-transparent py-3 text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
              <NumberField.IncrementButton className="px-4 py-3 text-muted-foreground hover:bg-muted active:bg-muted/80 border-l border-border flex items-center justify-center min-w-11 cursor-pointer disabled:cursor-not-allowed" />
            </NumberField.Group>
            <FieldError>{errors.noOccupants}</FieldError>
            {maxOccupants !== null && !errors.noOccupants && (
              <Description className="text-muted-foreground">
                {t("apply.prefs.maxOccupants", { count: maxOccupants })}
              </Description>
            )}
          </NumberField>
        </div>

        <Separator />

        {isPrefilled ? (
          <p className="-mb-2 text-xs text-muted-foreground">
            {t("apply.prefs.prefilled")}
          </p>
        ) : null}

        <PreferenceYesNoField
          label={t("apply.prefs.hasPets")}
          icon={<IconPaw size={18} />}
          required
          value={toBoolean(form.hasPets)}
          error={errors.hasPets}
          onChange={(value) => {
            answer("hasPets", value, "hasPets", {
              kindOfPets: value ? form.kindOfPets : [],
              noOfPets: value ? form.noOfPets : 1,
              nameOfPets: value ? form.nameOfPets : null,
            });
            clearError("petDetails");
          }}
        />
        {form.hasPets === "yes" && (
          <PreferencePetFields
            kindOfPets={form.kindOfPets}
            noOfPets={form.noOfPets}
            nameOfPets={form.nameOfPets}
            error={errors.petDetails ?? null}
            idPrefix="application-pet"
            onChange={(patch) => {
              onChange(patch);
              clearError("petDetails");
            }}
          />
        )}

        <PreferenceYesNoField
          label={t("apply.prefs.parking")}
          icon={<IconCar size={18} />}
          required
          value={toBoolean(form.needParking)}
          error={errors.needParking}
          onChange={(value) => {
            answer("needParking", value, "needParking", {
              noOfParkingSpots: value ? form.noOfParkingSpots : 1,
              listOfVehicles: value ? form.listOfVehicles : [],
            });
            clearError("parkingDetails");
          }}
        />
        {form.needParking === "yes" && (
          <>
            <PreferenceParkingFields
              noOfParkingSpots={form.noOfParkingSpots}
              listOfVehicles={form.listOfVehicles}
              onChange={(patch) => {
                onChange(patch);
                clearError("parkingDetails");
              }}
            />
            {errors.parkingDetails ? (
              <p role="alert" className="-mt-3 text-xs text-danger">
                {errors.parkingDetails}
              </p>
            ) : null}
          </>
        )}

        <PreferenceYesNoField
          label={t("apply.prefs.smoker")}
          icon={<IconSmoking size={18} />}
          required
          value={toBoolean(form.isSmoker)}
          error={errors.isSmoker}
          onChange={(value) => answer("isSmoker", value, "isSmoker")}
        />

        <PreferenceYesNoField
          label={t("apply.prefs.disability")}
          icon={<IconAccessible size={18} />}
          required
          value={toBoolean(form.hasDisability)}
          error={errors.hasDisability}
          onChange={(value) => answer("hasDisability", value, "hasDisability")}
        />

        <Separator />

        <TextField value={form.additionalNotes} onChange={(value: string) => onChange({ additionalNotes: value })}>
          <Label>{t("apply.prefs.notes")}</Label>
          <TextArea
            placeholder={t("apply.prefs.notesPlaceholder")}
            rows={5}
            maxLength={NOTES_MAX_LENGTH}
            className={INPUT_CLASS}
          />
          <Description className="text-muted-foreground">
            {t("apply.prefs.notesCount", { count: form.additionalNotes.length, max: NOTES_MAX_LENGTH })}
          </Description>
        </TextField>
      </div>
      <FormStepActions isFirstStep={false} onBack={onBack} onContinue={onNext} />
    </div>
  );
}
