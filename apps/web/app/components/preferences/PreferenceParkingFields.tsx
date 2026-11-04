"use client";

import { Label, ListBox, Select } from "@heroui/react";
import { VEHICLE_OPTIONS } from "@repo/constants";

import { PARKING_SPOT_OPTIONS } from "@/lib/tenant-preferences";

import PreferenceOptionCard from "./PreferenceOptionCard";

export interface ParkingDetails {
  noOfParkingSpots: number;
  listOfVehicles: string[];
}

interface PreferenceParkingFieldsProps extends ParkingDetails {
  onChange: (patch: Partial<ParkingDetails>) => void;
}

/** Follow-up fields for "Do you need parking?" answered yes: spots and vehicle kinds. */
export default function PreferenceParkingFields({
  noOfParkingSpots,
  listOfVehicles,
  onChange,
}: PreferenceParkingFieldsProps) {
  const toggleVehicle = (vehicle: string) => {
    onChange({
      listOfVehicles: listOfVehicles.includes(vehicle)
        ? listOfVehicles.filter((v) => v !== vehicle)
        : [...listOfVehicles, vehicle],
    });
  };

  return (
    <>
      <Select
        placeholder="Select the number of parking you need"
        value={String(noOfParkingSpots)}
        onChange={(key) => onChange({ noOfParkingSpots: key ? Number(key) : 1 })}
      >
        <Label>If yes, how many cars or motorcycles do you have? <span className="text-danger" aria-hidden="true">*</span></Label>
        <Select.Trigger>
          <Select.Value />
          <Select.Indicator />
        </Select.Trigger>
        <Select.Popover>
          <ListBox className="settings-select-list">
            {PARKING_SPOT_OPTIONS.map((count) => (
              <ListBox.Item key={count} id={count} textValue={count}>
                {count}
                <ListBox.ItemIndicator />
              </ListBox.Item>
            ))}
          </ListBox>
        </Select.Popover>
      </Select>
      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold text-foreground">Select the kinds of vehicles you have:</p>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2" role="group" aria-label="Vehicle types">
          {VEHICLE_OPTIONS.map((vehicle) => (
            <PreferenceOptionCard
              key={vehicle}
              label={vehicle}
              selected={listOfVehicles.includes(vehicle)}
              onPress={() => toggleVehicle(vehicle)}
            />
          ))}
        </div>
      </div>
    </>
  );
}
