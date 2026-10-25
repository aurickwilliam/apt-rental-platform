"use client";

import { FieldError, Input, Label, ListBox, Select, TextField } from "@heroui/react";
import { PROVINCES, getCitiesByProvince, getBarangaysByCity, type Province } from "@repo/constants";
import { changeRegistrationAddress, validateRegistrationAddress, type RegistrationAddress, type RegistrationAddressErrors } from "@/lib/registration-address";

interface RegistrationAddressFieldsProps {
  value: RegistrationAddress;
  onChange: (value: RegistrationAddress) => void;
  errors?: RegistrationAddressErrors;
  isDisabled?: boolean;
  names?: Record<keyof RegistrationAddress, string>;
  className?: string;
}

const DEFAULT_NAMES = { province: "stateProvince", city: "city", barangay: "barangay", streetAddress: "streetAddress", postalCode: "postalCode" };
const OPTION_CLASS = "data-[hovered=true]:bg-light-blue! data-[selected=true]:bg-primary/10! data-[selected=true]:text-primary";

export default function RegistrationAddressFields({ value, onChange, errors = {}, isDisabled = false, names = DEFAULT_NAMES, className = "w-full grid grid-cols-1 gap-5 md:grid-cols-2" }: RegistrationAddressFieldsProps) {
  const cities = PROVINCES.includes(value.province as Province) ? getCitiesByProvince(value.province as Province) : [];
  const barangays = cities.includes(value.city) ? getBarangaysByCity(value.city) : [];
  const postalError = errors.postalCode ?? (value.postalCode.length === 4 ? validateRegistrationAddress(value).postalCode : undefined);
  const selectors = [
    { field: "province" as const, label: "State/Province", options: PROVINCES, placeholder: "Select your state/province", disabled: false },
    { field: "city" as const, label: "City", options: cities, placeholder: value.province ? "Select your city" : "Select a province first", disabled: !value.province },
    { field: "barangay" as const, label: "Barangay", options: barangays, placeholder: value.city ? "Select your barangay" : "Select a city first", disabled: !value.city },
  ];
  return (
    <div className={className}>
      {selectors.map(({ field, label, options, placeholder, disabled }) => (
        <Select key={field} name={names[field]} isRequired validationBehavior="aria" className="w-full" value={value[field] || null}
          onChange={key => onChange(changeRegistrationAddress(value, field, key ? String(key) : ""))}
          isDisabled={isDisabled || disabled} isInvalid={errors[field] ? true : undefined} placeholder={placeholder}>
          <Label>{label}</Label>
          <Select.Trigger className="bg-card! text-foreground!"><Select.Value /><Select.Indicator /></Select.Trigger>
          <Select.Popover>
            <ListBox className={field === "barangay" ? "max-h-64 overflow-y-auto" : undefined}>
              {options.map(option => (
                <ListBox.Item key={option} id={option} textValue={option} className={OPTION_CLASS}>
                  {option}<ListBox.ItemIndicator className="text-primary" />
                </ListBox.Item>
              ))}
            </ListBox>
          </Select.Popover>
          <FieldError className="text-xs">{errors[field]}</FieldError>
        </Select>
      ))}
      <TextField name={names.streetAddress} isRequired validationBehavior="aria" value={value.streetAddress}
        onChange={text => onChange(changeRegistrationAddress(value, "streetAddress", text))} isDisabled={isDisabled} isInvalid={errors.streetAddress ? true : undefined}>
        <Label>Street Address</Label>
        <Input className="bg-card! text-foreground!" placeholder="Enter your street address" />
        <FieldError className="text-xs">{errors.streetAddress}</FieldError>
      </TextField>
      <TextField name={names.postalCode} isRequired validationBehavior="aria" value={value.postalCode}
        onChange={text => onChange(changeRegistrationAddress(value, "postalCode", text))} isDisabled={isDisabled} isInvalid={postalError ? true : undefined}>
        <Label>Postal Code</Label>
        <Input className="bg-card! text-foreground!" placeholder="Enter your postal code" inputMode="numeric" maxLength={4} />
        <FieldError className="text-xs">{postalError}</FieldError>
      </TextField>
    </div>
  );
}
