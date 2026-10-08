import { View, Text } from "react-native";
import { useState } from "react";
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from "expo-router";
import ImageViewing from "react-native-image-viewing";

import ScreenWrapper from "@/components/layout/ScreenWrapper";
import DetailField from "@/components/display/DetailField";
import DetailSection from "@/components/display/DetailSection";
import DocumentRow from "../../../components/display/DocumentRow";
import VisitRequestCard from "./components/VisitRequestCard";
import VisitRequestHistoryItem from "./components/VisitRequestHistoryItem";
import ConfirmDialog from "@/components/display/ConfirmDialog";

import { useApartmentDetails } from "@/hooks/apartments";
import { useColors } from "@/hooks/useTheme";
import { useStatusChipStyles, statusChipSurface } from "@/hooks/useStatusChipStyles";
import {
  useTenantApplications,
  useApplicationStatusStyles,
  useCancelApplication
} from "@/hooks/applications";
import { useVisitRequest, useRespondToReschedule } from "@/hooks/visitRequests";
import { useProfile } from "@/hooks/auth";

import { formatAddress, formatPesoDisplay, formatDate } from "@repo/utils";

import { Button, Chip, Spinner } from "heroui-native";

import {
  IconBan,
  IconBriefcase,
  IconBuildingCommunity,
  IconChevronLeft,
  IconFileDescription,
  IconFiles,
  IconListDetails,
} from '@tabler/icons-react-native';

const orDash = (value: string | null | undefined) =>
  value?.trim() ? value : "-";

