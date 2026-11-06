"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { Button, toast } from "@heroui/react";
import {
  IconAccessible,
  IconBed,
  IconCar,
  IconPaw,
  IconSmoking,
  IconUser,
  IconUsers,
} from "@tabler/icons-react";
import { CAMANAVA_CITIES } from "@repo/constants";

import {
  BEDROOM_OPTIONS,
  DEFAULT_TENANT_PREFERENCES,
  HOUSEHOLD_OPTIONS,
  parseTenantPreferences,
  validatePets,
  type TenantPreferences,
} from "@/lib/tenant-preferences";
import PreferenceOptionCard from "@/app/components/preferences/PreferenceOptionCard";
import PreferenceParkingFields from "@/app/components/preferences/PreferenceParkingFields";
import PreferencePetFields from "@/app/components/preferences/PreferencePetFields";
import PreferenceYesNoField from "@/app/components/preferences/PreferenceYesNoField";
import BudgetRangeField, {
  type BudgetRangeFieldHandle,
} from "@/app/components/preferences/BudgetRangeField";
import { saveTenantPreferences } from "../actions";
import { notifyPreferencesSaved } from "@/hooks/use-user";

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

type YesNoQuestion = "hasPets" | "hasParking" | "hasSmoker" | "hasDisability";

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
  // The Yes/No preferences default to false; this tracks which the tenant has
  // actually answered so no option is preselected. The last step is optional,
  // so an unanswered question is saved as No.
  const [answered, setAnswered] = useState<Record<YesNoQuestion, boolean>>(() => ({
    hasPets: hadSavedPrefs,
    hasParking: hadSavedPrefs,
    hasSmoker: hadSavedPrefs,
    hasDisability: hadSavedPrefs,
  }));
  const answerYesNo = (question: YesNoQuestion, value: boolean, extra?: Partial<TenantPreferences>) => {
    setAnswered((prev) => ({ ...prev, [question]: true }));
    patch({ [question]: value, ...extra });
  };

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
      notifyPreferencesSaved();
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
              <PreferenceOptionCard
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
              <PreferenceOptionCard
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
              <PreferenceOptionCard
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
            <PreferenceYesNoField
              label="Do you have any pets?"
              icon={<IconPaw size={18} />}
              value={answered.hasPets ? prefs.hasPets : null}
              onChange={(value) =>
                answerYesNo("hasPets", value, {
                  kindOfPets: value ? prefs.kindOfPets : [],
                  noOfPets: value ? prefs.noOfPets : 1,
                  nameOfPets: value ? prefs.nameOfPets : null,
                })
              }
            />
            {prefs.hasPets && (
              <PreferencePetFields
                kindOfPets={prefs.kindOfPets}
                noOfPets={prefs.noOfPets}
                nameOfPets={prefs.nameOfPets}
                onChange={patch}
                error={petsError}
              />
            )}
            <PreferenceYesNoField
              label="Do you need a parking space?"
              icon={<IconCar size={18} />}
              value={answered.hasParking ? prefs.hasParking : null}
              onChange={(value) =>
                answerYesNo("hasParking", value, {
                  noOfParkingSpots: value ? prefs.noOfParkingSpots : 1,
                  listOfVehicles: value ? prefs.listOfVehicles : [],
                })
              }
            />
            {prefs.hasParking && (
              <PreferenceParkingFields
                noOfParkingSpots={prefs.noOfParkingSpots}
                listOfVehicles={prefs.listOfVehicles}
                onChange={patch}
              />
            )}
            <PreferenceYesNoField
              label="Is anyone in your household a smoker?"
              icon={<IconSmoking size={18} />}
              value={answered.hasSmoker ? prefs.hasSmoker : null}
              onChange={(value) => answerYesNo("hasSmoker", value)}
            />
            <PreferenceYesNoField
              label="Do you have any household members with a disability?"
              icon={<IconAccessible size={18} />}
              value={answered.hasDisability ? prefs.hasDisability : null}
              onChange={(value) => answerYesNo("hasDisability", value)}
            />
          </div>
        )}
      </div>

      {/* Pinned to the bottom of the screen so the actions stay in the same place on every step */}
      <div className="sticky bottom-0 mt-auto flex items-center gap-2 bg-card pt-8 pb-[max(2rem,env(safe-area-inset-bottom))]">
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
