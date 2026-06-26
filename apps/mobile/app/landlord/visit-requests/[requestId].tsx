import { useMemo } from "react";
import { Text, View } from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams } from "expo-router";

import { Button, Card, Chip } from "heroui-native";

import ScreenWrapper from "@/components/layout/ScreenWrapper";
import StandardHeader from "@/components/layout/StandardHeader";
import DetailField from "@/components/display/DetailField";

import { formatDate } from "@repo/utils";

import { DEFAULT_IMAGES } from "constants/images";

import { VISIT_REQUESTS } from "./mockData";

import { useColors } from "@/hooks/useTheme";
import EmptyRequestData from "./components/EmptyRequestData";

type VisitRequestStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "rescheduled"
  | "cancelled";

export default function VisitRequestDetails() {
  const { requestId } = useLocalSearchParams<{ requestId: string }>();
  const { colors } = useColors();

  const request = useMemo(() => {
    return VISIT_REQUESTS.find((item) => item.id === requestId);
  }, [requestId]);

  if (!request) return <EmptyRequestData />;

  const STATUS_STYLES: Record<VisitRequestStatus, {
    label: string;
    backgroundColor: string;
    textColor: string
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
      textColor: colors.gray500
    }
  };

  const statusStyle = STATUS_STYLES[request.status as VisitRequestStatus] ?? {
    label: "Unknown",
    backgroundColor: colors.gray100,
    textColor: colors.gray500
  };
  const scheduleLabel = `${formatDate(request.visit_date, "long")} • ${
    request.visit_time
  }`;

  return (
    <ScreenWrapper
      header={<StandardHeader title="Visit Request" />}
      scrollable
      className="px-5 py-5"
    >
      <View className="gap-5">
        <View className="overflow-hidden rounded-2xl">
          <Image
            source={
              request.apartment_image_url
                ? { uri: request.apartment_image_url }
                : DEFAULT_IMAGES.defaultThumbnail
            }
            style={{ width: "100%", height: 210 }}
            contentFit="cover"
            cachePolicy="disk"
          />
        </View>

        <Card className="shadow-none border border-border">
          <Card.Body className="gap-5">
            <View className="gap-1">
              <Text className="text-foreground text-lg font-interSemiBold">
                {request.apartment_name}
              </Text>
              <Text className="text-muted text-sm font-inter">
                {request.apartment_address}
              </Text>
            </View>

            <View className="flex-row items-start justify-between gap-4">
              <DetailField label="Tenant Name" value={request.tenant_name} />
              <DetailField
                label="Visitors"
                value={`${request.no_visitors} person${
                  request.no_visitors > 1 ? "s" : ""
                }`}
              />
            </View>

            <View className="flex-row items-start justify-between gap-4">
              <DetailField label="Requested Date" value={scheduleLabel} />
              <View className="items-end gap-1">
                <Text className="text-muted text-xs font-inter">Status</Text>
                <Chip
                  size="sm"
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

            <View className="gap-2">
              <Text className="text-muted text-xs font-inter">
                Notes/Message
              </Text>
              <Text className="text-foreground text-sm font-inter">
                {request.notes ?? "No additional notes provided."}
              </Text>
            </View>
          </Card.Body>
        </Card>

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
      </View>
    </ScreenWrapper>
  );
}
