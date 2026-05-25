"use client";

import { useCallback } from "react";
import dynamic from "next/dynamic";

import { Input, Select, Checkbox, Label, ListBox, FieldError, NumberField, TextField, Description } from "@heroui/react";

import type { ApartmentFormData, FormErrors } from "../page";

import { PROVINCES, APARTMENT_TYPES, FLOOR_LEVELS, LEASE_DURATIONS, FURNISHED_TYPES } from "@repo/constants";

const MapPicker = dynamic(() => import("./MapPicker"), { ssr: false });

interface Props {
  formData: ApartmentFormData;
  updateForm: (updates: Partial<ApartmentFormData>) => void;
  errors: FormErrors;
}

export default function Step2Info({ formData, updateForm, errors }: Props) {

  const handlePick = useCallback(
    (lat: number, lng: number) => updateForm({ 
      latitude: lat, 
      longitude: lng,
      isPinConfirmed: false,
    }),
    [updateForm]
  );

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-2xl font-medium font-noto-serif text-primary mb-1">
          Apartment Info
        </h2>
        <p className="text-grey-500 text-sm">
          Tell tenants about the property details.
        </p>
      </div>

      {/* Property type & specs */}
      <div className="flex flex-col gap-4">
        <p className="text-sm font-semibold text-grey-700">Property Details</p>
        <div className="grid grid-cols-2 gap-4">
          <Select
            value={formData.type ?? null}
            onChange={(value) => updateForm({ type: value as string })}
            isInvalid={!!errors.type}
            isRequired
            className="w-full"
          >
            <Label>Property Type</Label>
            <Select.Trigger className="rounded-lg border border-border data-[focus-visible=true]:border-primary data-[open=true]:border-primary cursor-pointer">
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <FieldError>{errors.type}</FieldError>
            <Select.Popover>
              <ListBox>
                {APARTMENT_TYPES.map((t) => (
                  <ListBox.Item key={t} id={t} textValue={t} className="hover:bg-light-blue!">
                    {t}
                  </ListBox.Item>
                ))}
              </ListBox>
            </Select.Popover>
          </Select>

          <Select
            value={formData.furnished_type ?? null}
            onChange={(value) => updateForm({ furnished_type: value as string })}
            isInvalid={!!errors.furnished_type}
            isRequired
            className="w-full"
          >
            <Label>Furnished Type</Label>
            <Select.Trigger className="rounded-lg border border-border data-[focus-visible=true]:border-primary data-[open=true]:border-primary cursor-pointer">
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <FieldError>{errors.furnished_type}</FieldError>
            <Select.Popover>
              <ListBox>
                {FURNISHED_TYPES.map((t) => (
                  <ListBox.Item key={t} id={t} textValue={t} className="hover:bg-light-blue!">
                    {t}
                  </ListBox.Item>
                ))}
              </ListBox>
            </Select.Popover>
          </Select>

          <NumberField
            minValue={1}
            value={formData.no_bedrooms}
            onChange={(value) => updateForm({ no_bedrooms: value })}
            isInvalid={!!errors.no_bedrooms}
            isRequired
          >
            <Label>No. of Bedrooms</Label>

            <NumberField.Group className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all">
              
              <NumberField.DecrementButton className="px-4 py-3 text-gray-500 hover:bg-gray-50 active:bg-gray-100 border-r border-gray-100 flex items-center justify-center min-w-11" />
              
              <NumberField.Input className="w-full text-center bg-transparent py-3 text-gray-900 focus:outline-none" />
              
              <NumberField.IncrementButton className="px-4 py-3 text-gray-500 hover:bg-gray-50 active:bg-gray-100 border-l border-gray-100 flex items-center justify-center min-w-11" />
              
            </NumberField.Group>
            <FieldError className="text-xs text-red-500 mt-1">{errors.no_bedrooms}</FieldError>
          </NumberField>

          <NumberField
            minValue={1}
            value={formData.no_bathrooms}
            onChange={(value) => updateForm({ no_bathrooms: value })}
            isInvalid={!!errors.no_bathrooms}
            isRequired
          >
            <Label>No. of Bathrooms</Label>
            <NumberField.Group className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all">
              <NumberField.DecrementButton className="px-4 py-3 text-gray-500 hover:bg-gray-50 active:bg-gray-100 border-r border-gray-100 flex items-center justify-center min-w-11" />
              <NumberField.Input className="w-full text-center bg-transparent py-3 text-gray-900 focus:outline-none" />
              <NumberField.IncrementButton className="px-4 py-3 text-gray-500 hover:bg-gray-50 active:bg-gray-100 border-l border-gray-100 flex items-center justify-center min-w-11" />
            </NumberField.Group>
            <FieldError className="text-xs text-red-500 mt-1">{errors.no_bathrooms}</FieldError>
          </NumberField>

          <NumberField
            minValue={0}
            value={formData.area_sqm}
            onChange={(value) => updateForm({ area_sqm: value })}
            isInvalid={!!errors.area_sqm}
            isRequired
          >
            <Label>Floor Area (sqm)</Label>
            <NumberField.Group className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all">
              <NumberField.DecrementButton className="px-4 py-3 text-gray-500 hover:bg-gray-50 active:bg-gray-100 border-r border-gray-100 flex items-center justify-center min-w-11" />
              <NumberField.Input className="w-full text-center bg-transparent py-3 text-gray-900 focus:outline-none" />
              <NumberField.IncrementButton className="px-4 py-3 text-gray-500 hover:bg-gray-50 active:bg-gray-100 border-l border-gray-100 flex items-center justify-center min-w-11" />
            </NumberField.Group>
            <FieldError className="text-xs text-red-500 mt-1">{errors.area_sqm}</FieldError>
          </NumberField>

          <NumberField
            minValue={1}
            value={formData.max_occupants}
            onChange={(value) => updateForm({ max_occupants: value })}
            isInvalid={!!errors.max_occupants}
            isRequired
          >
            <Label>Max Occupants</Label>
            <NumberField.Group className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all">
              <NumberField.DecrementButton className="px-4 py-3 text-gray-500 hover:bg-gray-50 active:bg-gray-100 border-r border-gray-100 flex items-center justify-center min-w-11" />
              <NumberField.Input className="w-full text-center bg-transparent py-3 text-gray-900 focus:outline-none" />
              <NumberField.IncrementButton className="px-4 py-3 text-gray-500 hover:bg-gray-50 active:bg-gray-100 border-l border-gray-100 flex items-center justify-center min-w-11" />
            </NumberField.Group>
            <FieldError className="text-xs text-red-500 mt-1">{errors.max_occupants}</FieldError>
          </NumberField>

          <Select
            placeholder="Select floor level"
            value={formData.floor_level || null}
            onChange={(key) => updateForm({ floor_level: key as string })}
            isInvalid={!!errors.floor_level}
            isRequired
            className="w-full"
          >
            <Label>Floor Level</Label>
            
            <Select.Trigger 
              className="rounded-lg border cursor-pointer focus-visible:border-primary data-[open=true]:border-primary"
            >
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>

            <FieldError>{errors.floor_level}</FieldError>

            <Select.Popover>
              <ListBox>
                {FLOOR_LEVELS.map((t) => (
                  <ListBox.Item 
                    key={t} 
                    id={t} 
                    textValue={t}
                    className="hover:bg-light-blue!"
                  >
                    {t}
                  </ListBox.Item>
                ))}
              </ListBox>
            </Select.Popover>
          </Select>

          <Select
            placeholder="Select lease duration"
            value={formData.lease_duration || null}
            onChange={(key) => updateForm({ lease_duration: key as string })}
            isInvalid={!!errors.lease_duration}
            isRequired
            className="w-full"
          >
            <Label>Lease Duration</Label>
            
            <Select.Trigger 
              className="rounded-lg border cursor-pointer focus-visible:border-primary data-[open=true]:border-primary"
            >
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>

            <FieldError>{errors.lease_duration}</FieldError>

            <Select.Popover>
              <ListBox>
                {LEASE_DURATIONS.map((t) => (
                  <ListBox.Item 
                    key={t} 
                    id={t} 
                    textValue={t}
                    className="hover:bg-light-blue!"
                  >
                    {t}
                  </ListBox.Item>
                ))}
              </ListBox>
            </Select.Popover>
          </Select>
        </div>
      </div>

      {/* Address */}
      <div className="flex flex-col gap-4">
        <p className="text-sm font-semibold text-grey-700">Address</p>

        <TextField 
          isRequired 
          isInvalid={!!errors.street_address}
        >
          <Label>Street Address</Label>
          <Input
            placeholder="e.g. 123 Rizal Ave."
            value={formData.street_address}
            onChange={(e) => updateForm({ street_address: e.target.value })}
          />
          <FieldError>{errors.street_address}</FieldError>
        </TextField>

        <div className="grid grid-cols-2 gap-4">
          <TextField 
            isRequired 
            isInvalid={!!errors.barangay}
          >
            <Label>Barangay</Label>
            <Input
              value={formData.barangay}
              onChange={(e) => updateForm({ barangay: e.target.value })}
            />
            <FieldError>{errors.barangay}</FieldError>
          </TextField>

          <TextField 
            isRequired 
            isInvalid={!!errors.city}
          >
            <Label>City</Label>
            <Input
              value={formData.city}
              onChange={(e) => updateForm({ city: e.target.value })}
            />
            <FieldError>{errors.city}</FieldError>
          </TextField>

          <Select
            placeholder="Select province"
            value={formData.province || null}
            onChange={(key) => updateForm({ province: key as string })}
            isInvalid={!!errors.province}
            isRequired
            className="w-full"
          >
            <Label>Province</Label>
            
            <Select.Trigger 
              className="rounded-lg border cursor-pointer focus-visible:border-primary data-[open=true]:border-primary"
            >
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>

            <FieldError>{errors.province}</FieldError>

            <Select.Popover>
              <ListBox>
                {PROVINCES.map((t) => (
                  <ListBox.Item 
                    key={t} 
                    id={t} 
                    textValue={t}
                    className="hover:bg-light-blue!"
                  >
                    {t}
                  </ListBox.Item>
                ))}
              </ListBox>
            </Select.Popover>
          </Select>

          <TextField 
            isRequired 
            isInvalid={!!errors.zip_code}
          >
            <Label>Zip Code</Label>
            <Input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={formData.zip_code}
              onChange={(e) => {
                const onlyNums = e.target.value.replace(/[^0-9]/g, "");
                updateForm({ zip_code: onlyNums });
              }}
            />
            <FieldError>{errors.zip_code}</FieldError>
          </TextField>
        </div>
      </div>

      {/* Map Coordinates */}
      <div className="flex flex-col gap-4">
        <div>
          <p className="text-sm font-semibold text-grey-700">
            Map Coordinates{" "}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <NumberField
            isRequired
            isInvalid={!!errors.latitude}
            value={formData.latitude !== null ? formData.latitude : 0}
            onChange={(value) => {
              updateForm({ latitude: value !== undefined ? value : null, isPinConfirmed: false });
            }}
            className="flex flex-col gap-1.5 w-full"
          >
            <Label className="text-sm font-medium text-default-700">Latitude</Label>
            <NumberField.Group className="flex items-center w-full bg-white rounded-xl border border-grey-300 transition-colors focus-within:border-primary! focus-within:ring-2 focus-within:ring-primary/20">
              <NumberField.Input 
                placeholder="e.g. 14.5995"
                className="w-full bg-transparent px-3 py-2.5 text-sm text-default-900 outline-none placeholder:text-default-400" 
              />
            </NumberField.Group>
            <FieldError className="text-xs text-danger">{errors.latitude}</FieldError>
          </NumberField>

          <NumberField
            isRequired
            isInvalid={!!errors.longitude}
            value={formData.longitude !== null ? formData.longitude : 0}
            onChange={(value) => {
              updateForm({ longitude: value !== undefined ? value : null, isPinConfirmed: false });
            }}
            className="flex flex-col gap-1.5 w-full"
          >
            <Label className="text-sm font-medium text-default-700">Longitude</Label>
            <NumberField.Group className="flex items-center w-full bg-white rounded-xl border border-grey-300 transition-colors focus-within:border-primary! focus-within:ring-2 focus-within:ring-primary/20">
              <NumberField.Input 
                placeholder="e.g. 120.9842"
                className="w-full bg-transparent px-3 py-2.5 text-sm text-default-900 outline-none placeholder:text-default-400" 
              />
            </NumberField.Group>
            <FieldError className="text-xs text-danger">{errors.longitude}</FieldError>
          </NumberField>
        </div>

        <MapPicker
          latitude={formData.latitude}
          longitude={formData.longitude}
          onPick={handlePick}
          error={errors.latitude}
        />

        {/* Pin Confirmation Checkbox */}
        {formData.latitude !== null && formData.longitude !== null && (
          <Checkbox
            isSelected={formData.isPinConfirmed ?? false}
            onChange={(checked) => updateForm({ isPinConfirmed: checked })}
            isInvalid={!!errors.isPinConfirmed}
          >
            <Checkbox.Control>
              <Checkbox.Indicator />
            </Checkbox.Control>
            <Checkbox.Content>
              <Label className="text-sm text-grey-700">
                I confirm that the pin location on the map is correct
              </Label>
              {errors.isPinConfirmed && (
                <Description className="text-xs text-danger mt-0.5">
                  {errors.isPinConfirmed}
                </Description>
              )}
            </Checkbox.Content>
          </Checkbox>
        )}
      </div>
    </div>
  );
}
