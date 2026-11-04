import { Text, View } from "react-native";
import { BottomSheet, Button } from "heroui-native";
import { BottomSheetFlatList } from "@gorhom/bottom-sheet";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { MaintenanceRequest } from "@/service/maintenance-requests/maintenanceService";
import { MAINTENANCE_DASHBOARD_LIMIT } from "@/constants/maintenance-dashboard";
import MaintenanceDashboardRequestCard from "./MaintenanceDashboardRequestCard";

interface MaintenanceHistorySheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  requests: MaintenanceRequest[];
  limited: boolean;
  onOpenRequest: (request: MaintenanceRequest) => void;
}

export default function MaintenanceHistorySheet({ isOpen, onOpenChange, requests, limited, onOpenRequest }: MaintenanceHistorySheetProps) {
  const insets = useSafeAreaInsets();
  return (
    <BottomSheet isOpen={isOpen} onOpenChange={onOpenChange}>
      <BottomSheet.Portal>
        <BottomSheet.Overlay />
        <BottomSheet.Content snapPoints={["85%"]} enableDynamicSizing={false} topInset={insets.top}>
          <View className="gap-2 pb-4">
            <BottomSheet.Title className="font-nunitoBold text-xl text-foreground">More maintenance history</BottomSheet.Title>
            <BottomSheet.Description className="font-inter text-sm text-muted">Older resolved and cancelled requests, newest first.</BottomSheet.Description>
            <Button variant="ghost" size="sm" className="min-h-11 self-end" accessibilityLabel="Close maintenance history" onPress={() => onOpenChange(false)}><Button.Label>Close</Button.Label></Button>
          </View>
          <BottomSheetFlatList<MaintenanceRequest>
            data={isOpen ? requests : []}
            keyExtractor={(request: MaintenanceRequest) => request.id}
            renderItem={({ item }: { item: MaintenanceRequest }) => <MaintenanceDashboardRequestCard request={item} onPress={onOpenRequest} />}
            contentContainerStyle={{ gap: 12, paddingBottom: insets.bottom + 24 }}
            ListFooterComponent={limited ? <Text className="pt-3 font-inter text-xs text-muted">History is limited to the latest {MAINTENANCE_DASHBOARD_LIMIT} requests.</Text> : null}
          />
        </BottomSheet.Content>
      </BottomSheet.Portal>
    </BottomSheet>
  );
}
