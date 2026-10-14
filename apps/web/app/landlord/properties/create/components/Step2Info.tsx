"use client";

import { useCallback } from "react";
import dynamic from "next/dynamic";

import { Input, Select, Checkbox, Label, ListBox, FieldError, NumberField, TextField, Description } from "@heroui/react";

import type { ApartmentFormData, FormErrors } from "../page";

import {
  APARTMENT_FLOOR_AREA,
  APARTMENT_ROOM_LIMITS,
  APARTMENT_TYPES,
  CAMANAVA_CITIES,
  FLOOR_LEVELS,
  FURNISHED_TYPES,
  LEASE_DURATIONS,
} from "@repo/constants";

const GoogleMapPicker = dynamic(() => import("../../components/GoogleMapPicker"), { ssr: false });

interface Props {
  formData: ApartmentFormData;
  updateForm: (updates: Partial<ApartmentFormData>) => void;
  errors: FormErrors;
}

function formatRange(min: number, max: number): string {
  return min === max ? String(min) : `${min}-${max}`;
}

export default function Step2Info({ formData, updateForm, errors }: Props) {
  const roomLimits = APARTMENT_ROOM_LIMITS[formData.type];
  const areaLimits = APARTMENT_FLOOR_AREA[formData.type];
  const bedroomLimits = roomLimits?.bedrooms;
  const bathroomLimits = roomLimits?.bathrooms;
  const occupantLimits = roomLimits?.maxOccupants;

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
        <p className="text-muted-foreground text-sm">
          Tell tenants about the property details.
        </p>
      </div>

      {/* Property type & specs */}
      <div className="flex flex-col gap-4">
        <p className="text-sm font-semibold text-foreground">Property Details</p>
        <div className="grid grid-cols-2 gap-4">
          <Select
            value={formData.type ?? null}
            onChange={(value) => updateForm({ type: value as string })}
            isInvalid={!!errors.type}
            isRequired
            className="w-full"
          >
            <Label>Property Type</Label>
            <Select.Trigger className="rounded-lg border border-border bg-card data-[focus-visible=true]:border-primary data-[open=true]:border-primary cursor-pointer">
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
            <Select.Trigger className="rounded-lg border border-border bg-card data-[focus-visible=true]:border-primary data-[open=true]:border-primary cursor-pointer">
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
            minValue={bedroomLimits?.min ?? 1}
            maxValue={bedroomLimits?.max}
            value={formData.no_bedrooms}
            onChange={(value) => updateForm({ no_bedrooms: value })}
            isInvalid={!!errors.no_bedrooms}
            isRequired
          >
            <Label>No. of Bedrooms</Label>

            <NumberField.Group className="flex items-center border border-border rounded-lg overflow-hidden bg-card focus-within:border-primary! focus-within:ring-1 focus-within:ring-primary/20 transition-colors">
              
              <NumberField.DecrementButton className="px-4 py-3 text-muted-foreground hover:bg-muted active:bg-muted/80 border-r border-border flex items-center justify-center min-w-11" />
              
              <NumberField.Input className="w-full text-center bg-transparent py-3 text-foreground focus:outline-none" />
              
              <NumberField.IncrementButton className="px-4 py-3 text-muted-foreground hover:bg-muted active:bg-muted/80 border-l border-border flex items-center justify-center min-w-11" />
              
            </NumberField.Group>
            {bedroomLimits && (
              <Description className="mt-1 text-xs text-muted-foreground">
                Allowed: {formatRange(bedroomLimits.min, bedroomLimits.max)}
              </Description>
            )}
            <FieldError className="text-xs text-danger mt-1">{errors.no_bedrooms}</FieldError>
          </NumberField>

          <NumberField
            minValue={bathroomLimits?.min ?? 1}
            maxValue={bathroomLimits?.max}
            value={formData.no_bathrooms}
            onChange={(value) => updateForm({ no_bathrooms: value })}
            isInvalid={!!errors.no_bathrooms}
            isRequired
          >
            <Label>No. of Bathrooms</Label>
            <NumberField.Group className="flex items-center border border-border rounded-lg overflow-hidden bg-card focus-within:border-primary! focus-within:ring-1 focus-within:ring-primary/20 transition-colors">
              <NumberField.DecrementButton className="px-4 py-3 text-muted-foreground hover:bg-muted active:bg-muted/80 border-r border-border flex items-center justify-center min-w-11" />
              <NumberField.Input className="w-full text-center bg-transparent py-3 text-foreground focus:outline-none" />
              <NumberField.IncrementButton className="px-4 py-3 text-muted-foreground hover:bg-muted active:bg-muted/80 border-l border-border flex items-center justify-center min-w-11" />
            </NumberField.Group>
            {bathroomLimits && (
              <Description className="mt-1 text-xs text-muted-foreground">
                Allowed: {formatRange(bathroomLimits.min, bathroomLimits.max)}
              </Description>
            )}
            <FieldError className="text-xs text-danger mt-1">{errors.no_bathrooms}</FieldError>
          </NumberField>

          <NumberField
            minValue={areaLimits?.min ?? 0}
            maxValue={areaLimits?.max}
            value={formData.area_sqm}
            onChange={(value) => updateForm({ area_sqm: value })}
            isInvalid={!!errors.area_sqm}
            isRequired
          >
            <Label>Floor Area (sqm)</Label>
            <NumberField.Group className="flex items-center border border-border rounded-lg overflow-hidden bg-card focus-within:border-primary! focus-within:ring-1 focus-within:ring-primary/20 transition-colors">
              <NumberField.DecrementButton className="px-4 py-3 text-muted-foreground hover:bg-muted active:bg-muted/80 border-r border-border flex items-center justify-center min-w-11" />
              <NumberField.Input className="w-full text-center bg-transparent py-3 text-foreground focus:outline-none" />
              <NumberField.IncrementButton className="px-4 py-3 text-muted-foreground hover:bg-muted active:bg-muted/80 border-l border-border flex items-center justify-center min-w-11" />
            </NumberField.Group>
            {areaLimits && (
              <Description className="mt-1 text-xs text-muted-foreground">
                Allowed: {areaLimits.min}-{areaLimits.max} sqm
              </Description>
            )}
            <FieldError className="text-xs text-danger mt-1">{errors.area_sqm}</FieldError>
          </NumberField>

          <NumberField
            minValue={occupantLimits?.min ?? 1}
            maxValue={occupantLimits?.max}
            value={formData.max_occupants}
            onChange={(value) => updateForm({ max_occupants: value })}
            isInvalid={!!errors.max_occupants}
            isRequired
          >
            <Label>Max Occupants</Label>
            <NumberField.Group className="flex items-center border border-border rounded-lg overflow-hidden bg-card focus-within:border-primary! focus-within:ring-1 focus-within:ring-primary/20 transition-colors">
              <NumberField.DecrementButton className="px-4 py-3 text-muted-foreground hover:bg-muted active:bg-muted/80 border-r border-border flex items-center justify-center min-w-11" />
              <NumberField.Input className="w-full text-center bg-transparent py-3 text-foreground focus:outline-none" />
              <NumberField.IncrementButton className="px-4 py-3 text-muted-foreground hover:bg-muted active:bg-muted/80 border-l border-border flex items-center justify-center min-w-11" />
            </NumberField.Group>
            {occupantLimits && (
              <Description className="mt-1 text-xs text-muted-foreground">
                Allowed: {formatRange(occupantLimits.min, occupantLimits.max)}
              </Description>
            )}
            <FieldError className="text-xs text-danger mt-1">{errors.max_occupants}</FieldError>
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
              className="rounded-lg border border-border bg-card cursor-pointer focus-visible:border-primary data-[open=true]:border-primary"
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
              className="rounded-lg border border-border bg-card cursor-pointer focus-visible:border-primary data-[open=true]:border-primary"
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
        <p className="text-sm font-semibold text-foreground">Address</p>

        <TextField 
          isRequired 
          isInvalid={!!errors.street_address}
        >
          <Label>Street Address</Label>
          <Input
            placeholder="e.g. 123 Rizal Ave."
            value={formData.street_address}
            onChange={(e) => updateForm({ street_address: e.target.value })}
            className="bg-card text-foreground border-border placeholder:text-muted-foreground focus-visible:border-primary"
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
              className="bg-card text-foreground border-border placeholder:text-muted-foreground focus-visible:border-primary"
            />
            <FieldError>{errors.barangay}</FieldError>
          </TextField>

          <Select
            placeholder="Select CAMANAVA city"
            value={formData.city || null}
            onChange={(city) => updateForm({ city: city as string, province: "Metro Manila" })}
            isInvalid={!!errors.city}
            isRequired
            className="w-full"
          >
            <Label>City</Label>
            <Select.Trigger className="rounded-lg border border-border bg-card cursor-pointer focus-visible:border-primary data-[open=true]:border-primary">
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <FieldError>{errors.city}</FieldError>
            <Select.Popover>
              <ListBox>
                {CAMANAVA_CITIES.map((city) => (
                  <ListBox.Item key={city} id={city} textValue={city} className="hover:bg-light-blue!">
                    {city}
                  </ListBox.Item>
                ))}
              </ListBox>
            </Select.Popover>
          </Select>

          <TextField isRequired isInvalid={!!errors.province} isDisabled>
            <Label>Province</Label>
            <Input value="Metro Manila" className="bg-muted text-muted-foreground border-border" />
            <FieldError>{errors.province}</FieldError>
          </TextField>

          <TextField 
            isRequired 
            isInvalid={!!errors.zip_code}
          >
            <Label>Zip Code</Label>
            <Input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={4}
              value={formData.zip_code}
              onChange={(e) => {
                const onlyNums = e.target.value.replace(/[^0-9]/g, "").slice(0, 4);
                updateForm({ zip_code: onlyNums });
              }}
              className="bg-card text-foreground border-border placeholder:text-muted-foreground focus-visible:border-primary"
            />
            <FieldError>{errors.zip_code}</FieldError>
          </TextField>
        </div>
      </div>

      {/* Map Coordinates */}
      <div className="flex flex-col gap-4">
        <div>
          <p className="text-sm font-semibold text-foreground">
            Map Coordinates{" "}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Your pin must be inside the selected CAMANAVA city.
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
            <Label className="text-sm font-medium text-foreground">Latitude</Label>
            <NumberField.Group className="flex items-center w-full bg-card rounded-xl border border-border transition-colors focus-within:border-primary! focus-within:ring-2 focus-within:ring-primary/20">
              <NumberField.Input 
                placeholder="e.g. 14.5995"
                className="w-full bg-transparent px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-default-400" 
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
            <Label className="text-sm font-medium text-foreground">Longitude</Label>
            <NumberField.Group className="flex items-center w-full bg-card rounded-xl border border-border transition-colors focus-within:border-primary! focus-within:ring-2 focus-within:ring-primary/20">
              <NumberField.Input 
                placeholder="e.g. 120.9842"
                className="w-full bg-transparent px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-default-400" 
              />
            </NumberField.Group>
            <FieldError className="text-xs text-danger">{errors.longitude}</FieldError>
          </NumberField>
        </div>

        <GoogleMapPicker
          latitude={formData.latitude}
          longitude={formData.longitude}
          onPick={handlePick}
          error={errors.latitude}
        />

        {/* Pin Confirmation Checkbox */}
        {formData.latitude !== null && formData.longitude !== null && (
          <Checkbox
            className="group"
            isSelected={formData.isPinConfirmed ?? false}
            onChange={(checked) => updateForm({ isPinConfirmed: checked })}
            isInvalid={!!errors.isPinConfirmed}
          >
            <Checkbox.Content className="flex cursor-pointer items-start gap-2 select-none">
              <Checkbox.Control className="mt-0.5 size-5 shrink-0 border border-border shadow-none! before:bg-primary! group-data-[selected=true]:border-primary! group-data-[selected=true]:bg-primary!">
                <Checkbox.Indicator className="[&_svg]:text-white!" />
              </Checkbox.Control>
              <div>
                <Label className="cursor-pointer text-sm text-foreground">
                  I confirm that the pin location on the map is correct
                </Label>
                {errors.isPinConfirmed && (
                  <Description className="mt-0.5 text-xs text-danger">
                    {errors.isPinConfirmed}
                  </Description>
                )}
              </div>
            </Checkbox.Content>
          </Checkbox>
        )}
      </div>
    </div>
  );
}
