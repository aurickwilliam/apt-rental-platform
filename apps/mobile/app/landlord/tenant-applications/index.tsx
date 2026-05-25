import { useMemo, useState } from "react";
import { FlatList, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { IconFileText } from "@tabler/icons-react-native";

import ScreenWrapper from "@/components/layout/ScreenWrapper";
import StandardHeader from "@/components/layout/StandardHeader";
import TenantApplicationCard from "@/components/cards/TenantApplicationCard";

import { SearchField } from "heroui-native";

import { COLORS } from "@repo/constants";
import { formatDate } from "@repo/utils";

import { TENANT_APPLICATIONS } from "./mockData";

function EmptyApplications() {
  return (
    <View className="flex-1 items-center justify-center py-20">
      <View className="bg-white rounded-full p-5 mb-4">
        <IconFileText size={32} color={COLORS.grey} />
      </View>
      <Text className="text-text text-lg font-interSemiBold">
        No applications yet
      </Text>
      <Text className="text-grey-500 text-sm font-inter text-center mt-1">
        New tenant applications will appear here.
      </Text>
    </View>
  );
}

export default function TenantApplications() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState<string>("");

  const filteredApplications = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return TENANT_APPLICATIONS;

    return TENANT_APPLICATIONS.filter((application) => {
      return (
        application.tenant_name.toLowerCase().includes(query) ||
        application.apartment_name.toLowerCase().includes(query)
      );
    });
  }, [searchQuery]);

  const handleApplicationPress = (applicationId: string) => {
    router.push(`/landlord/tenant-applications/${applicationId}`);
  };

  return (
    <ScreenWrapper
      header={<StandardHeader title="Tenant Applications" />}
      backgroundColor={COLORS.darkerWhite}
      scrollable={false}
    >
      <FlatList
        data={filteredApplications}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: 30,
          flexGrow: filteredApplications.length === 0 ? 1 : 0,
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

            <Text className="text-grey-500 text-sm font-inter mb-3">
              Total: {filteredApplications.length}
            </Text>
          </View>
        }
        ItemSeparatorComponent={() => <View className="h-3" />}
        ListEmptyComponent={<EmptyApplications />}
        renderItem={({ item }) => (
          <TenantApplicationCard
            tenantName={item.tenant_name}
            apartmentName={item.apartment_name}
            status={item.status}
            submittedDate={formatDate(item.date_submitted)}
            avatarUrl={item.tenant_avatar_url ?? undefined}
            onPress={() => handleApplicationPress(item.id)}
          />
        )}
      />
    </ScreenWrapper>
  );
}
