
import DropdownField from "components/inputs/DropdownField";

import { VEHICLE_OPTIONS } from "@repo/constants";

const PARKING_SPOT_COUNT = 5;
const PARKING_SPOT_OPTIONS = Array.from({ length: PARKING_SPOT_COUNT }, (_, i) => `${i + 1}`);

interface ParkingDetailsFieldsProps {
  noOfParkingSpots: number;
  listOfVehicles: string[];
  onSpotsChange: (spots: number) => void;
  onVehiclesChange: (vehicles: string[]) => void;
  /** Shown under the vehicle list (e.g. none selected). */
  error?: string;
}

/** Follow-ups to "Do you need parking?" answered yes: spot count and vehicle kinds. */
export default function ParkingDetailsFields({
  noOfParkingSpots,
  listOfVehicles,
  onSpotsChange,
  onVehiclesChange,
  error,
}: ParkingDetailsFieldsProps) {
  return (
    <>
      <DropdownField
        label="If yes, how many cars or motorcycles do you have?"
        bottomSheetLabel="Select your Parking"
        placeholder="Select the number of parking you need"
        options={PARKING_SPOT_OPTIONS}
        onSelect={(value) => {
          const spots = value ? Number(value) : 1
          onSpotsChange(spots)
          // Lowering the count drops the vehicle kinds that no longer fit.
          if (listOfVehicles.length > spots) onVehiclesChange(listOfVehicles.slice(0, spots))
        }}
        value={String(noOfParkingSpots)}
        required
      />

      <DropdownField
        label="Select the kinds of vehicles you have:"
        bottomSheetLabel="Select your Vehicles"
        placeholder="Select the kinds of vehicles you have"
        options={VEHICLE_OPTIONS}
        multiple
        values={listOfVehicles}
        onSelectMultiple={(vehicles) => {
          onVehiclesChange(vehicles)
          // Never fewer spots than kinds: raise the count as kinds are added.
          if (vehicles.length > noOfParkingSpots) onSpotsChange(vehicles.length)
        }}
        error={error}
      />
    </>
  );
}
