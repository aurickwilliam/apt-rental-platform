import { useMemo } from "react";
import { Image, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";

import { Button, Card, Chip } from "heroui-native";

import ScreenWrapper from "@/components/layout/ScreenWrapper";
import StandardHeader from "@/components/layout/StandardHeader";

import { COLORS } from "@repo/constants";
import { formatDate } from "@repo/utils";

import { DEFAULT_IMAGES } from "constants/images";

import { VISIT_REQUESTS } from "./mockData";

const STATUS_STYLES = {
  Pending: {
    backgroundColor: COLORS.lightYellowish,
    textColor: COLORS.yellowish,
  },
  Approved: {
    backgroundColor: COLORS.lightGreen,
    textColor: COLORS.greenHulk,
  },
  Rejected: {
    backgroundColor: COLORS.lightLightRedHead,
    textColor: COLORS.lightRedHead,
  },
  Rescheduled: {
    backgroundColor: COLORS.lightBlue,
    textColor: COLORS.primary,
  },
};

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <View className="gap-1 flex-1">
      <Text className="text-grey-500 text-xs font-inter">{label}</Text>
      <Text className="text-text text-sm font-interMedium">{value}</Text>
    </View>
  );
}

export default function VisitRequestDetails() {
  const { requestId } = useLocalSearchParams<{ requestId: string }>();

  const request = useMemo(() => {
    return VISIT_REQUESTS.find((item) => item.id === requestId);
  }, [requestId]);

  if (!request) {
    return (
      <ScreenWrapper
        header={<StandardHeader title="Visit Request" />}
        backgroundColor={COLORS.darkerWhite}
      >
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-text text-base font-interSemiBold">
            Visit request not found
          </Text>
          <Text className="text-grey-500 text-sm font-inter text-center mt-2">
            Please return to the visit request list.
          </Text>
        </View>
      </ScreenWrapper>
    );
  }

  const statusStyle = STATUS_STYLES[request.status];
  const scheduleLabel = `${formatDate(request.visit_date, "long")} • ${
    request.visit_time
  }`;

  return (
    <ScreenWrapper
      header={<StandardHeader title="Visit Request" />}
      backgroundColor={COLORS.darkerWhite}
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
            resizeMode="cover"
          />
        </View>

        <Card className="shadow-none border border-grey-200">
          <Card.Body className="gap-5">
            <View className="gap-1">
              <Text className="text-text text-lg font-interSemiBold">
                {request.apartment_name}
              </Text>
              <Text className="text-grey-500 text-sm font-inter">
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
                <Text className="text-grey-500 text-xs font-inter">Status</Text>
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
              <Text className="text-grey-500 text-xs font-inter">
                Notes/Message
              </Text>
              <Text className="text-text text-sm font-inter">
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
