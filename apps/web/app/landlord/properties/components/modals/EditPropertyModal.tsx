"use client";

import { useState } from "react";
import dynamic from "next/dynamic";

import {
  Button, 
  Description,
  FieldError,
  Input, 
  Label,
  ListBox, 
  Modal, 
  Select,
  TextArea, 
  TextField,
  Separator,
} from "@heroui/react";

import { createBrowserClient } from "@repo/supabase";
import {
  ADVANCE_RENT_MONTH_OPTIONS,
  MIN_MONTHLY_RENT,
  SECURITY_DEPOSIT_MONTH_OPTIONS,
  formatPesoDisplay,
  formatPricingMonths,
  pricingAmountFromMonths,
  pricingMonthsFromAmount,
  validateApartmentPricing,
} from "@repo/utils";
import { toNullableNumber } from "@/service/landlordUnitDetailService";
import ErrorBanner from "@/app/components/display/ErrorBanner";

import AmenitiesSelect from "../../../../components/inputs/AmenitiesSelect";
import { PERKS } from "../../../../components/inputs/perks";

import {
  APARTMENT_TYPES, 
  FURNISHED_TYPES,
  FLOOR_LEVELS, 
  LEASE_DURATIONS,
  CAMANAVA_CITIES,
  isCamanavaCity,
  isCamanavaZipForCity,
} from "@repo/constants";

import type { Property } from "../propertyTypes";

const GoogleMapPicker = dynamic(() => import("../GoogleMapPicker"), { ssr: false });

function SectionTitle({ children }: { children: string }) {
  return <p className="text-xs font-medium text-primary uppercase">{children}</p>;
}

type EditErrorField =
  | "monthly_rent"
  | "security_deposit"
  | "advance_rent"
  | "street_address"
  | "barangay"
  | "city"
  | "zip_code"
  | "latitude";

type EditErrors = Partial<Record<EditErrorField, string>>;

function initialDepositMonths(property: Property): number | null {
  return pricingMonthsFromAmount(property.monthly_rent, property.security_deposit, SECURITY_DEPOSIT_MONTH_OPTIONS);
}

function initialAdvanceMonths(property: Property): number | null {
  return pricingMonthsFromAmount(property.monthly_rent, property.advance_rent, ADVANCE_RENT_MONTH_OPTIONS);
}

type Props = {
  isOpen: boolean;
  property: Property;
  onClose: () => void;
  onSaved: (updated: Property) => void;
};

