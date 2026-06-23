import { useMemo, useState } from 'react';
import { FlatList, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import ScreenWrapper from '@/components/layout/ScreenWrapper';
import StandardHeader from '@/components/layout/StandardHeader';
import TenantApplicationCard from '@/app/landlord/tenant-applications/components/TenantApplicationCard';
import { SearchField } from 'heroui-native';
import { formatDate } from '@repo/utils';
import { useLandlordApplications } from '@/hooks/useLandlordApplications';
import TenantApplicationCardSkeleton from '@/app/landlord/tenant-applications/components/TenantApplicationCardSkeleton';
import EmptyApplications from '@/app/landlord/tenant-applications/components/EmptyApplications';

export default function TenantApplications() {
  const router = useRouter();
  const { applications, loading } = useLandlordApplications();
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredApplications = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return applications;
    return applications.filter(
      (app) =>
        app.tenant_name.toLowerCase().includes(query) ||
        app.apartment_name.toLowerCase().includes(query)
    );
  }, [applications, searchQuery]);

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
        ListEmptyComponent={loading ? null : <EmptyApplications />}
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
    </ScreenWrapper>
  );
}
