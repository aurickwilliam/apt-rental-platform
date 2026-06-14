import { useMemo } from "react";
import { Image, ScrollView, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";

import { Button, Card, Chip } from "heroui-native";

import { IconTool } from "@tabler/icons-react-native";

import ScreenWrapper from "@/components/layout/ScreenWrapper";
import StandardHeader from "@/components/layout/StandardHeader";

import { COLORS } from "@repo/constants";
import { formatDate } from "@repo/utils";

import {
  STATUS_STYLES,
  useMaintenanceRequestsStore,
} from "@/stores/useMaintenanceRequestsStore";

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <View className="gap-1 flex-1">
      <Text className="text-grey-500 text-xs font-inter">{label}</Text>
      <Text className="text-text text-sm font-interMedium">{value}</Text>
    </View>
  );
}

function RequestNotFound() {
  return (
    <View className="flex-1 items-center justify-center py-20">
      <View className="bg-white rounded-full p-5 mb-4">
        <IconTool size={32} color={COLORS.grey} />
      </View>
      <Text className="text-text text-lg font-interSemiBold">
        Request not found
      </Text>
      <Text className="text-grey-500 text-sm font-inter text-center mt-1">
        This maintenance request may have been removed.
      </Text>
    </View>
  );
}

export default function MaintenanceRequestDetails() {
  const { requestId } = useLocalSearchParams<{
    requestId?: string | string[];
  }>();
  const requests = useMaintenanceRequestsStore((state) => state.requests);
  const advanceStatus = useMaintenanceRequestsStore(
    (state) => state.advanceStatus
  );

  const resolvedId = useMemo(
    () => (Array.isArray(requestId) ? requestId[0] : requestId),
    [requestId]
  );

  const request = useMemo(() => {
    if (!resolvedId) return undefined;
    return requests.find((entry) => entry.id === resolvedId);
  }, [requests, resolvedId]);

  if (!request) {
    return (
      <ScreenWrapper
        header={<StandardHeader title="Maintenance Request" />}
        backgroundColor={COLORS.darkerWhite}
        scrollable
        className="p-5"
      >
        <RequestNotFound />
      </ScreenWrapper>
    );
  }

  const statusStyle = STATUS_STYLES[request.status];
  const reportedDate = formatDate(request.reported_at, "medium") || "-";
  const buttonLabel =
    request.status === "Pending"
      ? "Mark as In Progress"
      : request.status === "In Progress"
      ? "Mark as Resolved"
      : "Resolved";

  const handleAdvanceStatus = () => {
    if (!resolvedId) return;
    advanceStatus(resolvedId);
  };

  return (
    <ScreenWrapper
      header={<StandardHeader title="Maintenance Request" />}
      backgroundColor={COLORS.darkerWhite}
      scrollable
      className="px-5 py-5"
    >
      <View className="gap-5 pb-6">
        <View className="flex-row items-center gap-2">
          <View className="bg-white rounded-full p-2">
            <IconTool size={18} color={COLORS.primary} />
          </View>
          <Text className="text-text text-sm font-interSemiBold">
            Maintenance Information
          </Text>
        </View>

        <Card className="shadow-none border border-grey-200">
          <Card.Body className="gap-4">
            <DetailField label="Apartment" value={request.apartment_name} />
            <DetailField label="Current Tenant" value={request.tenant_name} />
            <View className="flex-row items-start gap-4">
              <DetailField label="Contact Number" value={request.contact_number} />
              <DetailField label="Date Reported" value={reportedDate} />
            </View>
          </Card.Body>
        </Card>

        <Card className="shadow-none border border-grey-200">
          <Card.Body className="gap-4">
            <DetailField label="Issue Title" value={request.issue_title} />
            <View className="flex-row items-start justify-between gap-4">
              <DetailField label="Urgency" value={request.urgency} />
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
          </Card.Body>
        </Card>

        <Card className="shadow-none border border-grey-200">
          <Card.Body className="gap-2">
            <Text className="text-text text-sm font-interSemiBold">
              Issue Description
            </Text>
            <View className="bg-darkerWhite rounded-2xl p-3">
              <Text className="text-grey-500 text-sm font-inter">
                {request.description}
              </Text>
            </View>
          </Card.Body>
        </Card>

        <View className="gap-3">
          <Text className="text-text text-sm font-interSemiBold">
            Issue Photos
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 12, paddingRight: 8 }}
          >
            {request.photos.map((photo, index) => (
              <View
                key={`${request.id}-photo-${index}`}
                className="overflow-hidden rounded-2xl border border-grey-200"
              >
                <Image
                  source={{ uri: photo }}
                  style={{ width: 96, height: 96 }}
                />
              </View>
            ))}
          </ScrollView>
        </View>

        <Button
          size="md"
          onPress={handleAdvanceStatus}
          isDisabled={request.status === "Resolved"}
        >
          <Button.Label>{buttonLabel}</Button.Label>
        </Button>
      </View>
    </ScreenWrapper>
  );
}
