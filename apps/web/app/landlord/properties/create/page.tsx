"use client";

import { useCallback, useState } from "react";
import { Button } from "@heroui/react";
import { useRouter } from "next/navigation";
import { createClient } from "@repo/supabase/browser";
import { APARTMENT_FLOOR_AREA, APARTMENT_ROOM_LIMITS, isCamanavaCity } from "@repo/constants";
import { useUser } from "@/hooks/use-user";
import { IconArrowLeft, IconCircleCheck } from "@tabler/icons-react";


import Step1Photos from "./components/Step1Photos";
import Step2Info from "./components/Step2Info";
import Step3Pricing from "./components/Step3Pricing";
import Step4Description from "./components/Step4Description";
import Step5Preview from "./components/Step5Preview";

export type ApartmentFormData = {
  // Step 1
  name: string;
  thumbnail: File | null;
  additionalPhotos: File[];
  // Step 2
  type: string;
  furnished_type: string;
  no_bedrooms: number;
  no_bathrooms: number;
  area_sqm: number;
  max_occupants: number;
  floor_level: string;
  lease_duration: string;
  street_address: string;
  barangay: string;
  city: string;
  province: string;
  zip_code: string;
  latitude: number | null;
  longitude: number | null;
  isPinConfirmed: boolean;
  // Step 3
  monthly_rent: number;
  security_deposit_months: number;
  advance_rent_months: number;
  lease_agreement: File | null;
  // Step 4
  description: string;
  amenities: string[];
};

const INITIAL_FORM: ApartmentFormData = {
  name: "",
  thumbnail: null,
  additionalPhotos: [],
  type: "",
  furnished_type: "",
  no_bedrooms: 1,
  no_bathrooms: 1,
  area_sqm: 0,
  max_occupants: 1,
  floor_level: "",
  lease_duration: "",
  street_address: "",
  barangay: "",
  city: "",
  province: "",
  zip_code: "",
  latitude: null,
  longitude: null,
  isPinConfirmed: false,
  monthly_rent: 0,
  security_deposit_months: 0,
  advance_rent_months: 0,
  lease_agreement: null,
  description: "",
  amenities: [],
};

const STEPS = [
  { label: "Photos & Title", short: "Photos" },
  { label: "Apartment Info", short: "Info" },
  { label: "Pricing", short: "Pricing" },
  { label: "Description & Amenities", short: "Details" },
  { label: "Preview", short: "Preview" },
];

export type FormErrors = Partial<Record<keyof ApartmentFormData, string>>;

/** Minimum monthly rent in pesos. */
export const MIN_MONTHLY_RENT = 1000;

