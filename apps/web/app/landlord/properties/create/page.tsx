"use client";

import { useCallback, useState } from "react";
import { Button, Modal } from "@heroui/react";
import { useRouter } from "next/navigation";
import { createClient } from "@repo/supabase/browser";
import {
  APARTMENT_FLOOR_AREA,
  APARTMENT_ROOM_LIMITS,
  isCamanavaCity,
  isCamanavaZipForCity,
  getBarangaysByCity,
  getDescriptionError,
} from "@repo/constants";
import {
  pricingAmountFromMonths,
  validateApartmentPricing,
} from "@repo/utils";
import { useUser } from "@/hooks/use-user";
import { APARTMENT_IMAGES_BUCKET, uploadApartmentImage } from "@/lib/apartment-image-upload";
import { IconCircleCheck } from "@tabler/icons-react";


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
  rent_due_day: number;
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
  // React Aria NumberField uses NaN for an empty controlled number input.
  // Shared pricing validation rejects it before advancing or submitting.
  monthly_rent: Number.NaN,
  rent_due_day: Number.NaN,
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

/** `{apartmentId}/{timestamp}-{random}.{ext}`: unique per upload, never reused. */
function uniqueStoragePath(apartmentId: string, fileName: string): string {
  const ext = fileName.split(".").pop();
  return `${apartmentId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
}

export default function CreateApartmentPage() {
  const { profile } = useUser();
  const [step, setStep] = useState(1);
  const [furthestStep, setFurthestStep] = useState(1);
  const [formData, setFormData] = useState<ApartmentFormData>(INITIAL_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
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

  const validateBeforeContinue = async (): Promise<boolean> => {
    const stepErrors = validateStep(step, formData);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return false;
    }

    if (step === 2) {
      setIsValidatingLocation(true);
      try {
        const locationErrors = await validateLocationBeforeContinue();
        if (Object.keys(locationErrors).length > 0) {
          setErrors(locationErrors);
          return false;
        }
      } finally {
        setIsValidatingLocation(false);
      }
    }

    setErrors({});
    return true;
  };

  const handleNext = async () => {
    if (isValidatingLocation || isSubmitting || !(await validateBeforeContinue())) return;

    const nextStep = Math.min(step + 1, STEPS.length);
    setFurthestStep((previous) => Math.max(previous, nextStep));
    setStep(nextStep);
  };

  const handleStepSelect = async (target: number) => {
    if (target === step || target > furthestStep || isValidatingLocation || isSubmitting) return;
    if (target > step && !(await validateBeforeContinue())) return;

    setErrors({});
    setStep(target);
  };

  const handleBack = () => setStep((s) => Math.max(s - 1, 1));

  const handleDiscard = () => {
    setFormData(INITIAL_FORM);
    setErrors({});
    setStep(1);
    setFurthestStep(1);
    setIsCancelOpen(false);
    router.replace("/landlord/properties");
  };

  const handleSubmitClick = () => {
    // Validate everything before asking for confirmation; jump to the
    // first step that needs attention.
    for (const stepNumber of [1, 2, 3, 4]) {
      const stepErrors = validateStep(stepNumber, formData);
      if (Object.keys(stepErrors).length > 0) {
        setErrors(stepErrors);
        setStep(stepNumber);
        return;
      }
    }
    setErrors({});
    setIsConfirmOpen(true);
  };

  const handleSubmit = async () => {
    // Check any errors before submitting
    const stepErrors = {
      ...validateStep(1, formData),
      ...validateStep(2, formData),
      ...validateStep(3, formData),
      ...validateStep(4, formData),
    };
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      setIsConfirmOpen(false);
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
          rent_due_day: formData.rent_due_day,
          security_deposit: pricingAmountFromMonths(formData.monthly_rent, formData.security_deposit_months),
          advance_rent: pricingAmountFromMonths(formData.monthly_rent, formData.advance_rent_months),
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
        })
        .select()
        .single();

      if (aptError || !apartment) throw aptError;


      // Upload lease agreement and images
      // then update apartment record with lease agreement URL and image URLs
      let leaseAgreementPath: string | null = null;
      const uploadedImagePaths: string[] = [];

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
          const imageRows: { apartment_id: string; url: string; url_thumb: string; is_cover: boolean }[] = [];

          for (const { file, isCover } of allImages) {
            const uploaded = await uploadApartmentImage(supabase, apartment.id, file);
            uploadedImagePaths.push(...uploaded.paths);

            imageRows.push({
              apartment_id: apartment.id,
              url: uploaded.url,
              url_thumb: uploaded.url_thumb,
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
        if (uploadedImagePaths.length > 0) {
          await supabase.storage.from(APARTMENT_IMAGES_BUCKET).remove(uploadedImagePaths);
        }
        // Roll back apartment row
        await supabase.from("apartments").delete().eq("id", apartment.id);
        throw uploadErr;
      }

      router.push("/landlord/properties");
      router.refresh();
    } catch (err) {
      console.error(err);
      setIsConfirmOpen(false);
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
      if (!data.barangay.trim()) {
        errors.barangay = "Barangay is required.";
      } else if (isCamanavaCity(data.city) && !getBarangaysByCity(data.city).includes(data.barangay)) {
        errors.barangay = `Select a barangay of ${data.city}.`;
      }
      if (!isCamanavaCity(data.city)) errors.city = "Select a city within CAMANAVA.";
      if (data.province !== "Metro Manila") errors.province = "Properties can only be listed in Metro Manila.";
      if (!data.zip_code.trim()) {
        errors.zip_code = "Zip code is required.";
      } else if (isCamanavaCity(data.city) && !isCamanavaZipForCity(data.city, data.zip_code)) {
        errors.zip_code = `Enter a valid ${data.city} zip code.`;
      }
      
      if (!data.latitude || !data.longitude) {
        errors.latitude = "Please pin your property location on the map.";
      } else if (!data.isPinConfirmed) {
        errors.isPinConfirmed = "Please confirm your pinned location.";
      }
    }

    if (step === 3) {
      const pricingErrors = validateApartmentPricing({
        monthlyRent: data.monthly_rent,
        securityDepositMonths: data.security_deposit_months,
        advanceRentMonths: data.advance_rent_months,
        rentDueDay: data.rent_due_day,
      });
      if (pricingErrors.monthlyRent) errors.monthly_rent = pricingErrors.monthlyRent;
      if (pricingErrors.rentDueDay) errors.rent_due_day = pricingErrors.rentDueDay;
      if (pricingErrors.securityDepositMonths) errors.security_deposit_months = pricingErrors.securityDepositMonths;
      if (pricingErrors.advanceRentMonths) errors.advance_rent_months = pricingErrors.advanceRentMonths;
      if (!data.lease_agreement) errors.lease_agreement = "Lease agreement document is required.";
    }

    if (step === 4) {
      const descriptionError = getDescriptionError(data.description);
      if (descriptionError) errors.description = descriptionError;
      if (data.amenities.length === 0) errors.amenities = "Select at least one amenity.";
    }

    return errors;
  };

  return (
    <div className="create-listing-flow min-h-screen bg-background">
      {/* Top progress bar */}
      <nav aria-label="Listing progress" className="sticky top-14 md:top-0 z-30 bg-background border-b border-border px-6 py-4">
        <div>
          <ol className="flex items-center justify-between">
            {STEPS.map((s, i) => {

              const num = i + 1;
              const isActive = step === num;
              const isDone = step > num;

              return (
                <li key={s.short} className="relative flex-1 min-w-0">
                  <div aria-hidden="true" className="absolute inset-x-0 top-6 -translate-y-1/2 flex items-center pointer-events-none">
                    {/* line before */}
                    <div
                      className={`flex-1 h-0.5 transition-colors ${i === 0 ? "invisible" : isDone || isActive ? "bg-primary" : "bg-border"}`}
                    />

                    <div className="w-8 shrink-0" />
                    {/* line after */}
                    <div
                      className={`flex-1 h-0.5 transition-colors ${i === STEPS.length - 1 ? "invisible" : isDone ? "bg-primary" : "bg-border"}`}
                    />
                  </div>

                  <Button
                    variant="ghost"
                    className="create-listing-step"
                    aria-label={`Step ${num}: ${s.label}`}
                    aria-current={isActive ? "step" : undefined}
                    isDisabled={num > furthestStep || isValidatingLocation || isSubmitting}
                    onPress={() => handleStepSelect(num)}
                  >
                    <span
                      aria-hidden="true"
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 transition-all ${
                        isDone
                          ? "bg-primary text-white"
                          : isActive
                          ? "bg-primary text-white ring-4 ring-primary/20"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {isDone ? <IconCircleCheck size={16} /> : num}
                    </span>

                    <span
                      className={`text-xs hidden sm:block text-center transition-colors ${
                        isActive ? "text-primary font-medium" : isDone ? "text-primary/60" : "text-muted-foreground"
                      }`}
                    >
                      {s.short}
                    </span>
                  </Button>
                </li>
              );
            })}
          </ol>
        </div>
      </nav>

      {/* Step content */}
      <div className="px-6 py-8">
        {step === 5 && (
          <div className="w-full">
            <Step5Preview formData={formData} landlord={profile} />
          </div>
        )}

        <div className="max-w-3xl mx-auto">
          {step === 1 && <Step1Photos formData={formData} updateForm={updateForm} errors={errors} />}
          {step === 2 && <Step2Info formData={formData} updateForm={updateForm} errors={errors} />}
          {step === 3 && <Step3Pricing formData={formData} updateForm={updateForm} errors={errors} />}
          {step === 4 && <Step4Description formData={formData} updateForm={updateForm} errors={errors} />}

          {/* Navigation Buttons */}
          <div className="create-listing-actions flex justify-between gap-4 mt-10 pt-6 border-t border-border">
            <Button
              variant={step === 1 ? "danger-soft" : "tertiary"}
              onPress={step === 1 ? () => setIsCancelOpen(true) : handleBack}
              isDisabled={isValidatingLocation || isSubmitting}
            >
              {step === 1 ? "Cancel" : "Back"}
            </Button>
            {step < 5 ? (
              <Button
                onPress={handleNext}
                isPending={step === 2 && isValidatingLocation}
                isDisabled={isValidatingLocation}
              >
                Continue
              </Button>
            ) : (
              <Button
                onPress={handleSubmitClick}
              >
                Submit Listing
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Discard confirmation */}
      <Modal>
        <Modal.Backdrop isOpen={isCancelOpen} onOpenChange={setIsCancelOpen}>
          <Modal.Container size="sm">
            <Modal.Dialog className="create-listing-flow">
              {({ close }) => (
                <>
                  <Modal.Header>
                    <Modal.Heading className="font-medium text-xl">
                      Discard listing?
                    </Modal.Heading>
                  </Modal.Header>
                  <Modal.Body>
                    <p className="text-sm text-muted-foreground">
                      Your progress and selected photos will be discarded.
                    </p>
                  </Modal.Body>
                  <Modal.Footer className="flex gap-2">
                    <Button autoFocus variant="tertiary" onPress={close} className="flex-1">
                      Keep editing
                    </Button>
                    <Button variant="danger" onPress={handleDiscard} className="flex-1">
                      Discard listing
                    </Button>
                  </Modal.Footer>
                </>
              )}
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>

      {/* Submit confirmation */}
      <Modal>
        <Modal.Backdrop
          isOpen={isConfirmOpen}
          onOpenChange={(open) => {
            if (!isSubmitting) setIsConfirmOpen(open);
          }}
        >
          <Modal.Container size="sm">
            <Modal.Dialog className="create-listing-flow">
              {({ close }) => (
                <>
                  <Modal.Header>
                    <Modal.Heading className="font-medium text-xl">
                      Publish this listing?
                    </Modal.Heading>
                    <p className="text-sm text-muted-foreground mt-1">
                      Please confirm the details below before your listing goes live for review.
                    </p>
                  </Modal.Header>

                  <Modal.Body className="flex flex-col gap-2">
                    {[
                      { label: "Listing", value: formData.name || "—" },
                      {
                        label: "Address",
                        value: [formData.street_address, formData.barangay, formData.city]
                          .filter(Boolean)
                          .join(", ") || "—",
                      },
                      { label: "Property Type", value: formData.type || "—" },
                      { label: "Monthly Rent", value: `₱ ${formData.monthly_rent.toLocaleString()}` },
                      { label: "Rent Due Day", value: `Day ${formData.rent_due_day} of each month` },
                      {
                        label: "Security Deposit",
                        value: `₱ ${(formData.security_deposit_months * formData.monthly_rent).toLocaleString()}`,
                      },
                      {
                        label: "Advance Rent",
                        value: `₱ ${(formData.advance_rent_months * formData.monthly_rent).toLocaleString()}`,
                      },
                      {
                        label: "Photos",
                        value: `${(formData.thumbnail ? 1 : 0) + formData.additionalPhotos.length} uploaded`,
                      },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex justify-between gap-4 text-sm">
                        <span className="text-muted-foreground">{label}</span>
                        <span className="font-medium text-foreground text-right">{value}</span>
                      </div>
                    ))}
                  </Modal.Body>

                  <Modal.Footer className="flex gap-2">
                    <Button
                      variant="tertiary"
                      onPress={close}
                      isDisabled={isSubmitting}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      onPress={handleSubmit}
                      isPending={isSubmitting}
                      isDisabled={isSubmitting}
                      className="flex-1"
                    >
                      Confirm Listing
                    </Button>
                  </Modal.Footer>
                </>
              )}
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </div>
  );
}