export default function ApplicationApartment() {
  const { colors } = useColors();
  const palette = useStatusChipStyles();
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

  const application = applications.find((a) => a.id === applicationId);
  const status = application?.status;
  const chipConfig = status ? getStatusStyle(status) : null;
  const chipStatusStyle = chipConfig?.chipColor === "success"
    ? palette.success
    : chipConfig?.chipColor === "warning"
      ? palette.warning
      : chipConfig?.chipColor === "danger"
        ? palette.danger
        : palette.neutral;

  const [docViewerUri, setDocViewerUri] = useState<string | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [cancelVisitDialogOpen, setCancelVisitDialogOpen] = useState(false);
  const [cancelVisitError, setCancelVisitError] = useState<string | null>(null);

  const fullAddress = apartment ? formatAddress(apartment) : "";
  const monthlyRent = apartment?.monthly_rent
    ? `${formatPesoDisplay(apartment.monthly_rent)}/month`
    : "";
  const moveInDate = application
    ? formatDate(application.move_in_date, "long")
    : "N/A";

  const coverImage =
    apartment?.apartment_images?.find((img) => img.is_cover) ??
    apartment?.apartment_images?.[0];

  const coverImageUri =
    (coverImage?.url_thumb || coverImage?.url) ?? undefined;

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
        apartmentTitle: apartment?.name,
      },
    });
  };

  if (apartmentLoading || appsLoading || visitLoading) {
    return (
      <ScreenWrapper scrollable className="p-5 flex-1 items-center justify-center">
        <Spinner size="lg" color={colors.primary} className="mt-10" />
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper scrollable className="p-5">
      <View className="gap-4">
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
              <IconChevronLeft size={24} color={colors.gray400} />
            </Button>
            <View>
              <Text className="text-sm text-muted font-inter">Applied for</Text>
              <Text
                className="text-accent font-nunitoBold text-2xl"
                numberOfLines={1}
              >
                {apartment?.name}
              </Text>
            </View>
          </View>
          {chipConfig && (
            <Chip variant="soft" color={chipConfig.chipColor} background={null} style={statusChipSurface(chipStatusStyle)}>
              <Chip.Label style={{ color: chipStatusStyle.textColor }}>{chipConfig.label}</Chip.Label>
            </Chip>
          )}
        </View>

        {/* Apartment card */}
        <View className="bg-surface border border-border rounded-3xl overflow-hidden">
          <Image
            source={{ uri: coverImageUri }}
            contentFit="cover"
            style={{ width: "100%", height: 200 }}
            cachePolicy="disk"
          />
          <View className="p-4 gap-4">
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
        </View>

        {application?.status === "rejected" && application.rejected_reason && (
          <View className="p-4 rounded-3xl bg-danger-soft border border-danger-light">
            <Text className="text-sm font-nunitoSemiBold text-danger mb-1">
              Application Rejected
            </Text>
            <Text className="text-sm text-foreground">
              {application.rejected_reason}
            </Text>
          </View>
        )}

        {application?.status === "closed" && application.rejected_reason && (
          <View className="p-4 rounded-3xl bg-surface border border-border">
            <Text className="text-sm font-nunitoSemiBold text-secondary mb-1">
              Application Closed
            </Text>
            <Text className="text-sm text-foreground">
              {application.rejected_reason}
            </Text>
          </View>
        )}

        {/* Visit Request */}
        {visitRequest && (
          <VisitRequestCard
            visitRequest={visitRequest}
            onAccept={handleAccept}
            onDecline={handleDecline}
            onRequestAgain={handleRequestAgain}
            onMessageLandlord={handleMessageLandlord}
            onCancel={() => setCancelVisitDialogOpen(true)}
          />
        )}

        {/* Application details */}
        {application && (
          <>
            <View>
              <Text className="text-lg text-foreground font-nunitoSemiBold">
                Application Details
              </Text>
              <Text className="text-sm text-muted">
                These are the details you provided when you submitted your
                application.
              </Text>
            </View>

            <DetailSection title="Application Status" icon={IconFileDescription}>
              <View className="flex-row">
                <DetailField
                  label="Date Submitted"
                  value={formatDate(application.created_at, "long")}
                />
                <DetailField label="Status" value={chipConfig?.label ?? "—"} />
              </View>
            </DetailSection>

            <DetailSection title="Employment" icon={IconBriefcase}>
              <View className="flex-row">
                <DetailField label="Occupation" value={orDash(application.occupation)} />
                <DetailField label="Employer" value={orDash(application.employer_name)} />
              </View>
              <View className="flex-row">
                <DetailField label="Employment Type" value={application.employment_type} />
                <DetailField
                  label="Monthly Income"
                  value={formatPesoDisplay(application.monthly_income)}
                />
              </View>
            </DetailSection>

            <DetailSection title="Previous Landlord" icon={IconBuildingCommunity}>
              <View className="flex-row">
                <DetailField label="Name" value={orDash(application.prev_landlord_name)} />
                <DetailField label="Contact" value={orDash(application.prev_landlord_contact)} />
              </View>
            </DetailSection>

            <DetailSection title="Rental Preferences" icon={IconListDetails}>
              <View className="flex-row">
                <DetailField label="Move-in Date" value={moveInDate} />
                <DetailField
                  label="No. of Occupants"
                  value={application.no_occupants.toString()}
                />
              </View>
              <View className="flex-row">
                <DetailField label="Has Pets" value={application.has_pets ? "Yes" : "No"} />
                <DetailField label="Has Smoker" value={application.has_smoker ? "Yes" : "No"} />
              </View>
              <DetailField
                label="Needs Parking"
                value={application.need_parking ? "Yes" : "No"}
              />
              {application.message ? (
                <DetailField label="Message" value={application.message} />
              ) : null}
            </DetailSection>

            <DetailSection title="Submitted Documents" icon={IconFiles}>
              <View className="gap-1">
                {application.documents.length > 0 ? (
                  application.documents.map((doc) => (
                    <DocumentRow
                      key={doc.label}
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
            </DetailSection>
          </>
        )}

        {history.length > 0 && (
          <>
            <View>
              <Text className="text-lg text-foreground font-nunitoSemiBold">
                Visit History
              </Text>
              <Text className="text-sm text-muted">
                Previous visit requests for this apartment.
              </Text>
            </View>
            <View className="gap-2">
              {history.map((vr) => (
                <VisitRequestHistoryItem key={vr.id} visitRequest={vr} />
              ))}
            </View>
          </>
        )}
      </View>

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
              <IconBan size={20} color={colors.secondaryForeground} />
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