/** `{apartmentId}/{timestamp}-{random}.{ext}`: unique per upload, never reused. */
function uniqueStoragePath(apartmentId: string, fileName: string): string {
  const ext = fileName.split(".").pop();
  return `${apartmentId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
}

export default function CreateApartmentPage() {
  const { profile } = useUser();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<ApartmentFormData>(INITIAL_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValidatingLocation, setIsValidatingLocation] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const router = useRouter();

  const updateForm = useCallback((updates: Partial<ApartmentFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
    setErrors((prev) => {
      const next = { ...prev };
      Object.keys(updates).forEach((key) => delete next[key as keyof ApartmentFormData]);
      return next;
    });
  }, []);

  const validateLocationBeforeContinue = async (): Promise<FormErrors> => {
    const supabase = createClient();
    const { data, error } = await supabase.rpc("validate_camanava_location", {
      p_city: formData.city,
      p_latitude: formData.latitude!,
      p_longitude: formData.longitude!,
    });

    if (error) {
      console.error(error);
      return { latitude: "We couldn't verify this pin. Please try again." };
    }

    return data
      ? {}
      : { latitude: `The map pin must be inside the selected CAMANAVA city (${formData.city}).` };
  };

  const handleNext = async () => {
    const stepErrors = validateStep(step, formData);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }

    if (step === 2) {
      setIsValidatingLocation(true);
      try {
        const locationErrors = await validateLocationBeforeContinue();
        if (Object.keys(locationErrors).length > 0) {
          setErrors(locationErrors);
          return;
        }
      } finally {
        setIsValidatingLocation(false);
      }
    }

    setErrors({});
    setStep((s) => Math.min(s + 1, 5));
  };

  const handleBack = () => setStep((s) => Math.max(s - 1, 1));

  const handleSubmit = async () => {
    // Check any errors before submitting
    const stepErrors = {
      ...validateStep(2, formData),
      ...validateStep(3, formData),
      ...validateStep(4, formData),
    };
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }
    setIsSubmitting(true);

    try {
      const supabase = createClient();

      // Insert apartment record first
      const { data: apartment, error: aptError } = await supabase
        .from("apartments")
        .insert({
          landlord_id: profile?.id,
          name: formData.name,
          description: formData.description,
          monthly_rent: formData.monthly_rent,
          security_deposit: formData.security_deposit_months * formData.monthly_rent,
          advance_rent: formData.advance_rent_months * formData.monthly_rent,
          type: formData.type,
          street_address: formData.street_address,
          barangay: formData.barangay,
          city: formData.city,
          province: formData.province,
          zip_code: Number(formData.zip_code),
          no_bedrooms: formData.no_bedrooms,
          no_bathrooms: formData.no_bathrooms,
          area_sqm: Number(formData.area_sqm),
          max_occupants: formData.max_occupants,
          furnished_type: formData.furnished_type,
          floor_level: formData.floor_level,
          lease_duration: formData.lease_duration,
          latitude: formData.latitude,
          longitude: formData.longitude,
          amenities: formData.amenities,
          status: "unverified",
        })
        .select()
        .single();

      if (aptError || !apartment) throw aptError;


      // Upload lease agreement and images
      // then update apartment record with lease agreement URL and image URLs
      let leaseAgreementPath: string | null = null;

      try {
        if (formData.lease_agreement) {
          const file = formData.lease_agreement;
          const path = uniqueStoragePath(apartment.id, file.name);

          const { error: leaseUploadError } = await supabase.storage
            .from("lease-agreements")
            .upload(path, file);

          if (leaseUploadError) throw leaseUploadError;

          leaseAgreementPath = path;
        }

        if (leaseAgreementPath) {
          const { error: patchError } = await supabase
            .from("apartments")
            .update({ lease_agreement_url: leaseAgreementPath })
            .eq("id", apartment.id);

          if (patchError) throw patchError;
        }

        const allImages: { file: File; isCover: boolean }[] = [
          ...(formData.thumbnail ? [{ file: formData.thumbnail, isCover: true }] : []),
          ...formData.additionalPhotos.map((f) => ({ file: f, isCover: false })),
        ];

        if (allImages.length > 0) {
          const imageRows: { apartment_id: string; url: string; is_cover: boolean }[] = [];

          for (const { file, isCover } of allImages) {
            const path = uniqueStoragePath(apartment.id, file.name);

            const { error: uploadError } = await supabase.storage
              .from("apartment-images")
              .upload(path, file);

            if (uploadError) throw uploadError;

            const { data: urlData } = supabase.storage
              .from("apartment-images")
              .getPublicUrl(path);

            imageRows.push({
              apartment_id: apartment.id,
              url: urlData.publicUrl,
              is_cover: isCover,
            });
          }

          const { error: imgError } = await supabase
            .from("apartment_images")
            .insert(imageRows);

          if (imgError) throw imgError;
        }
      } catch (uploadErr) {
        // Clean up storage files if any were uploaded
        if (leaseAgreementPath) {
          await supabase.storage.from("lease-agreements").remove([leaseAgreementPath]);
        }
        // Roll back apartment row
        await supabase.from("apartments").delete().eq("id", apartment.id);
        throw uploadErr;
      }

      router.push("/landlord/properties");
      router.refresh();
    } catch (err) {
      console.error(err);
      alert(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const validateStep = (step: number, data: ApartmentFormData): FormErrors => {
    const errors: FormErrors = {};

    if (step === 1) {
      if (!data.name.trim()) errors.name = "Apartment name is required.";
      if (!data.thumbnail) errors.thumbnail = "A cover photo is required.";
      if (data.additionalPhotos.length < 3) errors.additionalPhotos = "At least 3 additional photos are required.";
    }

    if (step === 2) {
      const roomLimits = APARTMENT_ROOM_LIMITS[data.type];
      const areaLimits = APARTMENT_FLOOR_AREA[data.type];

      if (!data.type) errors.type = "Apartment type is required.";
      if (!data.furnished_type) errors.furnished_type = "Furnished type is required.";
      if (!data.floor_level) errors.floor_level = "Floor level is required.";
      if (!data.lease_duration) errors.lease_duration = "Lease duration is required.";
      if (data.area_sqm <= 0) {
        errors.area_sqm = "Must be greater than 0.";
      } else if (areaLimits && (data.area_sqm < areaLimits.min || data.area_sqm > areaLimits.max)) {
        errors.area_sqm = `Floor area must be between ${areaLimits.min} and ${areaLimits.max} sqm.`;
      }
      if (data.max_occupants <= 0) {
        errors.max_occupants = "Must be greater than 0.";
      } else if (roomLimits && (data.max_occupants < roomLimits.maxOccupants.min || data.max_occupants > roomLimits.maxOccupants.max)) {
        errors.max_occupants = `Max occupants must be between ${roomLimits.maxOccupants.min} and ${roomLimits.maxOccupants.max}.`;
      }
      if (roomLimits && (data.no_bedrooms < roomLimits.bedrooms.min || data.no_bedrooms > roomLimits.bedrooms.max)) {
        errors.no_bedrooms = `Bedrooms must be between ${roomLimits.bedrooms.min} and ${roomLimits.bedrooms.max}.`;
      }
      if (roomLimits && (data.no_bathrooms < roomLimits.bathrooms.min || data.no_bathrooms > roomLimits.bathrooms.max)) {
        errors.no_bathrooms = `Bathrooms must be between ${roomLimits.bathrooms.min} and ${roomLimits.bathrooms.max}.`;
      }
      if (!data.street_address.trim()) errors.street_address = "Street address is required.";
      if (!data.barangay.trim()) errors.barangay = "Barangay is required.";
      if (!isCamanavaCity(data.city)) errors.city = "Select a city within CAMANAVA.";
      if (data.province !== "Metro Manila") errors.province = "Properties can only be listed in Metro Manila.";
      if (!data.zip_code.trim()) errors.zip_code = "Zip code is required.";
      
      if (!data.latitude || !data.longitude) {
        errors.latitude = "Please pin your property location on the map.";
      } else if (!data.isPinConfirmed) {
        errors.isPinConfirmed = "Please confirm your pinned location.";
      }
    }

    if (step === 3) {
      if (data.monthly_rent < MIN_MONTHLY_RENT) errors.monthly_rent = `Monthly rent must be at least ₱${MIN_MONTHLY_RENT.toLocaleString()}.`;
      if (![0, 1, 2].includes(data.security_deposit_months)) errors.security_deposit_months = "Security deposit must be none, 1 month, or 2 months.";
      if (![0, 1].includes(data.advance_rent_months)) errors.advance_rent_months = "Advance rent can be at most 1 month.";
      if (!data.lease_agreement) errors.lease_agreement = "Lease agreement document is required.";
    }

    if (step === 4) {
      if (!data.description.trim()) errors.description = "Description is required.";
      if (data.amenities.length === 0) errors.amenities = "Select at least one amenity.";
    }

    return errors;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto py-6">
        <Button
          onPress={router.back}
          variant="outline"
        >
          <IconArrowLeft size={20} />
          Back
        </Button>
      </div>

      {/* Top progress bar */}
      <div className="sticky top-0 z-50 bg-background border-b border-border px-6 py-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            {STEPS.map((s, i) => {

              const num = i + 1;
              const isActive = step === num;
              const isDone = step > num;

              return (
                <div key={i} className="flex flex-col items-center gap-1.5 flex-1">
                  <div className="flex items-center w-full">
                    {/* line before */}
                    <div
                      className={`flex-1 h-0.5 transition-colors ${i === 0 ? "invisible" : isDone || isActive ? "bg-primary" : "bg-border"}`}
                    />

                    {/* circle */}
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 transition-all ${
                        isDone
                          ? "bg-primary text-white"
                          : isActive
                          ? "bg-primary text-white ring-4 ring-primary/20"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {isDone ? <IconCircleCheck size={16} /> : num}
                    </div>
                    {/* line after */}
                    <div
                      className={`flex-1 h-0.5 transition-colors ${i === STEPS.length - 1 ? "invisible" : isDone ? "bg-primary" : "bg-border"}`}
                    />
                  </div>

                  <span
                    className={`text-xs hidden sm:block text-center transition-colors ${
                      isActive ? "text-primary font-medium" : isDone ? "text-primary/60" : "text-muted-foreground"
                    }`}
                  >
                    {s.short}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Step content */}
      <div className="px-6 py-8">
        {step === 5 && <Step5Preview formData={formData} />}

        <div className="max-w-3xl mx-auto">
          {step === 1 && <Step1Photos formData={formData} updateForm={updateForm} errors={errors} />}
          {step === 2 && <Step2Info formData={formData} updateForm={updateForm} errors={errors} />}
          {step === 3 && <Step3Pricing formData={formData} updateForm={updateForm} errors={errors} />}
          {step === 4 && <Step4Description formData={formData} updateForm={updateForm} errors={errors} />}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-10 pt-6 border-t border-border">
            <Button
              variant="tertiary"
              onPress={handleBack}
              isDisabled={step === 1}
              className="px-6"
            >
              Back
            </Button>
            {step < 5 ? (
              <Button
                onPress={handleNext}
                isPending={step === 2 && isValidatingLocation}
                isDisabled={isValidatingLocation}
                className="px-8"
              >
                Continue
              </Button>
            ) : (
              <Button
                onPress={handleSubmit}
                isPending={isSubmitting}
                className="px-8"
              >
                Submit Listing
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
