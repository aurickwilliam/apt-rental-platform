"use client";

import { useCallback } from "react";
import { Input, Select, SelectItem, NumberInput, Checkbox } from "@heroui/react";
import type { ApartmentFormData, FormErrors } from "../page";
import dynamic from "next/dynamic";
import { PROVINCES, APARTMENT_TYPES, FLOOR_LEVELS, LEASE_DURATIONS, FURNISHED_TYPES } from "@repo/constants";


interface Props {
  formData: ApartmentFormData;
  updateForm: (updates: Partial<ApartmentFormData>) => void;
  errors: FormErrors;
}

export default function Step2Info({ formData, updateForm, errors }: Props) {
  const MapPicker = dynamic(() => import("./MapPicker"), { ssr: false });

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
            label="Property Type"
            selectedKeys={formData.type ? new Set([formData.type]) : new Set()}
            onSelectionChange={(keys) =>
              updateForm({ type: Array.from(keys)[0] as string })
            }
            radius="lg"
            variant="bordered"
            classNames={{
              trigger: "cursor-pointer data-[focus=true]:border-primary data-[open=true]:border-primary",
            }}
            isInvalid={!!errors.type}
            errorMessage={errors.type}
          >
            {APARTMENT_TYPES.map((t) => (
              <SelectItem key={t} className="data-[hover=true]:bg-light-blue!">
                {t}
              </SelectItem>
            ))}
          </Select>

          <Select
            label="Furnished Type"
            selectedKeys={
              formData.furnished_type
                ? new Set([formData.furnished_type])
                : new Set()
            }
            onSelectionChange={(keys) =>
              updateForm({ furnished_type: Array.from(keys)[0] as string })
            }
            radius="lg"
            variant="bordered"
            classNames={{
              trigger: "cursor-pointer data-[focus=true]:border-primary data-[open=true]:border-primary",
            }}
            isInvalid={!!errors.furnished_type}
            errorMessage={errors.furnished_type}
          >
            {FURNISHED_TYPES.map((t) => (
              <SelectItem key={t} className="data-[hover=true]:bg-light-blue!">
                {t}
              </SelectItem>
            ))}
          </Select>

          <NumberInput
            label="No. of Bedrooms"
            type="number"
            minValue={1}
            value={formData.no_bedrooms}
            onValueChange={(value) => updateForm({ no_bedrooms: value })}
            radius="lg"
            variant="bordered"
            classNames={{
              inputWrapper: "data-[focus=true]:border-primary! data-[focus=true]:border-2!"
            }}
            isInvalid={!!errors.no_bedrooms}
            errorMessage={errors.no_bedrooms}
          />

          <NumberInput
            label="No. of Bathrooms"
            type="number"
            minValue={1}
            value={formData.no_bathrooms}
            onValueChange={(value) => updateForm({ no_bathrooms: value })}
            radius="lg"
            variant="bordered"
            classNames={{
              inputWrapper: "data-[focus=true]:border-primary! data-[focus=true]:border-2!"
            }}
            isInvalid={!!errors.no_bathrooms}
            errorMessage={errors.no_bathrooms}
          />

          <NumberInput
            label="Floor Area (sqm)"
            type="number"
            min={0}
            value={formData.area_sqm}
            onValueChange={(value) => updateForm({ area_sqm: value })}
            radius="lg"
            variant="bordered"
            classNames={{
              inputWrapper: "data-[focus=true]:border-primary! data-[focus=true]:border-2!"
            }}
            isInvalid={!!errors.area_sqm}
            errorMessage={errors.area_sqm}
          />

          <NumberInput
            label="Max Occupants"
            type="number"
            minValue={1}
            value={formData.max_occupants}
            onValueChange={(value) => updateForm({ max_occupants: value })}
            radius="lg"
            variant="bordered"
            classNames={{
              inputWrapper: "data-[focus=true]:border-primary! data-[focus=true]:border-2!"
            }}
            isInvalid={!!errors.max_occupants}
            errorMessage={errors.max_occupants}
          />

          <Select
            label="Floor Level"
            selectedKeys={
              formData.floor_level ? new Set([formData.floor_level]) : new Set()
            }
            onSelectionChange={(keys) =>
              updateForm({ floor_level: Array.from(keys)[0] as string })
            }
            radius="lg"
            variant="bordered"
            classNames={{
              trigger: "cursor-pointer data-[focus=true]:border-primary data-[open=true]:border-primary",
            }}
            isInvalid={!!errors.floor_level}
            errorMessage={errors.floor_level}
          >
            {FLOOR_LEVELS.map((t) => (
              <SelectItem key={t} className="data-[hover=true]:bg-light-blue!">
                {t}
              </SelectItem>
            ))}
          </Select>

          <Select
            label="Lease Duration"
            selectedKeys={
              formData.lease_duration
                ? new Set([formData.lease_duration])
                : new Set()
            }
            onSelectionChange={(keys) =>
              updateForm({ lease_duration: Array.from(keys)[0] as string })
            }
            radius="lg"
            variant="bordered"
            classNames={{
              trigger: "cursor-pointer data-[focus=true]:border-primary data-[open=true]:border-primary",
            }}
            isInvalid={!!errors.lease_duration}
            errorMessage={errors.lease_duration}
          >
            {LEASE_DURATIONS.map((t) => (
              <SelectItem key={t} className="data-[hover=true]:bg-light-blue!">
                {t}
              </SelectItem>
            ))}
          </Select>
        </div>
      </div>

      {/* Address */}
      <div className="flex flex-col gap-4">
        <p className="text-sm font-semibold text-grey-700">Address</p>

        <Input
          label="Street Address"
          placeholder="e.g. 123 Rizal Ave."
          value={formData.street_address}
          onValueChange={(v) => updateForm({ street_address: v })}
          radius="lg"
          variant="bordered"
          classNames={{
            inputWrapper: "data-[focus=true]:border-primary! data-[focus=true]:border-2!"
          }}
          isInvalid={!!errors.street_address}
          errorMessage={errors.street_address}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Barangay"
            value={formData.barangay}
            onValueChange={(v) => updateForm({ barangay: v })}
            radius="lg"
            variant="bordered"
            classNames={{
              inputWrapper: "data-[focus=true]:border-primary! data-[focus=true]:border-2!"
            }}
            isInvalid={!!errors.barangay}
            errorMessage={errors.barangay}
          />
          <Input
            label="City"
            value={formData.city}
            onValueChange={(v) => updateForm({ city: v })}
            radius="lg"
            variant="bordered"
            classNames={{
              inputWrapper: "data-[focus=true]:border-primary! data-[focus=true]:border-2!"
            }}
            isInvalid={!!errors.city}
            errorMessage={errors.city}

          />

          <Select
            label="Province"
            selectedKeys={
              formData.province
                ? new Set([formData.province])
                : new Set()
            }
            onSelectionChange={(keys) =>
              updateForm({ province: Array.from(keys)[0] as string })
            }
            radius="lg"
            variant="bordered"
            classNames={{
              trigger: "cursor-pointer data-[focus=true]:border-primary data-[open=true]:border-primary",
            }}
            isInvalid={!!errors.province}
            errorMessage={errors.province}
          >
            {PROVINCES.map((t) => (
              <SelectItem key={t} className="data-[hover=true]:bg-light-blue!">
                {t}
              </SelectItem>
            ))}
          </Select>

          <Input
            label="Zip Code"
            value={formData.zip_code}
            onValueChange={(v) => updateForm({ zip_code: v })}
            radius="lg"
            variant="bordered"
            classNames={{
              inputWrapper: "data-[focus=true]:border-primary! data-[focus=true]:border-2!"
            }}
            isInvalid={!!errors.zip_code}
            errorMessage={errors.zip_code}
          />
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
          <NumberInput
            label="Latitude"
            type="number"
            placeholder="e.g. 14.5995"
            value={formData.latitude !== null ? formData.latitude : 0}
            onValueChange={(value) => {
              updateForm({ latitude: value ? value : null, isPinConfirmed: false });
            }}
            radius="lg"
            variant="bordered"
            classNames={{
              inputWrapper: "data-[focus=true]:border-primary! data-[focus=true]:border-2!"
            }}
            hideStepper
            isInvalid={!!errors.latitude}
            errorMessage={errors.latitude}
          />

          <NumberInput
            label="Longitude"
            type="number"
            placeholder="e.g. 120.9842"
            value={formData.longitude !== null ? formData.longitude : 0}
            onValueChange={(value) => {
              updateForm({ longitude: value ? value : null, isPinConfirmed: false });
            }}
            radius="lg"
            variant="bordered"
            classNames={{
              inputWrapper: "data-[focus=true]:border-primary! data-[focus=true]:border-2!"
            }}
            hideStepper
            isInvalid={!!errors.longitude}
            errorMessage={errors.longitude}
          />
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
            onValueChange={(checked) => updateForm({ isPinConfirmed: checked })}
            isInvalid={!!errors.isPinConfirmed}
            radius="sm"
          >
            <span className="text-sm text-grey-700">
              I confirm that the pin location on the map is correct
            </span>
            {errors.isPinConfirmed && (
              <p className="text-xs text-danger mt-0.5">{errors.isPinConfirmed}</p>
            )}
          </Checkbox>
        )}
      </div>
    </div>
  );
}
