import { useMemo, useState } from "react";
import { Text, View } from "react-native";

import { IconClipboardText, IconFilter } from "@tabler/icons-react-native";
import { Button } from "heroui-native";

import ScreenWrapper from "components/layout/ScreenWrapper";
import StandardHeader from "components/layout/StandardHeader";
import ApplicationsList from "@/app/(tabs)/components/rentals/ApplicationList";
import { useTenantApplications, type TenantApplication } from "@/hooks/applications";
import { useColors } from "@/hooks/useTheme";

import ApplicationFilterSheet, {
  DEFAULT_TENANT_APPLICATION_FILTERS,
  type TenantApplicationFilters,
} from "./components/ApplicationFilterSheet";

function applicationDate(application: TenantApplication) {
  const timestamp = new Date(application.created_at).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

export default function ApplicationsPage() {
  const { colors } = useColors();
  const { applications, loading } = useTenantApplications();
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState<TenantApplicationFilters>(DEFAULT_TENANT_APPLICATION_FILTERS);

  const filteredApplications = useMemo(() => {
    const result = filters.statuses.length > 0
      ? applications.filter((application) => filters.statuses.includes(application.status))
      : [...applications];

    return result.sort((first, second) => {
      if (filters.sort === "pending_first") {
        const pendingDifference = Number(second.status === "pending") - Number(first.status === "pending");
        if (pendingDifference !== 0) return pendingDifference;
      }

      const dateDifference = applicationDate(second) - applicationDate(first);
      return filters.sort === "oldest" ? -dateDifference : dateDifference;
    });
  }, [applications, filters]);

  const activeCount = filters.statuses.length + Number(filters.sort !== "pending_first");
  const isEmptyFiltered = applications.length > 0 && filteredApplications.length === 0;

  return (
    <ScreenWrapper
      scrollable
      header={<StandardHeader title="Applications" />}
      className="p-5"
    >
      <View className="mb-4 flex-row items-center justify-between">
        <View className="flex-row items-center gap-1.5">
          <IconClipboardText size={18} color={colors.gray500} />
          <Text className="text-sm font-inter text-muted">
            {loading ? "Loading Applications..." : `${filteredApplications.length} Applications`}
          </Text>
        </View>

        <View className="relative">
          <Button variant="tertiary" size="sm" onPress={() => setFilterOpen(true)}>
            <IconFilter size={18} color={colors.textPrimary} />
            <Button.Label>Filter & sort</Button.Label>
          </Button>
          {activeCount > 0 && (
            <View className="absolute -right-1 -top-1 h-4 min-w-4 items-center justify-center rounded-full bg-accent">
              <Text className="-mb-0.5 text-[10px] font-nunitoSemiBold leading-none text-white">
                {activeCount}
              </Text>
            </View>
          )}
        </View>
      </View>

      <ApplicationsList
        isLoading={loading}
        applicationsOverride={filteredApplications}
        isEmptyFiltered={isEmptyFiltered}
      />

      <ApplicationFilterSheet
        isOpen={filterOpen}
        onOpenChange={setFilterOpen}
        filters={filters}
        onChange={setFilters}
      />
    </ScreenWrapper>
  );
}
