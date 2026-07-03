import { View, Text, ActivityIndicator } from "react-native";
import { useState, useCallback } from "react";
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import ImageViewing from "react-native-image-viewing";
import Animated from "react-native-reanimated";

import ScreenWrapper from "@/components/layout/ScreenWrapper";
import DetailField from "@/components/display/DetailField";
import DocumentRow from "../../../components/display/DocumentRow";
import VisitRequestCard from "./components/VisitRequestCard";
import VisitRequestHistoryItem from "./components/VisitRequestHistoryItem";
import ConfirmDialog from "@/components/display/ConfirmDialog";

import { useApartmentDetails } from "@/hooks/apartments";
import { useColors } from "@/hooks/useTheme";
import {
  useTenantApplications,
  useApplicationStatusStyles,
  useCancelApplication
} from "@/hooks/applications";
import { useVisitRequest, useRespondToReschedule } from "@/hooks/visitRequests";
import { useProfile } from "@/hooks/auth";

import { formatAddress, formatCurrency, formatDate } from "@repo/utils";

import {
  Separator,
  Button,
  Chip,
  Accordion,
  AccordionLayoutTransition,
} from "heroui-native";

import { Ban, ChevronLeft } from "lucide-react-native";

export default function ApplicationApartment() {
  const { colors } = useColors();
  const router = useRouter();
  const { applicationId, apartmentId } = useLocalSearchParams<{
    applicationId: string;
    apartmentId: string;
  }>();

  const { profile } = useProfile();
  const { apartment, loading: apartmentLoading } = useApartmentDetails(apartmentId);
  const { applications, loading: appsLoading } = useTenantApplications();
  const { getStatusStyle } = useApplicationStatusStyles();
  const { visitRequest, history, loading: visitLoading, refetch } = useVisitRequest(applicationId);
  const { cancelApplication, loading: cancelling } = useCancelApplication();
  const { accept, decline, loading: responding } = useRespondToReschedule();

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const application = applications.find((a) => a.id === applicationId);
  const status = application?.status;
  const chipConfig = status ? getStatusStyle(status) : null;

  const [docViewerUri, setDocViewerUri] = useState<string | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [cancelVisitDialogOpen, setCancelVisitDialogOpen] = useState(false);
  const [cancelVisitError, setCancelVisitError] = useState<string | null>(null);

  const fullAddress = apartment ? formatAddress(apartment) : "";
  const monthlyRent = apartment?.monthly_rent
    ? `${formatCurrency(apartment.monthly_rent)}/month`
    : "";
  const moveInDate = application
    ? formatDate(application.move_in_date, "long")
    : "N/A";

  const coverImage =
    apartment?.apartment_images?.find((img) => img.is_cover) ??
    apartment?.apartment_images?.[0];

  const handleConfirmCancel = async () => {
    setCancelError(null);
    const { error } = await cancelApplication(applicationId, visitRequest?.id);
    if (error) {
      setCancelError("Failed to cancel application. Please try again.");
    } else {
      setCancelDialogOpen(false);
      router.back();
    }
  };

  const handleCancelDialogOpenChange = (open: boolean) => {
    setCancelDialogOpen(open);
    if (!open) setCancelError(null);
  };

  const handleAccept = async () => {
    if (!visitRequest) return;
    const { error } = await accept(visitRequest.id);
    if (!error) refetch();
  };

  const handleDecline = async () => {
    if (!visitRequest) return;
    const { error } = await decline(visitRequest.id);
    if (!error) refetch();
  };

  const handleConfirmCancelVisit = async () => {
    if (!visitRequest) return;
    setCancelVisitError(null);
    const { error } = await decline(visitRequest.id);
    if (error) {
      setCancelVisitError(
        error.message ?? "Failed to cancel visit request. Please try again."
      );
      refetch();
    } else {
      setCancelVisitDialogOpen(false);
      refetch();
    }
  };

  const handleCancelVisitDialogOpenChange = (open: boolean) => {
    setCancelVisitDialogOpen(open);
    if (!open) setCancelVisitError(null);
  };

  const handleRequestAgain = () =>
    router.push({
      pathname: "/tenant/applications/request-visit",
      params: { apartmentId: apartment?.id ?? "", applicationId },
    });

  const handleMessageLandlord = () => {
    const landlord = apartment?.landlord;
    if (!landlord || !profile || !apartmentId) return;

    const userA = profile.id < landlord.id ? profile.id : landlord.id;
    const userB = profile.id < landlord.id ? landlord.id : profile.id;
    const conversationId = `${userA}-${userB}-${apartmentId}`;

    router.push({
      pathname: "/chat/[conversationId]",
      params: {
        conversationId,
        otherUserId: landlord.id,
        otherUserName: `${landlord.first_name} ${landlord.last_name}`,
        otherUserAvatar: landlord.avatar_url ?? "",
        otherUserPhoneNumber: landlord.mobile_number,
        apartmentId,
      },
    });
  };

  if (apartmentLoading || appsLoading || visitLoading) {
    return (
      <ScreenWrapper scrollable className="p-5 flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} className="mt-10" />
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
            className="-ml-3"
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
          <Chip variant="soft" color={chipConfig.chipColor}>
            <Chip.Label>{chipConfig.label}</Chip.Label>
          </Chip>
        )}
      </View>

      {/* Apartment cover image */}
      <Image
        source={{ uri: coverImage?.url }}
        contentFit="cover"
        style={{
          width: "100%",
          height: 200,
          borderRadius: 24,
          marginTop: 20,
        }}
        cachePolicy="disk"
      />

      {/* Apartment details */}
      <View className="mt-5 flex gap-5">
        <DetailField label="Location" value={fullAddress} />
        <DetailField label="Monthly Rent" value={monthlyRent} />

        <View className="flex-row items-center gap-2">
          <Button
            className="flex-1"
            size="sm"
            variant="secondary"
            onPress={() =>
              router.push({
                pathname: "/apartment/[apartmentId]",
                params: { apartmentId: apartment?.id ?? "" },
              })
            }
          >
            <Button.Label>View Description</Button.Label>
          </Button>

          {!visitRequest && application?.status === "pending" && (
            <Button
              className="flex-1"
              size="sm"
              onPress={() =>
                router.push({
                  pathname: "/tenant/applications/request-visit",
                  params: {
                    apartmentId: apartment?.id ?? "",
                    applicationId: applicationId,
                  },
                })
              }
            >
              <Button.Label>Request a Visit</Button.Label>
            </Button>
          )}
        </View>
      </View>

      <Separator className="my-5" />

      {application?.status === "rejected" && application.rejected_reason && (
        <View className="mb-3 p-4 rounded-3xl bg-danger-soft border border-danger-light">
          <Text className="text-sm font-interSemiBold text-danger mb-1">
            Application Rejected
          </Text>
          <Text className="text-sm text-foreground">
            {application.rejected_reason}
          </Text>
        </View>
      )}

      {application?.status === "closed" && application.rejected_reason && (
        <View className="mb-3 p-4 rounded-3xl bg-surface border border-border">
          <Text className="text-sm font-interSemiBold text-secondary mb-1">
            Application Closed
          </Text>
          <Text className="text-sm text-foreground">
            {application.rejected_reason}
          </Text>
        </View>
      )}

      {/* Visit Request */}
      {visitRequest && (
        <>
          <View className="mb-3">
            <VisitRequestCard
              visitRequest={visitRequest}
              onAccept={handleAccept}
              onDecline={handleDecline}
              onRequestAgain={handleRequestAgain}
              onMessageLandlord={handleMessageLandlord}
              onCancel={() => setCancelVisitDialogOpen(true)}
            />
          </View>
          <Separator className="my-5" />
        </>
      )}

      {/* Application details accordion */}
      {application && (
        <>
          <View className="mb-3">
            <Text className="text-lg text-foreground font-interMedium">
              Application Details
            </Text>
            <Text className="text-sm text-muted">
              These are the details you provided when you submitted your
              application.
            </Text>
          </View>

          <Animated.View
            layout={AccordionLayoutTransition}
            className="rounded-3xl bg-surface border border-border shadow-none"
          >
            <Accordion
              selectionMode="single"
              variant="surface"
              className="shadow-none"
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
                      value={`${formatCurrency(application.monthly_income)}`}
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
                      <DetailField
                        label="Message"
                        value={application.message}
                      />
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
                  </View>
                </Accordion.Content>
              </Accordion.Item>
            </Accordion>
          </Animated.View>
        </>
      )}

      {history.length > 0 && (
        <>
          <Separator className="my-5" />
          <View className="mb-3">
            <Text className="text-lg text-foreground font-interMedium">
              Visit History
            </Text>
            <Text className="text-sm text-muted">
              Previous visit requests for this apartment.
            </Text>
          </View>
          <View className="gap-2">
            {history.map((vr) => (
              <VisitRequestHistoryItem
                key={vr.id}
                visitRequest={vr}
              />
            ))}
          </View>
        </>
      )}

      {/* Cancel Application Button + Dialog */}
      {
        application?.status === "pending" && (
          <>
            <Button
              className="mt-5"
              variant="danger"
              isDisabled={cancelling || responding}
              onPress={() => setCancelDialogOpen(true)}
            >
              <Ban size={20} color={colors.secondaryForeground} />
              <Button.Label>Cancel Application</Button.Label>
            </Button>

            <ConfirmDialog
              isOpen={cancelDialogOpen}
              onOpenChange={handleCancelDialogOpenChange}
              title="Cancel Application"
              description={`Are you sure you want to cancel your application for ${apartment?.name ?? "this apartment"}? This cannot be undone.`}
              confirmLabel="Yes, Cancel"
              confirmVariant="danger"
              onConfirm={handleConfirmCancel}
              errorMessage={cancelError}
              isConfirmDisabled={cancelling}
            />
          </>
        )
      }

      {/* Cancel Visit Request Dialog */}
      <ConfirmDialog
        isOpen={cancelVisitDialogOpen}
        onOpenChange={handleCancelVisitDialogOpenChange}
        title="Cancel Visit Request"
        description={
          visitRequest?.status === "approved"
            ? "This visit was already confirmed with the landlord. Are you sure you want to cancel it? This cannot be undone."
            : "Are you sure you want to cancel this visit request? This cannot be undone."
        }
        confirmLabel="Yes, Cancel"
        confirmVariant="danger"
        onConfirm={handleConfirmCancelVisit}
        errorMessage={cancelVisitError}
        isConfirmDisabled={responding}
      />

      {/* Document Viewer */}
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
