"use client";

import { Input, Label, ListBox, Select } from "@heroui/react";
import { OTHER_PET, PETS } from "@repo/constants";
import { trimPetKinds } from "@repo/utils";

import { useTranslation } from "@/app/components/i18n/LocaleProvider";

import {
  PET_COUNT_OPTIONS,
  minimumPetCount,
  optionToPetCount,
  petCountToOption,
} from "@/lib/tenant-preferences";

export interface PetDetails {
  kindOfPets: string[];
  noOfPets: number;
  nameOfPets: string | null;
}

interface PreferencePetFieldsProps extends PetDetails {
  onChange: (patch: Partial<PetDetails>) => void;
  /** Validation message (from `validatePets`); shown once a kind is chosen. */
  error: string | null;
  /** Keeps the "other" input id unique when more than one form is mounted. */
  idPrefix?: string;
}

/** Follow-up fields for "Do you have pets?" answered yes: count, kinds, other. */
export default function PreferencePetFields({
  kindOfPets,
  noOfPets,
  nameOfPets,
  onChange,
  error,
  idPrefix = "pet",
}: PreferencePetFieldsProps) {
  const { t } = useTranslation();
  return (
    <>
      <div className="flex flex-col gap-1.5">
        <Select
          placeholder={t("apply.prefs.petCountPlaceholder")}
          value={petCountToOption(noOfPets)}
          onChange={(key) => {
            const count = key ? optionToPetCount(String(key)) : 1;
            // Lowering the count drops the kinds that no longer fit ("4+" keeps them all).
            const kept = trimPetKinds(kindOfPets, count);
            onChange({
              noOfPets: count,
              kindOfPets: kept,
              nameOfPets: kept.includes(OTHER_PET) ? nameOfPets : null,
            });
          }}
          isInvalid={kindOfPets.length > 0 && error !== null}
        >
          <Label>{t("apply.prefs.petCountQuestion")} <span className="text-danger" aria-hidden="true">*</span></Label>
          <Select.Trigger>
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox className="settings-select-list">
              {PET_COUNT_OPTIONS.map((count) => (
                <ListBox.Item key={count} id={count} textValue={count}>
                  {count}
                  <ListBox.ItemIndicator />
                </ListBox.Item>
              ))}
            </ListBox>
          </Select.Popover>
        </Select>
        {kindOfPets.length > 0 && error && (
          <p role="alert" className="text-xs text-destructive">
            {error}
          </p>
        )}
      </div>
      <Select
        selectionMode="multiple"
        placeholder={t("apply.prefs.petKindsPlaceholder")}
        value={kindOfPets}
        onChange={(keys) => {
          const picked = keys.map(String);
          const next = PETS.filter((pet) => picked.includes(pet));
          onChange({
            kindOfPets: next,
            // Never fewer pets than kinds: raise the count as kinds are added.
            noOfPets: Math.max(noOfPets || 0, minimumPetCount(next.length)),
            nameOfPets: next.includes(OTHER_PET) ? nameOfPets : null,
          });
        }}
      >
        <Label>{t("apply.prefs.petKindsQuestion")} <span className="text-danger" aria-hidden="true">*</span></Label>
        <Select.Trigger>
          <Select.Value />
          <Select.Indicator />
        </Select.Trigger>
        <Select.Popover>
          <ListBox className="settings-select-list" selectionMode="multiple">
            {PETS.map((pet) => (
              <ListBox.Item key={pet} id={pet} textValue={pet}>
                {pet}
                <ListBox.ItemIndicator />
              </ListBox.Item>
            ))}
          </ListBox>
        </Select.Popover>
      </Select>
      {kindOfPets.includes(OTHER_PET) && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${idPrefix}-name`}>{t("apply.prefs.petSpecify")}</Label>
          <Input
            id={`${idPrefix}-name`}
            placeholder={t("apply.prefs.petTypePlaceholder")}
            value={nameOfPets ?? ""}
            onChange={(e) => onChange({ nameOfPets: e.target.value || null })}
          />
        </div>
      )}
    </>
  );
}
