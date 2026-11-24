import { Description, Input, Label, TextField } from "heroui-native";

import { useTranslation } from "@/hooks/i18n";

import DropdownField from "components/inputs/DropdownField";

import {
  OTHER_PET,
  PET_COUNT_OPTIONS,
  PETS,
  optionToPetCount,
  petCountToOption,
} from "@repo/constants";
import { trimPetKinds } from "@repo/utils";

interface PetDetailsFieldsProps {
  kindOfPets: string[];
  noOfPets: number;
  nameOfPets: string | null;
  /** The new count together with the kinds that still fit it, so both change at once. */
  onCountChange: (count: number, kinds: string[]) => void;
  onKindsChange: (kinds: string[]) => void;
  onNameChange: (name: string | null) => void;
  /** Pet rule message (`getPetsError`); shown once a kind is chosen. */
  error?: string | null;
}

/** Follow-ups to "Do you have pets?" answered yes: count, kinds and the "Other" kind. */
export default function PetDetailsFields({
  kindOfPets,
  noOfPets,
  nameOfPets,
  onCountChange,
  onKindsChange,
  onNameChange,
  error,
}: PetDetailsFieldsProps) {
  const { t } = useTranslation();
  return (
    <>
      <DropdownField
        label={t("authMobile.personalization.petCountQuestion")}
        bottomSheetLabel={t("authMobile.personalization.petCountSheet")}
        placeholder={t("authMobile.personalization.petCountPlaceholder")}
        options={PET_COUNT_OPTIONS}
        onSelect={(value) => {
          const count = value ? optionToPetCount(value) : 1
          // Lowering the count drops the kinds that no longer fit ("4+" keeps them all).
          onCountChange(count, trimPetKinds(kindOfPets, count))
        }}
        value={petCountToOption(noOfPets)}
        error={kindOfPets.length > 0 ? error ?? undefined : undefined}
        required
      />

      <DropdownField
        label={t("authMobile.personalization.petsQuestion")}
        bottomSheetLabel={t("authMobile.personalization.petSheet")}
        placeholder={t("authMobile.personalization.petPlaceholder")}
        options={PETS}
        multiple
        values={kindOfPets}
        onSelectMultiple={onKindsChange}
        error={kindOfPets.length === 0 ? error ?? undefined : undefined}
        required
      />

      {kindOfPets.includes(OTHER_PET) && (
        <TextField isRequired>
          <Label>{t("authMobile.personalization.petSpecify")}</Label>
          <Input
            placeholder={t("authMobile.personalization.petType")}
            value={nameOfPets || ""}
            onChangeText={(value) => onNameChange(value || null)}
          />
          <Description>{t("settings.rental.petOther.placeholder")}</Description>
        </TextField>
      )}
    </>
  );
}
