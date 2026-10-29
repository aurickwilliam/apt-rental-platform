"use client";

import { useRef, useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";

import { Button, Input, Label, ListBox, NumberField, Select, toast } from "@heroui/react";
import {
  IconAccessible,
  IconBed,
  IconCar,
  IconCheck,
  IconSmoking,
  IconUser,
  IconUsers,
} from "@tabler/icons-react";
import {
  CAMANAVA_CITIES,
  MAX_PET_COUNT,
  OTHER_PET,
  PETS,
  VEHICLE_OPTIONS,
} from "@repo/constants";

import {
  BEDROOM_OPTIONS,
  DEFAULT_TENANT_PREFERENCES,
  HOUSEHOLD_OPTIONS,
  PARKING_SPOT_OPTIONS,
  parseTenantPreferences,
  validatePets,
  type TenantPreferences,
} from "@/lib/tenant-preferences";
import BudgetRangeField, {
  type BudgetRangeFieldHandle,
} from "@/app/components/preferences/BudgetRangeField";
import { saveTenantPreferences } from "../actions";

const STEP_HEADINGS = [
  "Where would you like to live?",
  "What's your monthly rental budget?",
  "How many bedrooms are you looking for?",
  "How many people will live with you?",
  "What are your rental preferences?",
] as const;

const STEP_DESCRIPTIONS = [
  "Select your preferred cities in CAMANAVA. You can choose more than one.",
  "Choose a range that works for you.",
  "Select the number of bedrooms you prefer so we can filter properties that fit your needs.",
  "This helps us understand your household needs.",
  "Fill up the form and select the appropriate response to curate the properties that will fit for you.",
] as const;

// Selectable option card shared by cities, budgets, bedrooms, household, and
// vehicles. Native button semantics keep keyboard interaction free.
function OptionCard({
  selected,
  onPress,
  label,
  icon,
  className = "",
}: {
  selected: boolean;
  onPress: () => void;
  label: string;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <Button
      variant="ghost"
      aria-pressed={selected}
      onClick={onPress}
      className={`button--bare flex min-h-16 items-center gap-3 rounded-xl border p-4 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
        selected
          ? "border-primary bg-primary/10"
          : "border-border bg-card hover:border-primary/40"
      } ${className}`}
    >
      {icon && (
        <span className="shrink-0 text-primary" aria-hidden="true">
          {icon}
        </span>
      )}
      <span className="flex-1 text-sm font-semibold text-foreground">{label}</span>
      <span
        aria-hidden="true"
        className={`flex size-5 shrink-0 items-center justify-center rounded-full border ${
          selected ? "border-primary bg-primary text-white" : "border-border text-transparent"
        }`}
      >
        <IconCheck size={13} />
      </span>
    </Button>
  );
}

// Yes/No segmented control mirroring the mobile radio semantics.
function YesNoField({
  label,
  value,
  onChange,
  icon,
}: {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
        {icon && (
          <span className="shrink-0 text-primary" aria-hidden="true">
            {icon}
          </span>
        )}
        {label}
      </p>
      <div className="flex gap-2" role="group" aria-label={label}>
        {[
          { option: true, text: "Yes" },
          { option: false, text: "No" },
        ].map(({ option, text }) => (
          <Button
            key={text}
            type="button"
            size="sm"
            variant={value === option ? "primary" : "outline"}
            aria-pressed={value === option}
            onPress={() => onChange(option)}
            className="min-h-10 flex-1"
          >
            {text}
          </Button>
        ))}
      </div>
    </div>
  );
}

export default function PersonalizeWizard({ initial }: { initial: unknown }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [prefs, setPrefs] = useState<TenantPreferences>(
    () => parseTenantPreferences(initial) ?? { ...DEFAULT_TENANT_PREFERENCES },
  );
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const budgetRef = useRef<BudgetRangeFieldHandle>(null);
  const [hadSavedPrefs] = useState(() => parseTenantPreferences(initial) !== null);

  const patch = (next: Partial<TenantPreferences>) => {
    setPrefs((prev) => ({ ...prev, ...next }));
    setError(null);
  };

  const toggleCity = (city: string) => {
    patch({
      selectedCities: prefs.selectedCities.includes(city)
        ? prefs.selectedCities.filter((c) => c !== city)
        : [...prefs.selectedCities, city],
    });
  };

  const toggleVehicle = (vehicle: string) => {
    patch({
      listOfVehicles: prefs.listOfVehicles.includes(vehicle)
        ? prefs.listOfVehicles.filter((v) => v !== vehicle)
        : [...prefs.listOfVehicles, vehicle],
    });
  };

  const petsError = validatePets(prefs);
  const canContinue = step !== 5 || petsError === null;

  const finish = async () => {
    if (isSaving) return;
    setIsSaving(true);
    setError(null);
    try {
      const result = await saveTenantPreferences(prefs);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.replace("/tenant/my-rental");
    } catch {
      setError("Couldn't save your preferences. Check your connection and try again.");
      toast.danger("Couldn't save your preferences. Please try again.", { timeout: 0 });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[13px] font-semibold text-foreground">Your preferences</p>
        <p className="text-xs text-muted-foreground" aria-live="polite">
          Step {step} of {STEP_HEADINGS.length}
        </p>
      </div>
      <div
        className="mt-3 flex gap-1.5"
        role="progressbar"
        aria-valuenow={step}
        aria-valuemin={1}
        aria-valuemax={STEP_HEADINGS.length}
        aria-label={`Personalization progress: step ${step} of ${STEP_HEADINGS.length}`}
      >
        {STEP_HEADINGS.map((_, index) => (
          <div
            key={STEP_HEADINGS[index]}
            aria-hidden="true"
            className={`h-1.5 flex-1 rounded-full ${
              index < step ? "bg-primary" : "bg-muted"
            }`}
          />
        ))}
      </div>

      <h2 className="mt-6 font-nunito text-[22px] font-bold text-foreground">
        {STEP_HEADINGS[step - 1]}
      </h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        {STEP_DESCRIPTIONS[step - 1]}
      </p>

      {error && (
        <p role="alert" className="mt-4 rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-foreground">
          {error}
        </p>
      )}

      <div className="mt-5">
        {step === 1 && (
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2" role="group" aria-label="Preferred cities">
            {CAMANAVA_CITIES.map((city) => (
              <OptionCard
                key={city}
                label={city}
                selected={prefs.selectedCities.includes(city)}
                onPress={() => toggleCity(city)}
              />
            ))}
          </div>
        )}

        {step === 2 && (
          <BudgetRangeField
            ref={budgetRef}
            budgetMin={prefs.budgetMin}
            budgetMax={prefs.budgetMax}
            onRangeChange={(budgetMin, budgetMax) => patch({ budgetMin, budgetMax })}
            resolveInitialSelection={hadSavedPrefs}
          />
        )}

        {step === 3 && (
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2" role="group" aria-label="Bedroom options">
            {BEDROOM_OPTIONS.map((option) => (
              <OptionCard
                key={option}
                label={option}
                icon={<IconBed size={19} />}
                selected={prefs.bedroomCount === option}
                onPress={() =>
                  patch({ bedroomCount: prefs.bedroomCount === option ? null : option })
                }
              />
            ))}
          </div>
        )}

        {step === 4 && (
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2" role="group" aria-label="Household options">
            {HOUSEHOLD_OPTIONS.map((option) => (
              <OptionCard
                key={option}
                label={option}
                icon={option === "Single" ? <IconUser size={19} /> : <IconUsers size={19} />}
                selected={prefs.householdSize === option}
                onPress={() =>
                  patch({ householdSize: prefs.householdSize === option ? null : option })
                }
              />
            ))}
          </div>
        )}

        {step === 5 && (
          <div className="flex flex-col gap-5">
            <YesNoField
              label="Do you have any pets?"
              value={prefs.hasPets}
              onChange={(value) =>
                patch({
                  hasPets: value,
                  kindOfPets: value ? prefs.kindOfPets : [],
                  noOfPets: value ? prefs.noOfPets : 1,
                  nameOfPets: value ? prefs.nameOfPets : null,
                })
              }
            />
            {prefs.hasPets && (
              <Select
                selectionMode="multiple"
                placeholder="Select the kinds of pets you have"
                value={prefs.kindOfPets}
                onChange={(keys) => {
                  const picked = keys.map(String);
                  const next = PETS.filter((pet) => picked.includes(pet));
                  patch({
                    kindOfPets: next,
                    nameOfPets: next.includes(OTHER_PET) ? prefs.nameOfPets : null,
                  });
                }}
              >
                <Label>If yes, what kinds of pets do you have?</Label>
                <Select.Trigger>
                  <Select.Value />
                  <Select.Indicator />
                </Select.Trigger>
                <Select.Popover>
                  <ListBox selectionMode="multiple">
                    {PETS.map((pet) => (
                      <ListBox.Item key={pet} id={pet} textValue={pet}>
                        {pet}
                        <ListBox.ItemIndicator />
                      </ListBox.Item>
                    ))}
                  </ListBox>
                </Select.Popover>
              </Select>
            )}
            {prefs.hasPets && (
              <NumberField
                minValue={1}
                maxValue={MAX_PET_COUNT}
                value={prefs.noOfPets}
                onChange={(value) => patch({ noOfPets: value })}
                isInvalid={prefs.kindOfPets.length > 0 && petsError !== null}
              >
                <Label>How many pets do you have?</Label>
                <NumberField.Group className="flex w-full items-center overflow-hidden rounded-xl border border-border bg-card transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
                  <NumberField.Input
                    placeholder="e.g., 2"
                    className="w-full bg-transparent px-3 py-2.5 text-sm text-card-foreground outline-none placeholder:text-muted-foreground"
                  />
                </NumberField.Group>
                {prefs.kindOfPets.length > 0 && petsError && (
                  <p role="alert" className="mt-1 text-xs text-destructive">
                    {petsError}
                  </p>
                )}
              </NumberField>
            )}
            {prefs.hasPets && prefs.kindOfPets.includes(OTHER_PET) && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="pet-name">Please specify the kind of pet you have</Label>
                <Input
                  id="pet-name"
                  placeholder="e.g., Poodle, Siamese"
                  value={prefs.nameOfPets ?? ""}
                  onChange={(e) => patch({ nameOfPets: e.target.value || null })}
                />
              </div>
            )}
            <YesNoField
              label="Do you need a parking space?"
              icon={<IconCar size={18} />}
              value={prefs.hasParking}
              onChange={(value) =>
                patch({
                  hasParking: value,
                  noOfParkingSpots: value ? prefs.noOfParkingSpots : 1,
                  listOfVehicles: value ? prefs.listOfVehicles : [],
                })
              }
            />
            {prefs.hasParking && (
              <Select
                placeholder="Select the number of parking you need"
                value={String(prefs.noOfParkingSpots)}
                onChange={(key) =>
                  patch({ noOfParkingSpots: key ? Number(key) : 1 })
                }
              >
                <Label>If yes, how many cars or motorcycles do you have?</Label>
                <Select.Trigger>
                  <Select.Value />
                  <Select.Indicator />
                </Select.Trigger>
                <Select.Popover>
                  <ListBox>
                    {PARKING_SPOT_OPTIONS.map((count) => (
                      <ListBox.Item key={count} id={count} textValue={count}>
                        {count}
                      </ListBox.Item>
                    ))}
                  </ListBox>
                </Select.Popover>
              </Select>
            )}
            {prefs.hasParking && (
              <div className="flex flex-col gap-2">
                <p className="text-sm font-semibold text-foreground">
                  Select the kinds of vehicles you have:
                </p>
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2" role="group" aria-label="Vehicle types">
                  {VEHICLE_OPTIONS.map((vehicle) => (
                    <OptionCard
                      key={vehicle}
                      label={vehicle}
                      selected={prefs.listOfVehicles.includes(vehicle)}
                      onPress={() => toggleVehicle(vehicle)}
                    />
                  ))}
                </div>
              </div>
            )}
            <YesNoField
              label="Is anyone in your household a smoker?"
              icon={<IconSmoking size={18} />}
              value={prefs.hasSmoker}
              onChange={(value) => patch({ hasSmoker: value })}
            />
            <YesNoField
              label="Do you have any household members with a disability?"
              icon={<IconAccessible size={18} />}
              value={prefs.hasDisability}
              onChange={(value) => patch({ hasDisability: value })}
            />
          </div>
        )}
      </div>

      {/* Pinned to the bottom of the screen so the actions stay in the same place on every step */}
      <div className="sticky bottom-0 mt-auto flex items-center gap-2 bg-card py-4">
        {step > 1 ? (
          <Button
            type="button"
            variant="outline"
            onPress={() => setStep((prev) => prev - 1)}
            isDisabled={isSaving}
            className="min-h-11 flex-1"
          >
            Back
          </Button>
        ) : (
          <Button
            type="button"
            variant="secondary"
            onPress={() => router.replace("/tenant/my-rental")}
            isDisabled={isSaving}
            className="min-h-11 flex-1"
          >
            Skip for now
          </Button>
        )}
        {step < 5 ? (
          <Button
            type="button"
            variant="primary"
            onPress={() => {
              if (step === 2 && !(budgetRef.current?.commit() ?? true)) return;
              setStep((prev) => prev + 1);
            }}
            isDisabled={isSaving || !canContinue}
            className="min-h-11 flex-1"
          >
            Continue
          </Button>
        ) : (
          <Button
            type="button"
            variant="primary"
            onPress={() => void finish()}
            isDisabled={isSaving || !canContinue}
            isPending={isSaving}
            className="min-h-11 flex-1"
          >
            Let&apos;s find your place!
          </Button>
        )}
      </div>
    </div>
  );
}
