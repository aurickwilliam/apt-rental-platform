import { View, Text } from 'react-native';

import { IconClipboardList } from '@tabler/icons-react-native';

import { useColors } from '@/hooks/useTheme';
import { useTenantApplications } from '@/hooks/applications';

import ApplicationStatusCard from './ApplicationStatusCard';
import ApplicationsEmptyState from './ApplicationsEmptyState';
import ApplicationStatusCardSkeleton from './ApplicationStatusCardSkeleton';

export default function ApplicationsList() {
  const { colors } = useColors();
  const { applications, loading } = useTenantApplications();

  return (
    <>
      <View className="flex-row items-center justify-start gap-2 mb-5">
        <IconClipboardList size={24} color={colors.textPrimary} />
        <Text className="text-foreground text-lg font-interSemiBold">
          My Applications
        </Text>
      </View>

      {loading ? (
        <View className="flex gap-3">
          <ApplicationStatusCardSkeleton />
          <ApplicationStatusCardSkeleton />
          <ApplicationStatusCardSkeleton />
        </View>
      ) : applications.length === 0 ? (
        <ApplicationsEmptyState />
      ) : (
        <View className="flex gap-3">
          {applications.map((application) => (
            <ApplicationStatusCard
              key={application.id}
              applicationId={application.id}
              status={application.status}
              apartmentName={application.apartments.name}
              submittedAt={application.created_at}
              apartmentId={application.apartment_id}
            />
          ))}
        </View>
      )}
    </>
  );
}
