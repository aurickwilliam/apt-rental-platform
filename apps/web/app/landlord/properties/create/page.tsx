"use client";

import { useCallback, useState } from "react";
import { Button } from "@heroui/react";
import { useRouter } from "next/navigation";
import { createClient } from "@repo/supabase/browser";
import { useUser } from "@/hooks/use-user";
import { CheckCircle, ArrowLeft } from "lucide-react";


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
  security_deposit: number;
  advance_rent: number;
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
  security_deposit: 0,
  advance_rent: 0,
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

export default function CreateApartmentPage() {
  const { profile } = useUser();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<ApartmentFormData>(INITIAL_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  const handleNext = () => {
    const stepErrors = validateStep(step, formData);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }
    setErrors({});
    setStep((s) => Math.min(s + 1, 5));
  };

  const handleBack = () => setStep((s) => Math.max(s - 1, 1));

  const handleSubmit = async () => {
    // Check any errors before submitting
    const stepErrors = validateStep(4, formData);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }
    setIsSubmitting(true);

    try {
      const supabase = createClient();

      // 1. Insert apartment record
      const { data: apartment, error: aptError } = await supabase
        .from("apartments")
        .insert({
          landlord_id: profile?.id,
          name: formData.name,
          description: formData.description,
          monthly_rent: formData.monthly_rent,
          security_deposit: formData.security_deposit,
          advance_rent: formData.advance_rent,
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

      // 2. Upload images — roll back apartment if this fails
      try {
        const allImages: { file: File; isCover: boolean }[] = [
          ...(formData.thumbnail ? [{ file: formData.thumbnail, isCover: true }] : []),
          ...formData.additionalPhotos.map((f) => ({ file: f, isCover: false })),
        ];

        if (allImages.length > 0) {
          const imageRows: { apartment_id: string; url: string; is_cover: boolean }[] = [];

          for (const { file, isCover } of allImages) {
            const ext = file.name.split(".").pop();
            const path = `${apartment.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

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
      } catch (imgErr) {
        // Roll back: delete the apartment so no orphaned records are left
        await supabase.from("apartments").delete().eq("id", apartment.id);
        throw imgErr;
      }

      router.push("/landlord/properties");
      router.refresh();
    } catch (err) {
      console.error(err);
      alert("Something went wrong. Please try again.");
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
      if (!data.type) errors.type = "Apartment type is required.";
      if (!data.furnished_type) errors.furnished_type = "Furnished type is required.";
      if (!data.floor_level) errors.floor_level = "Floor level is required.";
      if (!data.lease_duration) errors.lease_duration = "Lease duration is required.";
      if (data.area_sqm <= 0) errors.area_sqm = "Must be greater than 0.";
      if (data.max_occupants <= 0) errors.max_occupants = "Must be greater than 0.";
      if (!data.street_address.trim()) errors.street_address = "Street address is required.";
      if (!data.barangay.trim()) errors.barangay = "Barangay is required.";
      if (!data.city.trim()) errors.city = "City is required.";
      if (!data.province.trim()) errors.province = "Province is required.";
      if (!data.zip_code.trim()) errors.zip_code = "Zip code is required.";
      
      if (!data.latitude || !data.longitude) {
        errors.latitude = "Please pin your property location on the map.";
      } else if (!data.isPinConfirmed) {
        errors.isPinConfirmed = "Please confirm your pinned location.";
      }
    }

    if (step === 3) {
      if (data.monthly_rent <= 0) errors.monthly_rent = "Monthly rent must be greater than 0.";
      if (data.security_deposit < 0) errors.security_deposit = "Cannot be negative.";
      if (data.advance_rent < 0) errors.advance_rent = "Cannot be negative.";
    }

    if (step === 4) {
      if (!data.description.trim()) errors.description = "Description is required.";
      if (data.amenities.length === 0) errors.amenities = "Select at least one amenity.";
    }

    return errors;
  };

  return (
    <div className="min-h-screen bg-white">
      <div>
        <Button
          onPress={router.back}
          radius="full"
          variant="light"
        >
          <ArrowLeft size={20} />
          Back
        </Button>
      </div>

      {/* Top progress bar */}
      <div className="sticky top-0 z-50 bg-white border-b border-grey-200 px-6 py-4">
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
                      className={`flex-1 h-0.5 transition-colors ${i === 0 ? "invisible" : isDone || isActive ? "bg-primary" : "bg-grey-200"}`}
                    />

                    {/* circle */}
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 transition-all ${
                        isDone
                          ? "bg-primary text-white"
                          : isActive
                          ? "bg-primary text-white ring-4 ring-primary/20"
                          : "bg-grey-100 text-grey-400"
                      }`}
                    >
                      {isDone ? <CheckCircle size={16} /> : num}
                    </div>
                    {/* line after */}
                    <div
                      className={`flex-1 h-0.5 transition-colors ${i === STEPS.length - 1 ? "invisible" : isDone ? "bg-primary" : "bg-grey-200"}`}
                    />
                  </div>

                  <span
                    className={`text-xs hidden sm:block text-center transition-colors ${
                      isActive ? "text-primary font-medium" : isDone ? "text-primary/60" : "text-grey-400"
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
          <div className="flex justify-between mt-10 pt-6 border-t border-grey-200">
            <Button
              variant="flat"
              radius="full"
              onPress={handleBack}
              isDisabled={step === 1}
              className="px-6"
            >
              Back
            </Button>
            {step < 5 ? (
              <Button
                variant="solid"
                color="primary"
                radius="full"
                onPress={handleNext}
                className="px-8"
              >
                Continue
              </Button>
            ) : (
              <Button
                variant="solid"
                color="primary"
                radius="full"
                onPress={handleSubmit}
                isLoading={isSubmitting}
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
