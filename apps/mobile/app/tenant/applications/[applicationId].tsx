import { View, Text, ActivityIndicator } from "react-native";
import { useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import ImageViewing from "react-native-image-viewing";

import ScreenWrapper from "@/components/layout/ScreenWrapper";
import DetailField from "@/components/display/DetailField";
import DocumentRow from "./components/DocumentRow";
import ImageCarousel from "./components/ImageCarousel";

import { useApartmentDetails } from "@/hooks/useApartmentDetails";
import { useColors } from "@/hooks/useTheme";
import { useTenantApplications } from "@/hooks/useTenantApplications";

import { formatAddress, formatCurrency, formatDate } from "@repo/utils";

import { Separator, Button, Chip, Accordion } from "heroui-native";

import { Ban, ChevronLeft } from "lucide-react-native";

type ApplicationStatus = "pending" | "approved" | "rejected";

type ChipColor = "accent" | "default" | "success" | "warning" | "danger";

const STATUS_CHIP: Record<
  ApplicationStatus,
  { color: ChipColor; label: string }
> = {
  pending: { color: "warning", label: "Pending" },
  approved: { color: "success", label: "Approved" },
  rejected: { color: "danger", label: "Rejected" },
};

export default function ApplicationApartment() {
  const { colors } = useColors();
  const router = useRouter();
  const { applicationId, apartmentId } = useLocalSearchParams<{
    applicationId: string;
    apartmentId: string;
  }>();

  const { apartment, loading: apartmentLoading } =
    useApartmentDetails(apartmentId);
  const { applications, loading: appsLoading } = useTenantApplications();

  const application = applications.find((a) => a.id === applicationId);
  const status = application?.status;
  const chipConfig = status ? STATUS_CHIP[status as ApplicationStatus] : null;

  // Document viewer state (separate from the apartment image carousel above)
  const [docViewerUri, setDocViewerUri] = useState<string | null>(null);

  const fullAddress = apartment ? formatAddress(apartment) : "";
  const monthlyRent = apartment?.monthly_rent
    ? `₱ ${formatCurrency(apartment.monthly_rent)}/month`
    : "";
  const moveInDate = application
    ? formatDate(application.move_in_date, "long")
    : "N/A";

  if (apartmentLoading || appsLoading) {
    return (
      <ScreenWrapper
        scrollable
        className="p-5 flex-1 items-center justify-center"
      >
        <ActivityIndicator
          size="large"
          color={colors.primary}
          className="mt-10"
        />
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper scrollable className="p-5">
      {/* Header */}
      <View className="flex-row items-center justify-between">
        <View className="flex-1 flex-row gap-3 items-center">
          <Button
            isIconOnly
            variant="ghost"
            size="sm"
            onPress={() => router.back()}
          >
            <ChevronLeft size={24} color={colors.gray400} />
          </Button>

          <View>
            <Text className="text-sm text-muted font-inter">Applied for</Text>
            <Text
              className="text-secondary font-nunitoSemiBold text-2xl"
              numberOfLines={1}
            >
              {apartment?.name}
            </Text>
          </View>
        </View>

        {chipConfig && (
          <Chip
            variant="soft"
            className="border border-warning bg-warning-light"
          >
            <Chip.Label className="text-warning">{chipConfig.label}</Chip.Label>
          </Chip>
        )}
      </View>

      {/* Image Carousel */}
      <ImageCarousel images={apartment?.apartment_images ?? []} />

      {/* Apartment details */}
      <View className="mt-5 flex gap-3">
        <DetailField label="Location" value={fullAddress} />
        <DetailField label="Monthly Rent" value={monthlyRent} />

        <Button
          className="mt-3"
          size="sm"
          variant="secondary"
          onPress={() =>
            router.push({
              pathname: "/apartment/[apartmentId]",
              params: { apartmentId: apartment?.id ?? "" },
            })
          }
        >
          <Button.Label>View Apartment in Search</Button.Label>
        </Button>
      </View>

      <Separator className="my-5" />

      {/* Application details accordion */}
      {application && (
        <>
          {/* Header Title */}
          <View className="mb-3">
            <Text className="text-lg text-foreground font-interMedium">
              Application Details
            </Text>
            <Text className="text-sm text-muted">
              These are the details you provided when you submitted your
              application.
            </Text>
          </View>

          <Accordion
            selectionMode="single"
            variant="surface"
            className="rounded-3xl border border-border shadow-none"
          >
            <Accordion.Item value="personal">
              <Accordion.Trigger>
                <View className="flex-row items-center flex-1">
                  <Text className="text-foreground text-base flex-1">
                    Personal Information
                  </Text>
                </View>
                <Accordion.Indicator />
              </Accordion.Trigger>

              <Accordion.Content>
                <View className="gap-3 pb-2">
                  <DetailField
                    label="Occupation"
                    value={application.occupation}
                  />
                  <DetailField
                    label="Employer"
                    value={application.employer_name}
                  />
                  <DetailField
                    label="Employment Type"
                    value={application.employment_type}
                  />
                  <DetailField
                    label="Monthly Income"
                    value={`₱ ${formatCurrency(application.monthly_income)}`}
                  />

                  <Separator className="my-2" />

                  <DetailField
                    label="Previous Landlord Name"
                    value={application.prev_landlord_name ?? "—"}
                  />
                  <DetailField
                    label="Previous Landlord Contact"
                    value={application.prev_landlord_contact ?? "—"}
                  />
                </View>
              </Accordion.Content>
            </Accordion.Item>

            <Accordion.Item value="rental">
              <Accordion.Trigger>
                <View className="flex-row items-center flex-1">
                  <Text className="text-foreground text-base flex-1">
                    Rental Preferences
                  </Text>
                </View>
                <Accordion.Indicator />
              </Accordion.Trigger>
              <Accordion.Content>
                <View className="gap-3 pb-2">
                  <DetailField label="Move-in Date" value={moveInDate} />
                  <DetailField
                    label="No. of Occupants"
                    value={application.no_occupants.toString()}
                  />
                  <DetailField
                    label="Has Pets"
                    value={application.has_pets ? "Yes" : "No"}
                  />
                  <DetailField
                    label="Has Smoker"
                    value={application.has_smoker ? "Yes" : "No"}
                  />
                  <DetailField
                    label="Needs Parking"
                    value={application.need_parking ? "Yes" : "No"}
                  />
                  {application.message && (
                    <DetailField label="Message" value={application.message} />
                  )}
                </View>
              </Accordion.Content>
            </Accordion.Item>

            <Accordion.Item value="documents">
              <Accordion.Trigger>
                <View className="flex-row items-center flex-1">
                  <Text className="text-foreground text-base flex-1">
                    Submitted Documents
                  </Text>
                </View>
                <Accordion.Indicator />
              </Accordion.Trigger>
              <Accordion.Content>
                <View className="gap-1 pb-2">
                  {application.documents.length > 0 ? (
                    application.documents.map((doc) => (
                      <DocumentRow
                        key={doc.path}
                        label={doc.label}
                        path={doc.path}
                        signedUrl={doc.signedUrl}
                        onPressImage={setDocViewerUri}
                      />
                    ))
                  ) : (
                    <Text className="text-muted text-sm">
                      No documents submitted.
                    </Text>
                  )}
                </View>
              </Accordion.Content>
            </Accordion.Item>

            <Accordion.Item value="status">
              <Accordion.Trigger>
                <View className="flex-row items-center flex-1">
                  <Text className="text-foreground text-base flex-1">
                    Application Status
                  </Text>
                </View>
                <Accordion.Indicator />
              </Accordion.Trigger>
              <Accordion.Content>
                <View className="gap-3 pb-2">
                  <DetailField
                    label="Date Submitted"
                    value={formatDate(application.created_at, "long")}
                  />
                  <DetailField
                    label="Status"
                    value={chipConfig?.label ?? "—"}
                  />
                  {application.status === "rejected" &&
                    application.rejected_reason && (
                      <DetailField
                        label="Rejection Reason"
                        value={application.rejected_reason}
                      />
                    )}
                </View>
              </Accordion.Content>
            </Accordion.Item>
          </Accordion>
        </>
      )}

      {/* Cancel Button */}
      <Button className="mt-5" variant="danger">
        <Ban size={20} color={colors.secondaryForeground} />
        <Button.Label>Cancel Application</Button.Label>
      </Button>

      <ImageViewing
        images={docViewerUri ? [{ uri: docViewerUri }] : []}
        imageIndex={0}
        visible={!!docViewerUri}
        onRequestClose={() => setDocViewerUri(null)}
        presentationStyle="overFullScreen"
        backgroundColor="rgb(0, 0, 0, 0.8)"
      />
    </ScreenWrapper>
  );
}
