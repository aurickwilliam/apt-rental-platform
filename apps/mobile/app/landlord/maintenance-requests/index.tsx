import { useMemo, useState } from "react";
import { FlatList, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { SearchField } from "heroui-native";

import ScreenWrapper from "@/components/layout/ScreenWrapper";
import StandardHeader from "@/components/layout/StandardHeader";
import MaintenanceRequestCard from "./components/MaintenanceRequestCard";
import EmptyMaintenanceRequestsList from "./components/EmptyMaintenanceRequestsList";

import { formatDate } from "@repo/utils";

import {
  useMaintenanceRequests,
  type MaintenanceRequest,
} from "@/hooks/maintenance-requests";

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

export default function MaintenanceRequests() {
  const router = useRouter();
  const { requests } = useMaintenanceRequests(DUMMY_MAINTENANCE_REQUESTS);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredRequests = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return requests;
    return requests.filter((request) => {
      return (
        request.issue_title.toLowerCase().includes(query) ||
        request.apartment_name.toLowerCase().includes(query) ||
        request.tenant_name.toLowerCase().includes(query)
      );
    });
  }, [requests, searchQuery]);

  const handleRequestPress = (requestId: string) => {
    router.push(`/landlord/maintenance-requests/${requestId}`);
  };

  return (
    <ScreenWrapper
      header={<StandardHeader title="Maintenance Requests" />}
      scrollable={false}
    >
      <FlatList
        data={filteredRequests}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: 30,
          flexGrow: filteredRequests.length === 0 ? 1 : 0,
        }}
        ListHeaderComponent={
          <View className="gap-4">
            <SearchField value={searchQuery} onChange={setSearchQuery}>
              <SearchField.Group>
                <SearchField.SearchIcon />
                <SearchField.Input
                  placeholder="Search issues, tenants, apartments..."
                  className="flex-1 shadow-none"
                />
                <SearchField.ClearButton />
              </SearchField.Group>
            </SearchField>
            <Text className="text-gray-500 text-sm font-inter mb-3">
              Total: {filteredRequests.length}
            </Text>
          </View>
        }
        ItemSeparatorComponent={() => <View className="h-3" />}
        ListEmptyComponent={<EmptyMaintenanceRequestsList />}
        renderItem={({ item }) => (
          <MaintenanceRequestCard
            issueTitle={item.issue_title}
            apartmentName={item.apartment_name}
            tenantName={item.tenant_name}
            reportedDate={formatDate(item.reported_at, "medium")}
            status={item.status}
            onPress={() => handleRequestPress(item.id)}
          />
        )}
      />
    </ScreenWrapper>
  );
}
