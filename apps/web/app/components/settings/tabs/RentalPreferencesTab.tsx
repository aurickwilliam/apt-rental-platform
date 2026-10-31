"use client";

import { useRef } from "react";
import {
  Button,
  Checkbox,
  CheckboxGroup,
  Input,
  Label,
} from "@heroui/react";
import {
  IconAccessible,
  IconBed,
  IconCoin,
  IconMapPin,
  IconPaw,
  IconSmoking,
  IconUser,
} from "@tabler/icons-react";
import {
  CAMANAVA_CITIES,
  OTHER_PET,
  PETS,
  VEHICLE_OPTIONS,
} from "@repo/constants";
import { PET_KEYS, enumLabel } from "@repo/i18n";

import { useTranslation } from "@/app/components/i18n/LocaleProvider";
import type { RentalPreferencesForm } from "@/hooks/use-rental-preferences-form";
import {
  BEDROOM_OPTIONS,
  HOUSEHOLD_OPTIONS,
  PARKING_SPOT_OPTIONS,
  PET_COUNT_OPTIONS,
  optionToPetCount,
  petCountToOption,
  validatePets,
} from "@/lib/tenant-preferences";
import BudgetRangeField, {
  type BudgetRangeFieldHandle,
} from "@/app/components/preferences/BudgetRangeField";
import SettingsMultiSelect from "../SettingsMultiSelect";
import SettingsSelect from "../SettingsSelect";
import ToggleSwitch from "../ToggleSwitch";

function SectionHeading({
  icon,
  title,
}: {
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
      <span className="shrink-0 text-primary" aria-hidden="true">
        {icon}
      </span>
      {title}
    </p>
  );
}

function ControlRow({
  label,
  control,
}: {
  label: React.ReactNode;
  control: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0 text-sm text-foreground">{label}</div>
      <div className="shrink-0">{control}</div>
    </div>
  );
}

