import { View, ActivityIndicator } from 'react-native';

import ScreenWrapper from 'components/layout/ScreenWrapper';

import { useColors } from '@/hooks/useTheme';
import { useTenantApplications } from '@/hooks/useTenantApplications';
import ApplicationsList from '@/app/(tabs)/components/rentals/ApplicationList';

export default function ApplicationsPage() {
  const { colors } = useColors();
  const { loading } = useTenantApplications();

  if (loading) {
    return (
      <ScreenWrapper className="p-5">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper scrollable className="p-5">
      <ApplicationsList />
    </ScreenWrapper>
  );
}