import { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams } from "expo-router";
import ImageView from "react-native-image-viewing";

import { Button, Chip, Separator } from "heroui-native";

import { Hammer } from "lucide-react-native";

import ScreenWrapper from "@/components/layout/ScreenWrapper";
import StandardHeader from "@/components/layout/StandardHeader";
import DetailField from "@/components/display/DetailField";
import EmptyMaintenanceRequestDetail from "./components/EmptyMaintenanceRequestDetail";
import ResolveRequestDialog from "./components/ResolveRequestDialog";

import { formatDate } from "@repo/utils";

import { useColors } from "@/hooks/useTheme";
import {
  useLandlordMaintenanceRequests,
  useMaintenanceRequestStatusStyles,
  useMaintenanceRequestUrgencyStyles
} from "@/hooks/maintenance-requests";
import { MAINTENANCE_URGENCY } from "@repo/constants";

export default function MaintenanceRequestDetails() {
  const { requestId } = useLocalSearchParams<{
    requestId?: string | string[];
  }>();

  const { colors } = useColors();
  const {
    requests,
    loading,
    advanceStatus,
    resolveRequest,
    getNextStatus
  } = useLandlordMaintenanceRequests();
  const statusStyles = useMaintenanceRequestStatusStyles();
  const urgencyStyles = useMaintenanceRequestUrgencyStyles();

  const [isViewerVisible, setIsViewerVisible] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const [isResolveDialogOpen, setIsResolveDialogOpen] = useState(false);

  const resolvedId = useMemo(
    () => (Array.isArray(requestId) ? requestId[0] : requestId),
    [requestId]
  );

  const request = useMemo(() => {
    if (!resolvedId) return undefined;
    return requests.find((entry) => entry.id === resolvedId);
  }, [requests, resolvedId]);

  const photoImages = useMemo(
    () => (request?.photos ?? []).map((uri) => ({ uri })),
    [request?.photos]
  );

  const handleOpenPhoto = (index: number) => {
    setSelectedImageIndex(index);
    setIsViewerVisible(true);
  };

  // Loading State: still fetching data
  if (loading) {
    return (
      <ScreenWrapper
        header={<StandardHeader title="Maintenance Request" />}
        scrollable
        className="p-5"
      >
        <View className="flex-1 items-center justify-center py-20">
          <ActivityIndicator color={colors.primary} />
        </View>
      </ScreenWrapper>
    );
  }

  // Empty State: not found (or failed to load)
  if (!request) {
    return (
      <ScreenWrapper
        header={<StandardHeader title="Maintenance Request" />}
        scrollable
        className="p-5"
      >
        <EmptyMaintenanceRequestDetail />
      </ScreenWrapper>
    );
  }

  const statusStyle = statusStyles[request.status];
  const urgencyStyle = urgencyStyles[request.urgency];
  const urgencyLabel =
    MAINTENANCE_URGENCY.find((u) => u.value === request.urgency)?.label ?? request.urgency;

  const reportedDate = formatDate(request.reported_at, "medium") || "-";

  const nextStatus = getNextStatus(request.status);
  const isTerminal = nextStatus === request.status;
  const buttonLabel = isTerminal ? request.status : `Mark as ${nextStatus}`;

  const handleAdvanceStatus = () => {
    if (!resolvedId) return;
    if (nextStatus === "Resolved") {
      setIsResolveDialogOpen(true);
      return;
    }
    advanceStatus(resolvedId);
  };

  const handleResolveConfirm = async (notes: string) => {
    if (!resolvedId) return false;
    return resolveRequest(resolvedId, notes);
  };

  return (
    <ScreenWrapper
      header={<StandardHeader title="Maintenance Request" />}
      className="p-5"
      scrollable
    >
      <View className="flex-row items-center gap-3">
        <Hammer size={20} color={colors.primary} />
        <Text className="text-foreground text-lg font-interSemiBold">
          Maintenance Information
        </Text>
      </View>

      <View className="gap-3 mt-3">
        <DetailField label="Issue Title" value={request.issue_title} />

        <View className="flex-row items-start gap-4">
          <View className="gap-1 flex-1">
            <Text className="text-muted text-sm font-inter">
              Urgency Level
            </Text>

            <Chip
              size="md"
              variant="soft"
              style={{ backgroundColor: urgencyStyle.backgroundColor }}
            >
              <Chip.Label
                className="font-interMedium"
                style={{ color: urgencyStyle.textColor }}
              >
                {urgencyLabel}
              </Chip.Label>
            </Chip>
          </View>

          <View className="gap-1 flex-1">
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
                {request.status}
              </Chip.Label>
            </Chip>
          </View>
        </View>
      </View>

      <Separator className="my-3"/>

      <View className="gap-3">
        <DetailField label="Apartment" value={request.apartment_name} />
        <DetailField label="Address" value={request.apartment_address} />
        <DetailField label="Current Tenant" value={request.tenant_name} />

        <View className="flex-row items-start gap-4">
          <DetailField
            label="Contact Number"
            value={request.contact_number}
          />
          <DetailField label="Date Reported" value={reportedDate} />
        </View>
      </View>

      <Separator className="my-3" />

      <View className="gap-1">
        <Text className="text-foreground text-base font-interMedium">
          Issue Description
        </Text>
        <View className="bg-surface rounded-3xl p-3 min-h-20">
          <Text className="text-muted text-sm font-inter">
            {request.description}
          </Text>
        </View>
      </View>

      {request.photos.length > 0 ? (
        <View className="gap-3 mt-3">
          <Text className="text-foreground text-base font-interMedium">
            Issue Photos
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {request.photos.map((photo, index) => (
              <Pressable
                key={`${request.id}-photo-${index}`}
                onPress={() => handleOpenPhoto(index)}
                className="overflow-hidden size-24 rounded-3xl border border-border"
              >
                <Image
                  source={{ uri: photo }}
                  style={{ width: "100%", height: "100%" }}
                  contentFit="cover"
                  cachePolicy="disk"
                />
              </Pressable>
            ))}
          </View>
        </View>
      ) : (
        <View className="gap-1 mt-3">
          <Text className="text-foreground text-base font-interMedium">
            Issue Photos
          </Text>
          <View className="bg-surface rounded-3xl p-3">
            <Text className="text-muted text-sm font-inter">
              No photos provided.
            </Text>
          </View>
        </View>
      )}

      {request.status === "Resolved" && request.resolution_notes ? (
        <>
          <Separator className="my-3" />

          <View className="gap-1">
            <Text className="text-foreground text-base font-interMedium">
              Resolution Notes
            </Text>
            <View className="bg-surface rounded-3xl p-3 min-h-20">
              <Text className="text-muted text-sm font-inter">
                {request.resolution_notes}
              </Text>
            </View>
          </View>
        </>
      ) : null}

      <Button
        size="md"
        onPress={handleAdvanceStatus}
        isDisabled={isTerminal}
        className={`${request.status === "Resolved" ? "bg-success" : ""} mt-10 `}
      >
        <Button.Label>{buttonLabel}</Button.Label>
      </Button>

      <ImageView
        images={photoImages}
        imageIndex={selectedImageIndex}
        visible={isViewerVisible}
        onRequestClose={() => setIsViewerVisible(false)}
        presentationStyle="overFullScreen"
        backgroundColor="rgb(0, 0, 0, 0.8)"
        FooterComponent={({ imageIndex: index }) => (
          <View className="p-10 items-center">
            <Text className="text-white font-interMedium">
              {index + 1} / {photoImages.length}
            </Text>
          </View>
        )}
      />

      <ResolveRequestDialog
        isOpen={isResolveDialogOpen}
        onOpenChange={setIsResolveDialogOpen}
        onConfirm={handleResolveConfirm}
      />
    </ScreenWrapper>
  );
}