export default function RentalPreferencesTab({
  form,
}: {
  form: RentalPreferencesForm;
}) {
  const budgetRef = useRef<BudgetRangeFieldHandle>(null);
  const { language, t } = useTranslation();
  const noPreference = t("settings.rental.noPreference");
  const petsError = validatePets(form);

  const handleSave = async () => {
    // Flush any in-progress custom-range typing first; an invalid entry
    // blocks the save with its own inline error.
    if (!(budgetRef.current?.commit() ?? true)) return;
    await form.save();
  };

  return (
    // Single scroll context: the modal section itself scrolls, so the
    // scrollbar docks at the panel's right edge instead of squeezing this
    // form. The footer sticks to the bottom of that viewport with a solid
    // panel background. Other tabs render normally in the same section.
    <div className="flex min-h-full flex-col">
      {/* Bottom clearance lets the last rows scroll fully above the
        floating save button instead of passing beneath it. */}
      <div className="pb-28">
        <h2 className="font-nunito text-lg font-bold text-primary">
          {t("settings.rental.title")}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("settings.rental.description")}
        </p>

        {/* Location */}
        <section aria-label={t("settings.rental.location")} className="mt-5">
          <SectionHeading
            icon={<IconMapPin size={18} />}
            title={t("settings.rental.location")}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            {form.selectedCities.length === 0
              ? t("settings.rental.location.anywhere")
              : t("settings.rental.location.selected")}
          </p>
          <CheckboxGroup
            name="preferred-cities"
            value={form.selectedCities}
            onChange={(values) => form.setCities(values as string[])}
            className="rental-prefs-checks mt-2"
          >
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {CAMANAVA_CITIES.map((city) => (
                <Checkbox key={city} value={city}>
                  <Checkbox.Content>
                    <Checkbox.Control>
                      <Checkbox.Indicator />
                    </Checkbox.Control>
                    {city}
                  </Checkbox.Content>
                </Checkbox>
              ))}
            </div>
          </CheckboxGroup>
        </section>

        {/* Budget */}
        <section
          aria-label={t("settings.rental.budget")}
          className="mt-10 border-t border-border pt-8"
        >
          <SectionHeading
            icon={<IconCoin size={18} />}
            title={t("settings.rental.budget")}
          />
          <div className="mt-2">
            <BudgetRangeField
              ref={budgetRef}
              layout="compact"
              budgetMin={form.budgetMin}
              budgetMax={form.budgetMax}
              onRangeChange={(min, max) => form.setBudgetRange(min, max)}
              resolveInitialSelection
              idPrefix="settings-budget"
            />
          </div>
        </section>

        {/* Home */}
        <section
          aria-label={t("settings.rental.home")}
          className="mt-10 border-t border-border pt-8"
        >
          <SectionHeading
            icon={<IconBed size={18} />}
            title={t("settings.rental.home")}
          />
          <div className="mt-3 flex flex-col gap-3">
            <ControlRow
              label={
                <Label className="text-sm text-foreground">
                  {t("settings.rental.bedrooms")}
                </Label>
              }
              control={
                <SettingsSelect
                  label={t("settings.rental.bedrooms")}
                  value={form.bedroomCount ?? ""}
                  options={[
                    { value: "", label: noPreference },
                    ...BEDROOM_OPTIONS.map((option) => ({ value: option, label: option })),
                  ]}
                  onChange={(value) => form.setBedroomCount(value === "" ? null : value)}
                  className="w-44"
                />
              }
            />
            <ControlRow
              label={
                <Label className="text-sm text-foreground">
                  {t("settings.rental.household")}
                </Label>
              }
              control={
                <SettingsSelect
                  label={t("settings.rental.householdSize")}
                  value={form.householdSize ?? ""}
                  options={[
                    { value: "", label: noPreference },
                    ...HOUSEHOLD_OPTIONS.map((option) => ({ value: option, label: option })),
                  ]}
                  onChange={(value) => form.setHouseholdSize(value === "" ? null : value)}
                  className="w-44"
                />
              }
            />
            <ControlRow
              label={t("settings.rental.parking")}
              control={
                <ToggleSwitch
                  isSelected={form.hasParking}
                  onValueChange={form.setHasParking}
                  aria-label={t("settings.rental.parking.aria")}
                />
              }
            />
            {form.hasParking && (
              <div className="flex flex-col gap-3 rounded-xl bg-muted/40 p-3">
                <ControlRow
                  label={
                    <Label className="text-sm text-foreground">
                      {t("settings.rental.spots")}
                    </Label>
                  }
                  control={
                    <SettingsSelect
                      label={t("settings.rental.spots.aria")}
                      value={String(form.noOfParkingSpots)}
                      options={PARKING_SPOT_OPTIONS.map((count) => ({ value: count, label: count }))}
                      onChange={(value) => form.setNoOfParkingSpots(Number(value))}
                      className="w-32"
                    />
                  }
                />
                <div>
                  <p className="mb-2 text-sm text-foreground">
                    {t("settings.rental.vehicles")}
                  </p>
                  <CheckboxGroup
                    name="vehicle-types"
                    value={form.listOfVehicles}
                    onChange={(values) => form.setVehicles(values as string[])}
                    className="rental-prefs-checks"
                  >
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {VEHICLE_OPTIONS.map((vehicle) => (
                        <Checkbox key={vehicle} value={vehicle}>
                          <Checkbox.Content>
                            <Checkbox.Control>
                              <Checkbox.Indicator />
                            </Checkbox.Control>
                            {vehicle}
                          </Checkbox.Content>
                        </Checkbox>
                      ))}
                    </div>
                  </CheckboxGroup>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Lifestyle */}
        <section
          aria-label={t("settings.rental.lifestyle")}
          className="mt-10 border-t border-border pt-8"
        >
          <SectionHeading
            icon={<IconUser size={18} />}
            title={t("settings.rental.lifestyle")}
          />
          <div className="mt-3 flex flex-col gap-3">
            <ControlRow
              label={
                <span className="flex items-center gap-2">
                  <IconPaw size={16} className="shrink-0 text-primary" aria-hidden="true" />
                  {t("settings.rental.pets")}
                </span>
              }
              control={
                <ToggleSwitch
                  isSelected={form.hasPets}
                  onValueChange={form.setHasPets}
                  aria-label={t("settings.rental.pets.aria")}
                />
              }
            />
            {form.hasPets && (
              <div className="flex flex-col gap-3 rounded-xl bg-muted/40 p-3">
                <ControlRow
                  label={
                    <Label className="text-sm text-foreground">
                      {t("settings.rental.petCount")}
                    </Label>
                  }
                  control={
                    <SettingsSelect
                      label={t("settings.rental.petCount")}
                      value={petCountToOption(form.noOfPets)}
                      options={PET_COUNT_OPTIONS.map((count) => ({ value: count, label: count }))}
                      onChange={(value) => form.setNoOfPets(optionToPetCount(value))}
                      isInvalid={form.kindOfPets.length > 0 && petsError !== null}
                      className="w-32"
                    />
                  }
                />
                <ControlRow
                  label={
                    <Label className="text-sm text-foreground">
                      {t("settings.rental.petTypes")}
                    </Label>
                  }
                  control={
                    <SettingsMultiSelect
                      label={t("settings.rental.petKinds.aria")}
                      value={form.kindOfPets}
                      options={PETS.map((pet) => ({
                        value: pet,
                        label: enumLabel(language, PET_KEYS, pet),
                      }))}
                      onChange={form.setKindOfPets}
                      placeholder={t("common.select")}
                      className="w-44"
                    />
                  }
                />
                {form.kindOfPets.includes(OTHER_PET) && (
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="settings-pet-name">
                      {t("settings.rental.petOther")}
                    </Label>
                    <Input
                      id="settings-pet-name"
                      placeholder={t("settings.rental.petOther.placeholder")}
                      value={form.nameOfPets ?? ""}
                      onChange={(e) => form.setNameOfPets(e.target.value || null)}
                    />
                  </div>
                )}
              </div>
            )}
            <ControlRow
              label={
                <span>
                  <span className="flex items-center gap-2">
                    <IconSmoking size={16} className="shrink-0 text-primary" aria-hidden="true" />
                    {t("settings.rental.smoking")}
                  </span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {t("settings.rental.smoking.note")}
                  </span>
                </span>
              }
              control={
                <ToggleSwitch
                  isSelected={form.hasSmoker}
                  onValueChange={form.setHasSmoker}
                  aria-label={t("settings.rental.smoking.aria")}
                />
              }
            />
            <ControlRow
              label={
                <span>
                  <span className="flex items-center gap-2">
                    <IconAccessible size={16} className="shrink-0 text-primary" aria-hidden="true" />
                    {t("settings.rental.accessibility")}
                  </span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {t("settings.rental.accessibility.note")}
                  </span>
                </span>
              }
              control={
                <ToggleSwitch
                  isSelected={form.hasDisability}
                  onValueChange={form.setHasDisability}
                  aria-label={t("settings.rental.accessibility.aria")}
                />
              }
            />
          </div>
        </section>

        {/* Closing divider lives in the content flow: it scrolls away
          instead of sticking to the button. */}
        <div aria-hidden="true" className="mt-10 border-t border-border" />
      </div>

      {/* Save bar: sticks to the bottom of the section viewport. The z-20
        is structural, not arbitrary: HeroUI checkbox indicators paint at
        z-10 (to sit above their own fill layer), so the footer must stack
        above z-10 or selected checkmarks render over the button. Opaque
        panel background keeps scrolled content from showing through; the
        pb-28 clearance above lets the last rows scroll fully into view. */}
      <div className="sticky bottom-0 z-20 pt-3">
        {form.saveError && (
          <p role="alert" className="mb-2 rounded-xl border border-danger/40 bg-danger/10 px-4 py-2.5 text-sm text-foreground">
            {form.saveError}
          </p>
        )}
        <Button
          type="button"
          variant="primary"
          onPress={() => void handleSave()}
          isDisabled={!form.isDirty || form.isSaving}
          isPending={form.isSaving}
          className="min-h-11 w-full disabled:opacity-50"
        >
          {form.isSaving ? t("settings.rental.saving") : t("settings.rental.save")}
        </Button>
      </div>
    </div>
  );
}
