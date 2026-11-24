import { useState } from "react";
import { Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Button, Spinner } from "heroui-native";
import { IconCalendar, IconFileText } from "@tabler/icons-react-native";
import ScreenWrapper from "@/components/layout/ScreenWrapper";
import StandardHeader from "@/components/layout/StandardHeader";
import EmptyState from "@/components/display/EmptyState";
import RenewalSection from "@/components/renewals/RenewalSection";
import RenewalStatusChip from "@/components/renewals/RenewalStatusChip";
import { usePortalStore } from "@/stores/usePortalStore";
import { fetchRenewalRequests } from "@/service/tenancy/leaseRenewalService";

export default function RenewalRequestsScreen() {
  const authId = usePortalStore((s) => s.authUserId);
  const portal = usePortalStore((s) => s.portal);
  const router = useRouter();
  const [cursor, setCursor] = useState<{ before: string; id: string } | null>(null);
  const query = useQuery({ queryKey: ["lease-renewal-list", authId, portal, cursor], queryFn: () => fetchRenewalRequests(cursor), enabled: !!authId && portal === "landlord" });
  const items = query.data ?? [];
  const shown = items.slice(0, 25);
  const last = shown.at(-1);

  return (
    <ScreenWrapper header={<StandardHeader title="Lease renewals" />} scrollable className="px-5 pt-4 pb-5">
      <View className="gap-4">
        <RenewalSection title="Renewal requests" description="Review requests from your existing tenants and manage the next lease." icon={IconCalendar}>
          {portal !== "landlord" ? <Text className="font-inter text-sm text-muted">Open Rentals to manage your own renewal.</Text>
            : query.isLoading ? <View className="flex-row items-center gap-3 py-4"><Spinner accessibilityLabel="Loading renewal requests" /><Text className="font-inter text-sm text-muted">Loading requests…</Text></View>
              : query.error ? <>
                <Text accessibilityRole="alert" className="font-inter text-sm text-danger">Could not load renewal requests.</Text>
                <Button variant="secondary" onPress={() => void query.refetch()}><Button.Label>Retry</Button.Label></Button>
              </> : shown.length === 0 ? <EmptyState className="py-4" icon={IconFileText} title="No renewal requests" description="Requests from existing tenants will appear here." />
                : <Text className="font-inter text-sm text-muted">Select a request below to review its terms, agreement and payment.</Text>}
        </RenewalSection>
        {portal === "landlord" && !query.isLoading && !query.error && shown.map((item) => (
          <RenewalSection key={item.id} title={item.apartment_name} description={`Tenant · ${item.tenant_name}`} icon={IconFileText}>
            <RenewalStatusChip status={item.status} />
            <Button variant="secondary" onPress={() => router.push({ pathname: "/lease-renewal/[tenancyId]", params: { tenancyId: item.tenancy_id } })}><Button.Label>Review renewal</Button.Label></Button>
          </RenewalSection>
        ))}
        {items.length > 25 && last && <Button variant="outline" onPress={() => setCursor({ before: last.updated_at, id: last.id })}><Button.Label>Next page</Button.Label></Button>}
        {cursor && <Button variant="ghost" onPress={() => setCursor(null)}><Button.Label>Newest requests</Button.Label></Button>}
      </View>
    </ScreenWrapper>
  );
}
