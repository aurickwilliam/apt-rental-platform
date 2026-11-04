import { Text, View } from "react-native";
import { Checkbox, ControlField, FieldError, Label } from "heroui-native";

import DropdownField from "components/inputs/DropdownField";

import { VEHICLE_OPTIONS } from "@repo/constants";

const PARKING_SPOT_COUNT = 5;
const PARKING_SPOT_OPTIONS = Array.from({ length: PARKING_SPOT_COUNT }, (_, i) => `${i + 1}`);

interface ParkingDetailsFieldsProps {
  noOfParkingSpots: number;
  listOfVehicles: string[];
  onSpotsChange: (spots: number) => void;
  onToggleVehicle: (vehicle: string) => void;
  /** Shown under the vehicle list (e.g. none selected). */
  error?: string;
}

/** Follow-ups to "Do you need parking?" answered yes: spot count and vehicle kinds. */
export default function ParkingDetailsFields({
  noOfParkingSpots,
  listOfVehicles,
  onSpotsChange,
  onToggleVehicle,
  error,
}: ParkingDetailsFieldsProps) {
  return (
    <>
      <DropdownField
        label="If yes, how many cars or motorcycles do you have?"
        bottomSheetLabel="Select your Parking"
        placeholder="Select the number of parking you need"
        options={PARKING_SPOT_OPTIONS}
        onSelect={(value) => onSpotsChange(value ? Number(value) : 1)}
        value={String(noOfParkingSpots)}
        required
      />

      {noOfParkingSpots > 0 && (
        <View className="flex gap-3">
          <Text className="text-foreground text-base font-nunitoSemiBold">
            Select the kinds of vehicles you have:
          </Text>

          {VEHICLE_OPTIONS.map((vehicle) => (
            <ControlField
              key={vehicle}
              isSelected={listOfVehicles.includes(vehicle)}
              onSelectedChange={() => onToggleVehicle(vehicle)}
            >
              <ControlField.Indicator>
                <Checkbox className="border border-border shadow-none" />
              </ControlField.Indicator>

              <Label>{vehicle}</Label>
            </ControlField>
          ))}

          {error ? <FieldError isInvalid>{error}</FieldError> : null}
        </View>
      )}
    </>
  );
}