export default function EditPropertyModal({ isOpen, property, onClose, onSaved }: Props) {
  const [form, setForm] = useState<Partial<Property>>({ ...property });
  const [depositMonths, setDepositMonths] = useState<number | null>(() => initialDepositMonths(property));
  const [advanceMonths, setAdvanceMonths] = useState<number | null>(() => initialAdvanceMonths(property));
  const [errors, setErrors] = useState<EditErrors>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const resetForm = () => {
    setForm({ ...property });
    setDepositMonths(initialDepositMonths(property));
    setAdvanceMonths(initialAdvanceMonths(property));
    setErrors({});
    setSaveError(null);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      resetForm();
      onClose();
    }
  };

  const clearError = (field: EditErrorField) => {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const updateForm = <K extends keyof Property>(key: K, value: Property[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    clearError(key as EditErrorField);
  };

  const monthlyRent = form.monthly_rent ?? 0;
  // Listings priced before the shared rule keep their amounts until the
  // landlord changes the rent or picks new options.
  const pricingChanged =
    monthlyRent !== property.monthly_rent ||
    depositMonths !== initialDepositMonths(property) ||
    advanceMonths !== initialAdvanceMonths(property);

  const validate = (): EditErrors => {
    const next: EditErrors = {};

    if (pricingChanged) {
      const pricingErrors = validateApartmentPricing({
        monthlyRent,
        securityDepositMonths: depositMonths,
        advanceRentMonths: advanceMonths,
      });
      if (pricingErrors.monthlyRent) next.monthly_rent = pricingErrors.monthlyRent;
      if (pricingErrors.securityDepositMonths) next.security_deposit = pricingErrors.securityDepositMonths;
      if (pricingErrors.advanceRentMonths) next.advance_rent = pricingErrors.advanceRentMonths;
    }

    const city = form.city ?? "";
    if (!form.street_address?.trim()) next.street_address = "Street address is required.";
    if (!form.barangay?.trim()) next.barangay = "Barangay is required.";
    if (!isCamanavaCity(city)) next.city = "Select a city within CAMANAVA.";
    if (form.zip_code == null) {
      next.zip_code = "Zip code is required.";
    } else if (isCamanavaCity(city) && !isCamanavaZipForCity(city, String(form.zip_code))) {
      next.zip_code = `Enter a valid ${city} zip code.`;
    }
    if (form.latitude == null || form.longitude == null) {
      next.latitude = "Please pin your property location on the map.";
    }

    return next;
  };

  const validatePinLocation = async (): Promise<string | null> => {
    const supabase = createBrowserClient();
    const { data, error } = await supabase.rpc("validate_camanava_location", {
      p_city: form.city!,
      p_latitude: form.latitude!,
      p_longitude: form.longitude!,
    });

    if (error) {
      console.error(error);
      return "We couldn't verify this pin. Please try again.";
    }
    return data ? null : `The map pin must be inside the selected CAMANAVA city (${form.city}).`;
  };

  const handleSave = async () => {
    setSaveError(null);
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSaving(true);
    try {
      const pinError = await validatePinLocation();
      if (pinError) {
        setErrors({ latitude: pinError });
        return;
      }

      const pricing = pricingChanged
        ? {
            monthly_rent: monthlyRent,
            security_deposit: pricingAmountFromMonths(monthlyRent, depositMonths ?? 0),
            advance_rent: pricingAmountFromMonths(monthlyRent, advanceMonths ?? 0),
          }
        : {};

      const supabase = createBrowserClient();
      const { error } = await supabase
        .from("apartments")
        .update({
          name: form.name ?? undefined,
          description: form.description ?? undefined,
          ...pricing,
          type: form.type ?? undefined,
          street_address: form.street_address ?? undefined,
          barangay: form.barangay ?? undefined,
          city: form.city ?? undefined,
          province: "Metro Manila",
          zip_code: form.zip_code ?? null,
          // Non-nullable in DB: fall back to the stored value when cleared.
          no_bedrooms: form.no_bedrooms ?? property.no_bedrooms ?? undefined,
          no_bathrooms: form.no_bathrooms ?? property.no_bathrooms ?? undefined,
          area_sqm: form.area_sqm ?? property.area_sqm ?? undefined,
          max_occupants: form.max_occupants ?? null,
          furnished_type: form.furnished_type ?? undefined,
          floor_level: form.floor_level ?? undefined,
          lease_duration: form.lease_duration ?? undefined,
          latitude: form.latitude ?? null,
          longitude: form.longitude ?? null,
          amenities: form.amenities ?? undefined,
        })
        .eq("id", property.id);

      if (error) {
        // Database rules (pricing, CAMANAVA) carry user-facing messages.
        console.error(error);
        setSaveError(error.message);
        return;
      }

      onSaved({ ...property, ...form, province: "Metro Manila", ...pricing } as Property);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal>
      <Modal.Backdrop isOpen={isOpen} onOpenChange={handleOpenChange}>
        <Modal.Container size="lg" scroll="inside">
          <Modal.Dialog>
            {({ close }) => (
              <>
                <Modal.CloseTrigger className="text-black" />
                
                <Modal.Header>
                  <Modal.Heading className="font-medium text-2xl p-1">
                    Edit Property
                  </Modal.Heading>
                </Modal.Header>

                <Modal.Body className="flex flex-col gap-5 p-1">
                  {/* Basic Info */}
                  <section>
                    <SectionTitle>Basic Info</SectionTitle>
                    <div className="flex flex-col gap-4">
                      <TextField>
                        <Label>
                          Name
                        </Label>

                        <Input
                          placeholder="Apartment name"
                          value={form.name ?? ""}
                          onChange={(e) => updateForm("name", e.target.value)}
                        />
                      </TextField>
                      <TextField>
                        <Label>
                          Description
                        </Label>

                        <TextArea
                          placeholder="Describe the unit..."
                          value={form.description ?? ""}
                          onChange={(e) => updateForm("description", e.target.value)}
                          rows={10}
                        />
                      </TextField>
                    </div>
                  </section>

                  <Separator />

                  {/* Price Details */}
                  <section>
                    <SectionTitle>
                      Price Details
                    </SectionTitle>

                    <div className="flex flex-col gap-3">
                      <TextField isInvalid={!!errors.monthly_rent}>
                        <Label>
                          Monthly Rent (₱)
                        </Label>

                        <Input
                          type="number"
                          min={MIN_MONTHLY_RENT}
                          value={String(form.monthly_rent ?? "")}
                          onChange={(e) => updateForm("monthly_rent", Number(e.target.value))}
                        />
                        <FieldError>{errors.monthly_rent}</FieldError>
                      </TextField>

                      {[
                        {
                          field: "security_deposit" as const,
                          label: "Security Deposit",
                          options: SECURITY_DEPOSIT_MONTH_OPTIONS,
                          value: depositMonths,
                          storedAmount: property.security_deposit,
                          onChange: setDepositMonths,
                        },
                        {
                          field: "advance_rent" as const,
                          label: "Advance Rent",
                          options: ADVANCE_RENT_MONTH_OPTIONS,
                          value: advanceMonths,
                          storedAmount: property.advance_rent,
                          onChange: setAdvanceMonths,
                        },
                      ].map(({ field, label, options, value, storedAmount, onChange }) => (
                        <Select
                          key={field}
                          placeholder="Select months"
                          value={value == null ? null : String(value)}
                          onChange={(selected) => {
                            onChange(selected == null ? null : Number(selected));
                            clearError(field);
                          }}
                          isInvalid={!!errors[field]}
                        >
                          <Label>{label}</Label>
                          <Select.Trigger className="cursor-pointer">
                            <Select.Value />
                            <Select.Indicator />
                          </Select.Trigger>
                          {value == null && (
                            <Description className="text-muted-foreground">
                              Current amount {formatPesoDisplay(storedAmount ?? 0)} isn&apos;t a whole month of rent. Choose an option when you update pricing.
                            </Description>
                          )}
                          <FieldError>{errors[field]}</FieldError>
                          <Select.Popover>
                            <ListBox>
                              {options.map((months) => (
                                <ListBox.Item key={months} id={String(months)} textValue={formatPricingMonths(months)} className="cursor-pointer">
                                  {formatPricingMonths(months)}
                                </ListBox.Item>
                              ))}
                            </ListBox>
                          </Select.Popover>
                        </Select>
                      ))}
                    </div>
                  </section>

                  {/* Unit Details */}
                  <section>
                    <SectionTitle>
                      Unit Details
                    </SectionTitle>

                    <div className="flex flex-col gap-3">
                      <Select 
                        value={form.type ?? null} 
                        onChange={(v) => updateForm("type", (v as string) ?? null)} 
                        placeholder="Select one"
                      >
                        <Label>
                          Type
                        </Label>

                        <Select.Trigger>
                          <Select.Value />
                          <Select.Indicator />
                        </Select.Trigger>
                        <Select.Popover>
                          <ListBox>
                            {APARTMENT_TYPES.map((t) => <ListBox.Item key={t} id={t}>{t}</ListBox.Item>)}
                          </ListBox>
                        </Select.Popover>
                      </Select>

                      <Select 
                        value={form.furnished_type ?? null} 
                        onChange={(v) => updateForm("furnished_type", (v as string) ?? null)} 
                        placeholder="Select one"
                      >
                        <Label>
                          Furnishing
                        </Label>
                        
                        <Select.Trigger>
                          <Select.Value />
                          <Select.Indicator />
                        </Select.Trigger>
                        <Select.Popover>
                          <ListBox>
                            {FURNISHED_TYPES.map((t) => <ListBox.Item key={t} id={t}>{t}</ListBox.Item>)}
                          </ListBox>
                        </Select.Popover>
                      </Select>

                      <Select 
                        value={form.floor_level ?? null} 
                        onChange={(v) => updateForm("floor_level", (v as string) ?? null)} 
                        placeholder="Select one"
                      >
                        <Label>
                          Floor Level
                        </Label>

                        <Select.Trigger>
                          <Select.Value />
                          <Select.Indicator />
                        </Select.Trigger>

                        <Select.Popover>
                          <ListBox>
                            {FLOOR_LEVELS.map((l) => <ListBox.Item key={l} id={l}>{l}</ListBox.Item>)}
                          </ListBox>
                        </Select.Popover>
                      </Select>

                      <Select 
                        value={form.lease_duration ?? null} 
                        onChange={(v) => updateForm("lease_duration", (v as string) ?? null)} 
                        placeholder="Select one"
                      >
                        <Label>
                          Lease Duration
                        </Label>

                        <Select.Trigger>
                          <Select.Value />
                          <Select.Indicator />
                        </Select.Trigger>

                        <Select.Popover>
                          <ListBox>
                            {LEASE_DURATIONS.map((d) => <ListBox.Item key={d} id={d}>{d}</ListBox.Item>)}
                          </ListBox>
                        </Select.Popover>
                      </Select>

                      <TextField>
                        <Label>
                          Bedrooms
                        </Label>

                        <Input 
                          type="number" 
                          value={form.no_bedrooms == null ? "" : String(form.no_bedrooms)} 
                          onChange={(e) => updateForm("no_bedrooms", toNullableNumber(e.target.value))} 
                        />
                      </TextField>

                      <TextField>
                        <Label>
                          Bathrooms
                        </Label>
                        <Input 
                          type="number" 
                          value={form.no_bathrooms == null ? "" : String(form.no_bathrooms)} 
                          onChange={(e) => updateForm("no_bathrooms", toNullableNumber(e.target.value))} 
                        />
                      </TextField>

                      <TextField>
                        <Label>
                          Area (sqm)
                        </Label>
                        <Input 
                          type="number" 
                          value={form.area_sqm == null ? "" : String(form.area_sqm)} 
                          onChange={(e) => updateForm("area_sqm", toNullableNumber(e.target.value))} 
                        />
                      </TextField>

                      <TextField>
                        <Label>
                          Max Occupants
                        </Label>
                        <Input 
                          type="number" 
                          value={form.max_occupants == null ? "" : String(form.max_occupants)} 
                          onChange={(e) => updateForm("max_occupants", toNullableNumber(e.target.value))} 
                        />
                      </TextField>
                    </div>
                  </section>

                  {/* Address */}
                  <section>
                    <SectionTitle>
                      Address
                    </SectionTitle>

                    <div className="flex flex-col gap-3">
                      <Select
                        value={form.city ?? null}
                        onChange={(city) => {
                          updateForm("city", (city as string) ?? null);
                          updateForm("province", "Metro Manila");
                          clearError("latitude");
                        }}
                        placeholder="Select CAMANAVA city"
                        isInvalid={!!errors.city}
                      >
                        <Label>
                          City
                        </Label>
                        <Select.Trigger>
                          <Select.Value />
                          <Select.Indicator />
                        </Select.Trigger>
                        <FieldError>{errors.city}</FieldError>
                        <Select.Popover>
                          <ListBox>
                            {CAMANAVA_CITIES.map((city) => (
                              <ListBox.Item key={city} id={city}>{city}</ListBox.Item>
                            ))}
                          </ListBox>
                        </Select.Popover>
                      </Select>

                      <TextField isDisabled>
                        <Label>Province</Label>
                        <Input value="Metro Manila" />
                      </TextField>

                      <TextField isInvalid={!!errors.barangay}>
                        <Label>
                          Barangay
                        </Label>
                        <Input 
                          value={form.barangay ?? ""} 
                          onChange={(e) => updateForm("barangay", e.target.value)} 
                        />
                        <FieldError>{errors.barangay}</FieldError>
                      </TextField>

                      <TextField isInvalid={!!errors.street_address}>
                        <Label>
                          Street Address
                        </Label>
                        <Input 
                          value={form.street_address ?? ""} 
                          onChange={(e) => updateForm("street_address", e.target.value)} 
                        />
                        <FieldError>{errors.street_address}</FieldError>
                      </TextField>

                      <TextField isInvalid={!!errors.zip_code}>
                        <Label>
                          Zip Code
                        </Label>
                        <Input 
                          inputMode="numeric"
                          maxLength={4}
                          value={form.zip_code == null ? "" : String(form.zip_code)} 
                          onChange={(e) => updateForm("zip_code", toNullableNumber(e.target.value.replace(/\D/g, "")))} 
                        />
                        <FieldError>{errors.zip_code}</FieldError>
                      </TextField>
                    </div>
                  </section>

                  {/* Coordinates */}
                  <section>
                    <SectionTitle>Location</SectionTitle>
                    <div className="flex flex-col gap-3">
                      <TextField isInvalid={!!errors.latitude}>
                        <Label>Latitude</Label>
                        <Input 
                          type="number" 
                          value={form.latitude == null ? "" : String(form.latitude)} 
                          onChange={(e) => updateForm("latitude", toNullableNumber(e.target.value))} 
                        />
                      </TextField>
                      <TextField>
                        <Label>Longitude</Label>
                        <Input 
                          type="number" 
                          value={form.longitude == null ? "" : String(form.longitude)} 
                          onChange={(e) => updateForm("longitude", toNullableNumber(e.target.value))} 
                        />
                      </TextField>
                      <GoogleMapPicker
                        latitude={form.latitude ?? null}
                        longitude={form.longitude ?? null}
                        onPick={(lat, lng) => {
                          setForm((prev) => ({ ...prev, latitude: lat, longitude: lng }));
                          clearError("latitude");
                        }}
                      />
                      {errors.latitude && (
                        <p role="alert" className="text-danger text-xs">{errors.latitude}</p>
                      )}
                    </div>
                  </section>

                  {/* Amenities */}
                  <section>
                    <SectionTitle>Amenities</SectionTitle>
                    <AmenitiesSelect
                      amenities={Object.values(PERKS)}
                      selected={form.amenities ?? []}
                      onChange={(val: string[]) => updateForm("amenities", val)}
                    />
                  </section>
                  {saveError && <ErrorBanner message={saveError} />}
                </Modal.Body>

                <Modal.Footer>
                  <Button 
                    variant="danger-soft" 
                    onPress={() => { 
                      close(); 
                      resetForm(); 
                    }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    isPending={saving} 
                    onPress={handleSave}
                  >
                    Save Changes
                  </Button>
                </Modal.Footer>
              </>
            )}
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
