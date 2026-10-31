import { View } from "react-native";
import { useRouter } from "expo-router";

import ScreenWrapper from "components/layout/ScreenWrapper";
import ApplicationHeader from "@/components/layout/ApplicationHeader";
import SectionHeader from "@/components/display/SectionHeader";
import MoveInCostBreakdown from "@/components/display/MoveInCostBreakdown";
import { useAddApartmentProgress } from "hooks/apartments/useAddApartmentProgress";
import {
  ADD_APARTMENT_STEP_HREFS,
  ADD_APARTMENT_STEP_LABELS,
  ADD_APARTMENT_TOTAL_STEPS,
} from "constants/addApartmentSteps";

// The preview reuses the apartment page's own sections so it looks exactly
// like the published listing will.
import ApartmentHeroSection from "@/app/apartment/[apartmentId]/components/sections/ApartmentHeroSection";
import ApartmentDetailsSection from "@/app/apartment/[apartmentId]/components/sections/ApartmentDetailsSection";
import ApartmentDescriptionSection from "@/app/apartment/[apartmentId]/components/sections/ApartmentDescriptionSection";
import PerksSection from "@/app/apartment/[apartmentId]/components/sections/PerksSection";
import MapPreviewSection from "@/app/apartment/[apartmentId]/components/sections/MapPreviewSection";
import LandlordSection from "@/app/apartment/[apartmentId]/components/sections/LandlordSection";
import LeaseAgreementSection from "@/app/apartment/[apartmentId]/components/sections/LeaseAgreementSection";
import RatingsSection from "@/app/apartment/[apartmentId]/components/sections/RatingsSection";
import SectionCard from "@/app/apartment/[apartmentId]/components/SectionCard";

import { Button, Dialog } from "heroui-native";
import { IconCash } from "@tabler/icons-react-native";

import { useApartmentFormStore } from "@/stores/useApartmentFormStore";
import { pricingAmountFromMonths } from "@repo/utils";

import { useProfile } from "hooks/auth";
import { usePublishApartment } from "hooks/apartments";
import { useColors } from "hooks/useTheme";
import type { ApartmentDetails } from "hooks/apartments";

const PREVIEW_ID = "preview";

export default function FifthStep() {
  const router = useRouter();
  const { colors } = useColors();
  const { profile } = useProfile();
  const furthestStep = useAddApartmentProgress(5);

  const {
    publish,
    loading: publishing,
    error: publishError,
    clearError: clearPublishError,
  } = usePublishApartment();

  const form = useApartmentFormStore();

  const monthlyRent = Number(form.monthlyRent) || 0;
  const securityDeposit = pricingAmountFromMonths(monthlyRent, form.securityDepositMonths);
  const advanceRent = pricingAmountFromMonths(monthlyRent, form.advanceRentMonths);

  const images = [
    ...(form.thumbnail ? [{ id: "thumbnail", image: { uri: form.thumbnail.uri } }] : []),
    ...form.additionalPhotos.map((photo, index) => ({
      id: `photo-${index}`,
      image: { uri: photo.uri },
    })),
  ];

  // The form's data in the shape the apartment page sections read.
  const previewApartment: ApartmentDetails = {
    id: PREVIEW_ID,
    name: form.name || "Unnamed Apartment",
    description: form.description,
    type: form.apartmentType,
    monthly_rent: monthlyRent,
    no_bedrooms: form.bedrooms,
    no_bathrooms: form.bathrooms,
    area_sqm: Number(form.floorArea) || 0,
    average_rating: null,
    no_ratings: 0,
    amenities: form.amenities,
    street_address: form.streetName,
    barangay: form.barangay,
    city: form.city,
    province: form.province,
    zip_code: form.postalCode || null,
    latitude: form.latitude,
    longitude: form.longitude,
    lease_agreement_url: null,
    floor_level: form.floorLevel,
    furnished_type: form.furnishingType || null,
    lease_duration: form.leaseDuration || null,
    max_occupants: form.maxOccupants,
    security_deposit: securityDeposit,
    advance_rent: advanceRent,
    status: "available",
    is_verified: false,
    landlord: profile
      ? {
          id: profile.id,
          first_name: profile.first_name ?? "",
          last_name: profile.last_name ?? "",
          email: profile.email,
          mobile_number: profile.mobile_number ?? "",
          avatar_url: profile.avatar_url,
        }
      : null,
    apartment_images: [],
  };

  const handlePublish = async () => {
    const result = await publish();
    if (result) {
      router.replace(
        `/landlord/manage-apartment/add-apartment/success?apartmentId=${result}`,
      );
    }
  };

  return (
    <ScreenWrapper
      header={
        <ApplicationHeader
          currentTitle="Preview & Publish"
          step={5}
          totalSteps={ADD_APARTMENT_TOTAL_STEPS}
          stepLabels={ADD_APARTMENT_STEP_LABELS}
          stepHrefs={ADD_APARTMENT_STEP_HREFS}
          furthestStep={furthestStep}
        />
      }
      footer={
        <View className="flex-row gap-4 px-5 pt-4 pb-2 bg-surface-secondary border-t border-border">
          <Button
            variant="outline"
            onPress={() => router.back()}
            className="flex-1 bg-surface"
            isDisabled={publishing}
          >
            <Button.Label>Back</Button.Label>
          </Button>

          <Button isDisabled={publishing} onPress={handlePublish} className="flex-1">
            <Button.Label>{publishing ? "Publishing..." : "Publish"}</Button.Label>
          </Button>
        </View>
      }
      scrollable
      bottomPadding={20}
    >
      <ApartmentHeroSection apartment={previewApartment} images={images} />

      <View className="gap-3 mt-3">
        <ApartmentDetailsSection apartment={previewApartment} />

        <ApartmentDescriptionSection description={previewApartment.description} />

        <PerksSection amenities={previewApartment.amenities} />

        <MapPreviewSection
          apartmentName={previewApartment.name}
          latitude={previewApartment.latitude}
          longitude={previewApartment.longitude}
          showDirections={false}
        />

        <LandlordSection landlord={previewApartment.landlord} />

        <LeaseAgreementSection leaseAgreementUrl={null} />

        <RatingsSection reviews={[]} />

        <SectionCard appearance="card">
          <SectionHeader
            icon={<IconCash size={26} color={colors.textPrimary} />}
            title="Move-in Cost"
            subtitle="What tenants pay before moving in."
            className="p-0 mt-0 mb-4"
          />
          <MoveInCostBreakdown
            monthlyRent={monthlyRent}
            securityDeposit={securityDeposit}
            advanceRent={advanceRent}
          />
        </SectionCard>
      </View>

      <Dialog
        isOpen={!!publishError}
        onOpenChange={(open) => {
          if (!open) clearPublishError();
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay />
          <Dialog.Content>
            <Dialog.Close variant="ghost" className="absolute top-4 right-4" />
            <View className="mb-4 gap-1.5">
              <Dialog.Title>Publish Failed</Dialog.Title>
              <Dialog.Description>{publishError}</Dialog.Description>
            </View>
            <View className="flex-row justify-end">
              <Button size="sm" variant="ghost" onPress={() => clearPublishError()}>
                Dismiss
              </Button>
            </View>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>
    </ScreenWrapper>
  );
}
