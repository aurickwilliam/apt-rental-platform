import { Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";

import ScreenWrapper from "@/components/layout/ScreenWrapper";
import StandardHeader from "@/components/layout/StandardHeader";

export default function MaintenanceDetails() {
  // Get the maintenance request details from the query parameters
  const { request } = useLocalSearchParams<{ request: string }>();
  const maintenanceRequest = request ? JSON.parse(request) : null;

  return (
    <ScreenWrapper
      header={
        <StandardHeader title="Maintenance Details" />
      }
      scrollable
      className="p-5"
    >
      <Text>Maintenance Details</Text>
    </ScreenWrapper>
  );
}
