"use client";

import { Checkbox, Description, FieldError, Label } from "@heroui/react";
import {
  OWN_ELECTRICITY_METER_CONFIRMATION,
  OWN_ELECTRICITY_METER_DESCRIPTION,
} from "@repo/constants";

interface ElectricityMeterConfirmationProps {
  isSelected: boolean;
  onChange: (selected: boolean) => void;
  error?: string;
  isDisabled?: boolean;
}

export default function ElectricityMeterConfirmation({
  isSelected, onChange, error, isDisabled,
}: ElectricityMeterConfirmationProps) {
  return (
    <Checkbox className="electricity-meter-confirmation" isRequired isSelected={isSelected} onChange={onChange} isInvalid={!!error} isDisabled={isDisabled}>
      <Checkbox.Content>
        <Checkbox.Control className="mt-0.5 shrink-0">
          <Checkbox.Indicator />
        </Checkbox.Control>
        <div className="min-w-0 flex flex-col gap-1">
          <Label>{OWN_ELECTRICITY_METER_CONFIRMATION} <span className="text-danger" aria-hidden="true">*</span></Label>
          <Description>{OWN_ELECTRICITY_METER_DESCRIPTION}</Description>
          <FieldError>{error}</FieldError>
        </div>
      </Checkbox.Content>
    </Checkbox>
  );
}
