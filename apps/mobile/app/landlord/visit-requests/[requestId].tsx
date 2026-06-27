import { useMemo } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams } from "expo-router";

import { Button, Chip } from "heroui-native";

import ScreenWrapper from "@/components/layout/ScreenWrapper";
import StandardHeader from "@/components/layout/StandardHeader";
import DetailField from "@/components/display/DetailField";
import EmptyRequestData from "./components/EmptyRequestData";

import { Image as ImageIcon } from "lucide-react-native";

import { formatAddress, formatDate, formatFullName } from "@repo/utils";

import { useLandlordVisitRequests, type LandlordVisitRequest } from "@/hooks/useLandlordVisitRequests";

import { useColors } from "@/hooks/useTheme";

type VisitRequestStatus = LandlordVisitRequest["status"];

export default function VisitRequestDetails() {
  const { requestId } = useLocalSearchParams<{ requestId: string }>();
  const { colors } = useColors();
  const { visitRequests, loading } = useLandlordVisitRequests();

  const request = useMemo(() => {
    return visitRequests.find((item) => item.id === requestId);
  }, [visitRequests, requestId]);

  const STATUS_STYLES: Record<VisitRequestStatus, {
    label: string;
    backgroundColor: string;
    textColor: string;
  }> = {
    pending: {
      label: "Pending",
      backgroundColor: colors.warningLight,
      textColor: colors.warning,
    },
    approved: {
      label: "Approved",
      backgroundColor: colors.successLight,
      textColor: colors.success,
    },
    rejected: {
      label: "Rejected",
      backgroundColor: colors.dangerLight,
      textColor: colors.danger,
    },
    rescheduled: {
      label: "Rescheduled",
      backgroundColor: colors.primaryLight,
      textColor: colors.primary,
    },
    cancelled: {
      label: "Cancelled",
      backgroundColor: colors.gray100,
      textColor: colors.gray500,
    },
  };

  if (loading) {
    return (
      <ScreenWrapper header={<StandardHeader title="Visit Request" />}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size={"large"} color={colors.primary} />
        </View>
      </ScreenWrapper>
    );
  }

  if (!request) return <EmptyRequestData />;

  const statusStyle = STATUS_STYLES[request.status] ?? {
    label: "Unknown",
    backgroundColor: colors.gray100,
    textColor: colors.gray500,
  };

  const tenantFullName = formatFullName({
    first_name: request.tenant.first_name,
    last_name: request.tenant.last_name
  });
  const apartmentFullAddress = formatAddress({
    street_address: request.apartment.street_address,
    barangay: request.apartment.barangay,
    city: request.apartment.city,
    province: request.apartment.province,
    zip_code: String(request.apartment.zip_code)
  })
  const requestedDate = formatDate(request.visit_date, "long");
  const isPending = request.status === "pending";
  const apartmentThumbnail = request.apartment.apartment_images[0]?.url;

  return (
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
          <View className="size-full bg-accent-soft">
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
          <DetailField
            label="Tenant Name"
            value={tenantFullName}
          />
          <DetailField
            label="No. of Visitors"
            value={`${request.no_visitors} Person${
              request.no_visitors > 1 ? "s" : ""
            }`}
          />
        </View>

        <View className="flex-row">
          <DetailField
            label="Requested Date"
            value={requestedDate}
          />

          <DetailField
            label="Requested Time"
            value={request.time}
          />
        </View>

        <View className="gap-1">
          <Text className="text-muted text-sm font-inter">
            Status
          </Text>
          <Chip
            size="sm"
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
              value={formatDate(request.confirmed_visit_date, "long")}
            />

            <DetailField
              label="Rescheduled Time"
              value={request.confirmed_time}
            />
          </View>
        )}

      {request.status === "rejected" && request.rejected_reason && (
        <View className="bg-surface border border-danger p-3 gap-1 rounded-3xl">
          <Text className="text-danger text-sm font-inter">
            Rejection Reason:
          </Text>
          <Text className="text-foreground text-sm font-inter">
            {request.rejected_reason}
          </Text>
        </View>
      )}

      <View className="gap-1">
        <Text className="text-muted text-sm font-inter">
          Notes/Message:
        </Text>
        <View className="bg-surface-tertiary p-3 rounded-3xl border border-border">
          <Text className="text-foreground text-sm font-inter">
            {request.notes ?? "No additional notes provided."}
          </Text>
        </View>
      </View>

      {isPending && (
        <View className="flex-row gap-3">
          <Button className="flex-1" size="sm" variant="danger">
            <Button.Label>Reject</Button.Label>
          </Button>
          <Button className="flex-1" size="sm" variant="tertiary">
            <Button.Label>Reschedule</Button.Label>
          </Button>
          <Button className="flex-1" size="sm">
            <Button.Label>Approve</Button.Label>
          </Button>
        </View>
      )}
    </ScreenWrapper>
  );
}
