import { useMemo } from "react";
import { ScrollView, Text, View } from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams } from "expo-router";

import { Button, Chip, Separator } from "heroui-native";

import { Hammer } from "lucide-react-native";

import ScreenWrapper from "@/components/layout/ScreenWrapper";
import StandardHeader from "@/components/layout/StandardHeader";
import DetailField from "@/components/display/DetailField";

import { formatDate } from "@repo/utils";

import { useColors } from "@/hooks/useTheme";
import {
  useMaintenanceRequests,
  useMaintenanceRequestStatusStyles,
  type MaintenanceRequest,
} from "@/hooks/maintenance-requests";
import EmptyMaintenanceRequestDetail from "./components/EmptyMaintenanceRequestDetail";

// TODO: replace with a real fetch-by-id once backend is wired up
const DUMMY_MAINTENANCE_REQUESTS: MaintenanceRequest[] = [
  {
    id: "mr-1",
    issue_title: "Leaking kitchen sink",
    apartment_name: "Parkview Suites 12B",
    apartment_address: "Dela Rosa St, Makati City",
    tenant_name: "Jenna Santos",
    tenant_avatar_url: "https://i.pravatar.cc/150?img=24",
    contact_number: "09123456789",
    reported_at: "2026-05-24",
    urgency: "High",
    status: "Pending",
    description:
      "Water is dripping from the pipe under the sink and pooling on the floor. It started last night and has not stopped.",
    photos: [
      "https://picsum.photos/seed/maintenance-1/400/400",
      "https://picsum.photos/seed/maintenance-2/400/400",
      "https://picsum.photos/seed/maintenance-3/400/400",
    ],
  },
  {
    id: "mr-2",
    issue_title: "Air conditioner not cooling",
    apartment_name: "Sunset Heights 7A",
    apartment_address: "Valenzuela St, Quezon City",
    tenant_name: "Carlos Medina",
    tenant_avatar_url: "https://i.pravatar.cc/150?img=12",
    contact_number: "09987654321",
    reported_at: "2026-05-22",
    urgency: "Medium",
    status: "In Progress",
    description:
      "The unit turns on but only blows warm air. We tried cleaning the filter and resetting the unit.",
    photos: [
      "https://picsum.photos/seed/maintenance-4/400/400",
      "https://picsum.photos/seed/maintenance-5/400/400",
    ],
  },
  {
    id: "mr-3",
    issue_title: "Broken bathroom light",
    apartment_name: "Maple Residences 3C",
    apartment_address: "Katipunan Ave, Quezon City",
    tenant_name: "Alyssa Cruz",
    tenant_avatar_url: "https://i.pravatar.cc/150?img=56",
    contact_number: "09170011223",
    reported_at: "2026-05-19",
    urgency: "Low",
    status: "Resolved",
    description:
      "The bathroom light flickered for a day and now will not turn on at all.",
    photos: ["https://picsum.photos/seed/maintenance-6/400/400"],
  },
  {
    id: "mr-4",
    issue_title: "Ceiling leak after rain",
    apartment_name: "Cedar Point 9F",
    apartment_address: "Roxas Blvd, Pasay City",
    tenant_name: "Noah Lim",
    tenant_avatar_url: "https://i.pravatar.cc/150?img=68",
    contact_number: "09181234567",
    reported_at: "2026-05-25",
    urgency: "High",
    status: "Pending",
    description:
      "There is a steady drip from the bedroom ceiling during heavy rain. The paint has started to bubble.",
    photos: [
      "https://picsum.photos/seed/maintenance-7/400/400",
      "https://picsum.photos/seed/maintenance-8/400/400",
    ],
  },
  {
    id: "mr-5",
    issue_title: "Loose door handle",
    apartment_name: "Riverstone Flats 5D",
    apartment_address: "Ortigas Ave, Pasig City",
    tenant_name: "Bianca Reyes",
    tenant_avatar_url: "https://i.pravatar.cc/150?img=49",
    contact_number: "09223334444",
    reported_at: "2026-05-21",
    urgency: "Low",
    status: "Pending",
    description:
      "The main door handle is loose and wobbles when turning. It still locks but feels unstable.",
    photos: ["https://picsum.photos/seed/maintenance-9/400/400"],
  },
];

export default function MaintenanceRequestDetails() {
  const { requestId } = useLocalSearchParams<{
    requestId?: string | string[];
  }>();
  const { colors } = useColors();
  const { requests, advanceStatus } = useMaintenanceRequests(
    DUMMY_MAINTENANCE_REQUESTS
  );
  const statusStyles = useMaintenanceRequestStatusStyles();

  const resolvedId = useMemo(
    () => (Array.isArray(requestId) ? requestId[0] : requestId),
    [requestId]
  );

  const request = useMemo(() => {
    if (!resolvedId) return undefined;
    return requests.find((entry) => entry.id === resolvedId);
  }, [requests, resolvedId]);

  // Empty State: If the request is not found, show an empty state
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
      scrollable
      className="p-5"
      noBottomPadding
    >
      <View className="gap-5">
        <View className="flex-row items-center gap-3">
          <Hammer size={20} color={colors.primary} />
          <Text className="text-foreground text-lg font-interSemiBold">
            Maintenance Information
          </Text>
        </View>

        <DetailField
          label="Issue Title"
          value={request.issue_title}
        />
        <View className="flex-row items-start gap-4">
          <DetailField
            label="Urgency"
            value={request.urgency}
          />

          <View className="gap-1 flex-1">
            <Text className="text-muted text-sm font-inter">
              Status
            </Text>

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

        <Separator />

        <DetailField
          label="Apartment"
          value={request.apartment_name}
        />
        <DetailField
          label="Current Tenant"
          value={request.tenant_name}
        />
        <View className="flex-row items-start gap-4">
          <DetailField
            label="Contact Number"
            value={request.contact_number}
          />
          <DetailField
            label="Date Reported"
            value={reportedDate}
          />
        </View>

        <Separator />

        <View className="gap-1">
          <Text className="text-foreground text-base font-interMedium">
            Issue Description
          </Text>
          <View className="bg-surface rounded-3xl p-3">
            <Text className="text-muted text-sm font-inter">
              {request.description}
            </Text>
          </View>
        </View>

        <View className="gap-3">
          <Text className="text-foreground text-base font-interMedium">
            Issue Photos
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, paddingRight: 8 }}
          >
            {request.photos.map((photo, index) => (
              <View
                key={`${request.id}-photo-${index}`}
                className="overflow-hidden size-24 rounded-3xl border border-border"
              >
                <Image
                  source={{ uri: photo }}
                  style={{ width: '100%', height: '100%' }}
                  contentFit="cover"
                  cachePolicy="disk"
                />
              </View>
            ))}
          </ScrollView>
        </View>

        <View className="flex-1" />

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
