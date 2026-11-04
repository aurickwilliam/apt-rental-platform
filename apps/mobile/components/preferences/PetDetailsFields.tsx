import { Description, Input, Label, TextField } from "heroui-native";

import DropdownField from "components/inputs/DropdownField";

import {
  OTHER_PET,
  PET_COUNT_OPTIONS,
  PETS,
  optionToPetCount,
  petCountToOption,
} from "@repo/constants";

interface PetDetailsFieldsProps {
  kindOfPets: string[];
  noOfPets: number;
  nameOfPets: string | null;
  onCountChange: (count: number) => void;
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
  return (
    <>
      <DropdownField
        label="How many pets do you have?"
        bottomSheetLabel="Select your Pets"
        placeholder="Select the number of pets you have"
        options={PET_COUNT_OPTIONS}
        onSelect={(value) => {
          const count = value ? optionToPetCount(value) : 1
          onCountChange(count)
          // Lowering the count drops the kinds that no longer fit ("4+" keeps them all).
          if (kindOfPets.length > count) onKindsChange(kindOfPets.slice(0, count))
        }}
        value={petCountToOption(noOfPets)}
        error={kindOfPets.length > 0 ? error ?? undefined : undefined}
        required
      />

      <DropdownField
        label="If yes, what kinds of pets do you have?"
        bottomSheetLabel="Select your Pets"
        placeholder="Select the kinds of pets you have"
        options={PETS}
        multiple
        values={kindOfPets}
        onSelectMultiple={onKindsChange}
        error={kindOfPets.length === 0 ? error ?? undefined : undefined}
        required
      />

      {kindOfPets.includes(OTHER_PET) && (
        <TextField isRequired>
          <Label>Please specify the kind of pet you have</Label>
          <Input
            placeholder="Type the kind of pet you have"
            value={nameOfPets || ""}
            onChangeText={(value) => onNameChange(value || null)}
          />
          <Description>e.g., Poodle, Siamese</Description>
        </TextField>
      )}
    </>
  );
}
