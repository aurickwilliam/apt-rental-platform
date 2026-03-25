"use client";
import { Input, Select, SelectItem } from "@heroui/react";
import type { ApartmentFormData } from "../page";

interface Props {
  formData: ApartmentFormData;
  updateForm: (updates: Partial<ApartmentFormData>) => void;
}

const APARTMENT_TYPES = [
  "Studio",
  "Condo Unit",
  "House",
  "Apartment",
  "Townhouse",
  "Boarding House / Room",
  "Bedspace",
];

const FURNISHED_TYPES = ["Fully Furnished", "Semi-Furnished", "Unfurnished"];

const FLOOR_LEVELS = [
  "Ground Floor",
  "Low Floor (1–5F)",
  "Mid Floor (6–15F)",
  "High Floor (16F+)",
  "Penthouse",
  "N/A",
];

const LEASE_DURATIONS = [
  "Monthly",
  "3 Months",
  "6 Months",
  "1 Year",
  "2 Years",
  "Negotiable",
];

export default function Step2Info({ formData, updateForm }: Props) {
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
          >
            {APARTMENT_TYPES.map((t) => (
              <SelectItem key={t}>{t}</SelectItem>
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
          >
            {FURNISHED_TYPES.map((t) => (
              <SelectItem key={t}>{t}</SelectItem>
            ))}
          </Select>

          <Input
            label="No. of Bedrooms"
            type="number"
            min={0}
            value={String(formData.no_bedrooms)}
            onValueChange={(v) => updateForm({ no_bedrooms: Number(v) })}
            radius="lg"
            variant="bordered"
          />

          <Input
            label="No. of Bathrooms"
            type="number"
            min={1}
            value={String(formData.no_bathrooms)}
            onValueChange={(v) => updateForm({ no_bathrooms: Number(v) })}
            radius="lg"
            variant="bordered"
          />

          <Input
            label="Floor Area (sqm)"
            type="number"
            min={0}
            value={String(formData.area_sqm)}
            onValueChange={(v) => updateForm({ area_sqm: Number(v) })}
            radius="lg"
            variant="bordered"
          />

          <Input
            label="Max Occupants"
            type="number"
            min={1}
            value={String(formData.max_occupants)}
            onValueChange={(v) => updateForm({ max_occupants: Number(v) })}
            radius="lg"
            variant="bordered"
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
          >
            {FLOOR_LEVELS.map((t) => (
              <SelectItem key={t}>{t}</SelectItem>
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
          >
            {LEASE_DURATIONS.map((t) => (
              <SelectItem key={t}>{t}</SelectItem>
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
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Barangay"
            value={formData.barangay}
            onValueChange={(v) => updateForm({ barangay: v })}
            radius="lg"
            variant="bordered"
          />
          <Input
            label="City"
            value={formData.city}
            onValueChange={(v) => updateForm({ city: v })}
            radius="lg"
            variant="bordered"
          />
          <Input
            label="Province"
            value={formData.province}
            onValueChange={(v) => updateForm({ province: v })}
            radius="lg"
            variant="bordered"
          />
          <Input
            label="Zip Code"
            value={formData.zip_code}
            onValueChange={(v) => updateForm({ zip_code: v })}
            radius="lg"
            variant="bordered"
          />
        </div>
      </div>

      {/* Map Coordinates */}
      <div className="flex flex-col gap-4">
        <div>
          <p className="text-sm font-semibold text-grey-700">
            Map Coordinates{" "}
            <span className="text-grey-400 font-normal">(optional)</span>
          </p>
          <p className="text-xs text-grey-400 mt-0.5">
            Get coordinates from{" "}
            <a
              href="https://www.google.com/maps"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline"
            >
              Google Maps
            </a>{" "}
            by right-clicking your location.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Latitude"
            type="number"
            placeholder="e.g. 14.5995"
            value={formData.latitude !== null ? String(formData.latitude) : ""}
            onValueChange={(v) =>
              updateForm({ latitude: v ? Number(v) : null })
            }
            radius="lg"
            variant="bordered"
          />
          <Input
            label="Longitude"
            type="number"
            placeholder="e.g. 120.9842"
            value={
              formData.longitude !== null ? String(formData.longitude) : ""
            }
            onValueChange={(v) =>
              updateForm({ longitude: v ? Number(v) : null })
            }
            radius="lg"
            variant="bordered"
          />
        </div>
      </div>
    </div>
  );
}