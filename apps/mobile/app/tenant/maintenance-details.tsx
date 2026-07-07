import { useState } from "react";
import { Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Image } from "expo-image";
import ImageViewing from "react-native-image-viewing";

import ScreenWrapper from "@/components/layout/ScreenWrapper";
import StandardHeader from "@/components/layout/StandardHeader";
import DetailField from "@/components/display/DetailField";
import ErrorDialog from "@/components/display/ErrorDialog";

import { Hammer, Trash2 } from "lucide-react-native";

import { Button, Chip, PressableFeedback, Separator } from "heroui-native";

import { useColors } from "@/hooks/useTheme";
import {
  useMaintenanceRequestStatusStyles,
  useMaintenanceRequestUrgencyStyles,
  MaintenanceRequest,
  useMaintenanceRequests,
} from "@/hooks/maintenance-requests";

import { MAINTENANCE_CATEGORIES, MAINTENANCE_URGENCY } from "@repo/constants";

import { formatDate } from "@repo/utils";
import ConfirmDialog from "@/components/display/ConfirmDialog";

export default function MaintenanceDetails() {
  // Get the maintenance request details from the query parameters
  const { request } = useLocalSearchParams<{
    request: string;
    apartmentId: string
  }>();
  const maintenanceRequest = request ? JSON.parse(request) as MaintenanceRequest : null;

  const router = useRouter();
  const { colors } = useColors();
  const statusStyles = useMaintenanceRequestStatusStyles();
  const urgencyStyles = useMaintenanceRequestUrgencyStyles();
  const { cancelRequest, canCancel } = useMaintenanceRequests({});

  const [isCancelling, setIsCancelling] = useState(false);
  const [confirmCancelDialogOpen, setConfirmCancelDialogOpen] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  // Image lightbox state
  const [imageIndex, setImageIndex] = useState(0);
  const [isImageViewVisible, setIsImageViewVisible] = useState(false);

  // Empty State
  if (!maintenanceRequest) {
    return (
      <ScreenWrapper
        header={
          <StandardHeader title="Maintenance Details" />
        }
        scrollable
        className="p-5"
      >
        <Text className="text-foreground">
          No maintenance request found.
        </Text>
      </ScreenWrapper>
    );
  }

  const handleCancel = async () => {
    if (isCancelling) return;
    setIsCancelling(true);
    setCancelError(null);

    const result = await cancelRequest(maintenanceRequest);

    setIsCancelling(false);
    setConfirmCancelDialogOpen(false);

    if (result.success) {
      router.back();
    } else {
      setCancelError(result.error);
    }
  };

  const status = statusStyles[maintenanceRequest.status];
  const urgency = urgencyStyles[maintenanceRequest.urgency];
  const categoryLabel =
    MAINTENANCE_CATEGORIES.find((c) => c.value === maintenanceRequest.category)?.label ?? maintenanceRequest.category;
  const urgencyLabel =
    MAINTENANCE_URGENCY.find((u) => u.value === maintenanceRequest.urgency)?.label ?? maintenanceRequest.urgency;

  const images = maintenanceRequest.image_urls;

  return (
    <ScreenWrapper
      header={
        <StandardHeader title="Maintenance Details" />
      }
      scrollable
      className="p-5"
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-row gap-2 items-center">
          <Hammer size={24} color={colors.primary} />
          <Text className="text-accent text-lg font-interSemiBold">
            Maintenance
          </Text>
        </View>

        <Chip
          variant="soft"
          size="md"
          animation="disable-all"
          style={{ backgroundColor: status.backgroundColor }}
        >
          <Chip.Label
            style={{ color: status.textColor }}
            className="font-interMedium"
          >
            {maintenanceRequest.status}
          </Chip.Label>
        </Chip>
      </View>

      <View className="mt-3 gap-3">
        <DetailField
          label="Issue Title"
          value={maintenanceRequest.title}
        />

        <View className="gap-1 flex">
          <Text className="text-muted text-sm font-inter">
            Urgency Level
          </Text>
          <Chip
            variant="soft"
            size="md"
            animation="disable-all"
            style={{ backgroundColor: urgency.backgroundColor }}
          >
            <Chip.Label
              style={{ color: urgency.textColor }}
              className="font-interMedium"
            >
              {urgencyLabel}
            </Chip.Label>
          </Chip>
        </View>

        <View className="flex-row">
          <DetailField
            label="Category"
            value={categoryLabel}
          />

          <DetailField
            label="Submitted Date"
            value={formatDate(maintenanceRequest.created_at, "long")}
          />
        </View>

        <DetailField
          label="Description"
          value={maintenanceRequest.message}
        />
      </View>

      <Separator className="my-4" />

      {images.length > 0 && (
        <View className="gap-3">
          <Text className="text-foreground text-base font-interMedium">
            Photos of the issue:
          </Text>

          <View className="flex-row flex-wrap gap-2">
            {images.map((url, index) => (
              <PressableFeedback
                key={index}
                className="size-24 rounded-3xl overflow-hidden border border-border"
                onPress={() => {
                  setImageIndex(index);
                  setIsImageViewVisible(true);
                }}
              >
                <PressableFeedback.Highlight />
                <Image
                  source={{ uri: url }}
                  style={{
                    width: "100%",
                    height: '100%',
                  }}
                  contentFit="cover"
                  cachePolicy="disk"
                />
              </PressableFeedback>
            ))}
          </View>

          <ImageViewing
            images={images.map((url) => ({ uri: url }))}
            imageIndex={imageIndex}
            visible={isImageViewVisible}
            onRequestClose={() => setIsImageViewVisible(false)}
            presentationStyle="overFullScreen"
            backgroundColor="rgb(0, 0, 0, 0.8)"
            FooterComponent={({ imageIndex: idx }) => (
              <View className="p-10 items-center">
                <Text className="text-white font-interMedium">
                  {idx + 1} / {images.length}
                </Text>
              </View>
            )}
          />
        </View>
      )}

      {maintenanceRequest.resolved_at && (
        <>
          <Separator className="my-4" />

          <View className="mt-4 gap-3">
            <DetailField
              label="Resolved Date"
              value={formatDate(maintenanceRequest.resolved_at, "long")}
            />

            {maintenanceRequest.resolution_notes && (
              <DetailField
                label="Resolution Notes"
                value={maintenanceRequest.resolution_notes}
              />
            )}
          </View>
        </>
      )}

      <View className="flex-1" />

      <Button
        variant="danger-soft"
        className="mt-10"
        isDisabled={!canCancel(maintenanceRequest.status) || isCancelling}
        onPress={() => {
          setCancelError(null);
          setConfirmCancelDialogOpen(true);
        }}
      >
        <Trash2 size={20} color={colors.danger} />
        <Button.Label>
          {isCancelling ? "Cancelling..." : "Cancel Maintenance Request"}
        </Button.Label>
      </Button>

      <ErrorDialog
        isOpen={!!cancelError}
        onClose={() => setCancelError(null)}
        message={cancelError}
        title="Couldn't Cancel Request"
      />

      <ConfirmDialog
        isOpen={confirmCancelDialogOpen}
        onOpenChange={setConfirmCancelDialogOpen}
        title="Cancel Maintenance Request"
        description="Are you sure you want to cancel this maintenance request? This action cannot be undone."
        confirmLabel="Yes, Cancel Request"
        confirmVariant="danger"
        onConfirm={handleCancel}
        isConfirmDisabled={isCancelling}
      />
    </ScreenWrapper>
  );
}
