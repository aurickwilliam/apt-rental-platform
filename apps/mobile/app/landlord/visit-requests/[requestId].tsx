import { useState, useMemo } from "react";
import { ActivityIndicator, Alert, Text, View } from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams } from "expo-router";

import { Button, Chip } from "heroui-native";

import ScreenWrapper from "@/components/layout/ScreenWrapper";
import StandardHeader from "@/components/layout/StandardHeader";
import DetailField from "@/components/display/DetailField";
import EmptyRequestData from "./components/EmptyRequestData";
import RejectDialog from "@/components/display/RejectDialog";
import RescheduleSheet from "./components/RescheduleSheet";
import ConfirmDialog from "@/components/display/ConfirmDialog";

import { Image as ImageIcon } from "lucide-react-native";

import {
  formatAddress,
  formatDate,
  formatFullName,
  formatTime,
} from "@repo/utils";

import { useLandlordVisitRequests } from "@/hooks/useLandlordVisitRequests";
import { useVisitRequestActions } from "@/hooks/useVisitRequestActions";
import { useColors } from "@/hooks/useTheme";
import { useVisitRequestStatusStyles } from "@/hooks/useVisitRequestStatusStyles";

export default function VisitRequestDetails() {
  const { requestId } = useLocalSearchParams<{ requestId: string }>();
  const { colors } = useColors();

  const { visitRequests, loading, refetch } = useLandlordVisitRequests();
  const { getStatusStyle } = useVisitRequestStatusStyles();

  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showRescheduleSheet, setShowRescheduleSheet] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);

  const request = useMemo(
    () => visitRequests.find((item) => item.id === requestId),
    [visitRequests, requestId]
  );

  const { approve, reject, reschedule, isApproving, isRejecting, isRescheduling } =
    useVisitRequestActions(requestId!, () => {
      refetch();
    });

  const handleApproveConfirm = async () => {
    const ok = await approve();
    if (ok) setShowApproveDialog(false);
  };

  const handleRejectConfirm = async (reason: string) => {
    const ok = await reject(reason);
    if (ok) {
      setShowRejectDialog(false);
    } else {
      Alert.alert("Error", "Failed to reject the request. Please try again.");
    }
  };

  const handleRescheduleConfirm = async (date: string, time: string) => {
    const ok = await reschedule(date, time);
    if (ok) {
      setShowRescheduleSheet(false);
    } else {
      Alert.alert("Error", "Failed to reschedule. Please try again.");
    }
  };

  // Loading State
  if (loading) {
    return (
      <ScreenWrapper header={<StandardHeader title="Visit Request" />}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenWrapper>
    );
  }

  // Empty State
  if (!request) return <EmptyRequestData />;

  const statusStyle = getStatusStyle(request.status);

  const tenantFullName = formatFullName({
    first_name: request.tenant.first_name,
    last_name: request.tenant.last_name,
  });
  const apartmentFullAddress = formatAddress({
    street_address: request.apartment.street_address,
    barangay: request.apartment.barangay,
    city: request.apartment.city,
    province: request.apartment.province,
    zip_code: String(request.apartment.zip_code),
  });
  const requestedDate = formatDate(request.visit_date, "long");
  const requestedTime = formatTime(request.time);
  const rescheduledDate = request.confirmed_visit_date
    ? formatDate(request.confirmed_visit_date, "long")
    : null;
  const rescheduledTime = request.confirmed_time
    ? formatTime(request.confirmed_time)
    : null;
  const isPending = request.status === "pending";
  const apartmentThumbnail = request.apartment.apartment_images[0]?.url;
  const isAnyActionLoading = isApproving || isRejecting || isRescheduling;

  return (
    <>
      <ScreenWrapper
        header={<StandardHeader title="Visit Request" />}
        scrollable
        className="p-5 gap-3"
      >
        {/* Apartment Thumbnail */}
        <View className="overflow-hidden h-56 rounded-3xl border border-border">
          {apartmentThumbnail ? (
            <Image
              source={{ uri: apartmentThumbnail }}
              style={{ width: "100%", height: "100%" }}
              contentFit="cover"
              cachePolicy="disk"
            />
          ) : (
            <View className="size-full bg-accent-soft items-center justify-center">
              <ImageIcon size={48} color={colors.white} />
            </View>
          )}
        </View>

        <View className="gap-3">
          <View className="gap-1">
            <Text className="text-accent text-xl font-interSemiBold">
              {request.apartment.name}
            </Text>
            <Text className="text-foreground font-inter">
              {apartmentFullAddress}
            </Text>
          </View>

          <View className="flex-row">
            <DetailField label="Tenant Name" value={tenantFullName} />
            <DetailField
              label="No. of Visitors"
              value={`${request.no_visitors} Person${
                request.no_visitors > 1 ? "s" : ""
              }`}
            />
          </View>

          <View className="flex-row">
            <DetailField label="Requested Date" value={requestedDate} />
            <DetailField label="Requested Time" value={requestedTime} />
          </View>

          <View className="gap-1">
            <Text className="text-muted text-sm font-inter">Status</Text>
            <Chip
              size="md"
              variant="soft"
              style={{ backgroundColor: statusStyle.backgroundColor }}
            >
              <Chip.Label
                className="font-interMedium"
                style={{ color: statusStyle.textColor }}
              >
                {statusStyle.label}
              </Chip.Label>
            </Chip>
          </View>
        </View>

        {request.status === "rescheduled" &&
          request.confirmed_visit_date &&
          request.confirmed_time && (
            <View className="flex-row">
              <DetailField
                label="Rescheduled Date"
                value={rescheduledDate}
              />
              <DetailField
                label="Rescheduled Time"
                value={rescheduledTime}
              />
            </View>
          )}

        {request.status === "rejected" && request.rejected_reason && (
          <View className="gap-1">
            <Text className="text-danger text-sm font-inter">
              Rejection Reason:
            </Text>
            <View className="min-h-20 bg-surface border border-danger p-3 gap-1 rounded-3xl">
              <Text className="text-foreground text-sm font-inter">
                {request.rejected_reason}
              </Text>
            </View>
          </View>
        )}

        <View className="gap-1">
          <Text className="text-muted text-sm font-inter">Notes/Message:</Text>
          <View className="min-h-20 bg-surface-tertiary p-3 rounded-3xl border border-border">
            <Text className="text-foreground text-sm font-inter">
              {request.notes ?? "No additional notes provided."}
            </Text>
          </View>
        </View>

        <View className="flex-1" />

        {isPending && (
          <View className="flex-row gap-3">
            <Button
              className="flex-1"
              size="sm"
              variant="danger"
              onPress={() => setShowRejectDialog(true)}
              isDisabled={isAnyActionLoading}
            >
              <Button.Label>Reject</Button.Label>
            </Button>

            <Button
              className="flex-1"
              size="sm"
              variant="tertiary"
              onPress={() => setShowRescheduleSheet(true)}
              isDisabled={isAnyActionLoading}
            >
              <Button.Label>Reschedule</Button.Label>
            </Button>

            <Button
              className="flex-1"
              size="sm"
              onPress={() => setShowApproveDialog(true)}
              isDisabled={isAnyActionLoading}
            >
              <Button.Label>Approve</Button.Label>
            </Button>
          </View>
        )}
      </ScreenWrapper>

      <RejectDialog
        isOpen={showRejectDialog}
        isLoading={isRejecting}
        onClose={() => setShowRejectDialog(false)}
        onConfirm={handleRejectConfirm}
        title="Reject Visit Request"
        description="Provide a reason for rejection (optional). The tenant will be notified."
        placeholder="e.g. The unit is unavailable on that date..."
      />

      <ConfirmDialog
        isOpen={showApproveDialog}
        onOpenChange={setShowApproveDialog}
        title="Approve Visit Request"
        description="Are you sure you want to approve this visit request? The tenant will be notified."
        confirmLabel="Approve"
        confirmVariant="primary"
        onConfirm={handleApproveConfirm}
      />

      <RescheduleSheet
        isOpen={showRescheduleSheet}
        isLoading={isRescheduling}
        onClose={() => setShowRescheduleSheet(false)}
        onConfirm={handleRescheduleConfirm}
      />
    </>
  );
}
