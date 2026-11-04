"use client";

import { Label, ListBox, Select } from "@heroui/react";
import { VEHICLE_OPTIONS } from "@repo/constants";

import { PARKING_SPOT_OPTIONS } from "@/lib/tenant-preferences";

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
  return (
    <>
      <Select
        placeholder="Select the number of parking you need"
        value={String(noOfParkingSpots)}
        onChange={(key) => {
          const count = key ? Number(key) : 1;
          // Lowering the count drops the vehicle kinds that no longer fit.
          onChange({ noOfParkingSpots: count, listOfVehicles: listOfVehicles.slice(0, count) });
        }}
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
      <Select
        selectionMode="multiple"
        placeholder="Select the kinds of vehicles you have"
        value={listOfVehicles}
        onChange={(keys) => {
          const picked = keys.map(String);
          const next = VEHICLE_OPTIONS.filter((vehicle) => picked.includes(vehicle));
          // Never fewer spots than kinds: raise the count as kinds are added.
          onChange({
            listOfVehicles: next,
            noOfParkingSpots: Math.max(noOfParkingSpots || 0, next.length),
          });
        }}
      >
        <Label>Select the kinds of vehicles you have:</Label>
        <Select.Trigger>
          <Select.Value />
          <Select.Indicator />
        </Select.Trigger>
        <Select.Popover>
          <ListBox className="settings-select-list" selectionMode="multiple">
            {VEHICLE_OPTIONS.map((vehicle) => (
              <ListBox.Item key={vehicle} id={vehicle} textValue={vehicle}>
                {vehicle}
                <ListBox.ItemIndicator />
              </ListBox.Item>
            ))}
          </ListBox>
        </Select.Popover>
      </Select>
    </>
  );
}
