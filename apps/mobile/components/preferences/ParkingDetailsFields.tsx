import { useTranslation } from "@/hooks/i18n";

import DropdownField from "components/inputs/DropdownField";

import { VEHICLE_OPTIONS } from "@repo/constants";
import { sortVehicles, spotsForVehicles, trimVehicles } from "@repo/utils";

const PARKING_SPOT_COUNT = 5;
const PARKING_SPOT_OPTIONS = Array.from({ length: PARKING_SPOT_COUNT }, (_, i) => `${i + 1}`);

interface ParkingDetailsFieldsProps {
  noOfParkingSpots: number;
  listOfVehicles: string[];
  /** Spots and vehicles always change together, so the two stay consistent. */
  onChange: (spots: number, vehicles: string[]) => void;
  /** Shown under the vehicle list (e.g. none selected). */
  error?: string;
}

/** Follow-ups to "Do you need parking?" answered yes: spot count and vehicle kinds. */
export default function ParkingDetailsFields({
  noOfParkingSpots,
  listOfVehicles,
  onChange,
  error,
}: ParkingDetailsFieldsProps) {
  const { t } = useTranslation();
  return (
    <>
      <DropdownField
        label={t("authMobile.personalization.parkingQuestion")}
        bottomSheetLabel={t("authMobile.personalization.parkingSheet")}
        placeholder={t("authMobile.personalization.parkingPlaceholder")}
        options={PARKING_SPOT_OPTIONS}
        onSelect={(value) => {
          const spots = value ? Number(value) : 1;
          // Lowering the count drops the vehicle kinds that no longer fit.
          onChange(spots, trimVehicles(listOfVehicles, spots));
        }}
        value={String(noOfParkingSpots)}
        required
      />

      <DropdownField
        label={t("authMobile.personalization.vehiclesQuestion")}
        bottomSheetLabel={t("authMobile.personalization.vehiclesSheet")}
        placeholder={t("authMobile.personalization.vehiclesPlaceholder")}
        options={VEHICLE_OPTIONS}
        multiple
        values={listOfVehicles}
        onSelectMultiple={(picked) => {
          const vehicles = sortVehicles(picked);
          // Never fewer spots than kinds: raise the count as kinds are added.
          onChange(spotsForVehicles(noOfParkingSpots, vehicles), vehicles);
        }}
        required
        error={error}
      />
    </>
  );
}
