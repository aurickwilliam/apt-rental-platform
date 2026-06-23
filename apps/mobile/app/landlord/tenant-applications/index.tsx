import { useMemo, useState } from 'react';
import { FlatList, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { ListFilter } from 'lucide-react-native';

import ScreenWrapper from '@/components/layout/ScreenWrapper';
import StandardHeader from '@/components/layout/StandardHeader';
import TenantApplicationCard from './components/TenantApplicationCard';
import TenantApplicationCardSkeleton from './components/TenantApplicationCardSkeleton';
import EmptyApplications from './components/EmptyApplications';
import ApplicationFilterSheet, {
  type ApplicationFilters,
} from './components/ApplicationFilterSheet';
import EmptySearchResults from './components/EmptySearchResults';

import { Button, SearchField } from 'heroui-native';

import { formatDate } from '@repo/utils';

import { useLandlordApplications } from '@/hooks/useLandlordApplications';
import { useColors } from '@/hooks/useTheme';

const EMPTY_FILTERS: ApplicationFilters = { statuses: [], locations: [] };

export default function TenantApplications() {
  const router = useRouter();
  const { colors } = useColors();
  const { applications, loading } = useLandlordApplications();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState<ApplicationFilters>(EMPTY_FILTERS);

  const activeCount = filters.statuses.length + filters.locations.length;
  const hasApplications = applications.length > 0;
  const hasActiveSearch = searchQuery.trim().length > 0 || activeCount > 0;

  const filteredApplications = useMemo(() => {
    let result = applications;

    const query = searchQuery.trim().toLowerCase();
    if (query) {
      result = result.filter(
        (app) =>
          app.tenant_name.toLowerCase().includes(query) ||
          app.apartment_name.toLowerCase().includes(query)
      );
    }

    if (filters.statuses.length > 0) {
      result = result.filter((app) => filters.statuses.includes(app.status));
    }

    if (filters.locations.length > 0) {
      result = result.filter((app) =>
        filters.locations.includes(app.apartment_city.toLowerCase())
      );
    }

    return result;
  }, [applications, searchQuery, filters]);

  const handleApplicationPress = (applicationId: string) => {
    router.push(`/landlord/tenant-applications/${applicationId}`);
  };

  return (
    <ScreenWrapper
      header={<StandardHeader title="Tenant Applications" />}
      scrollable={false}
    >
      <FlatList
        data={loading ? [] : filteredApplications}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: 30,
          flexGrow: !loading && filteredApplications.length === 0 ? 1 : 0,
        }}
        ListHeaderComponent={
          <View className="gap-4">
            {/* Search + Filter row */}
            <View className="flex-row items-center gap-2">
              <View className="flex-1">
                <SearchField value={searchQuery} onChange={setSearchQuery}>
                  <SearchField.Group>
                    <SearchField.SearchIcon />
                    <SearchField.Input
                      placeholder="Search tenant or apartment..."
                      className="flex-1 shadow-none"
                    />
                    <SearchField.ClearButton />
                  </SearchField.Group>
                </SearchField>
              </View>

              {/* Filter button */}
              <View className="relative">
                <Button
                  onPress={() => setFilterOpen(true)}
                  variant="tertiary"
                  isIconOnly
                >
                  <ListFilter
                    size={18}
                    color={colors.textPrimary}
                  />
                </Button>

                {/* Badge for number of filters active */}
                {activeCount > 0 && (
                  <View className="absolute -top-0.5 -right-0.5 min-w-4 h-4 rounded-full bg-accent items-center justify-center">
                    <Text className="text-white text-[10px] font-interMedium leading-none -mb-0.5">
                      {activeCount}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {loading ? (
              <View className="gap-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <TenantApplicationCardSkeleton key={i} />
                ))}
              </View>
            ) : (
              <Text className="text-gray-500 text-sm font-inter mb-3">
                Total: {filteredApplications.length}
              </Text>
            )}
          </View>
        }
        ItemSeparatorComponent={() => <View className="h-3" />}
        ListEmptyComponent={
          loading ? null : (
            hasApplications && hasActiveSearch
              ? <EmptySearchResults query={searchQuery} />
              : <EmptyApplications />
          )
        }
        renderItem={({ item }) => (
          <TenantApplicationCard
            tenantName={item.tenant_name}
            apartmentName={item.apartment_name}
            status={item.status}
            submittedDate={formatDate(item.created_at)}
            avatarUrl={item.tenant_avatar_url ?? undefined}
            onPress={() => handleApplicationPress(item.id)}
          />
        )}
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
