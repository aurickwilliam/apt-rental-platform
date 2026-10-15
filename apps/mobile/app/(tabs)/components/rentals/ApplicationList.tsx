import { Text, View } from 'react-native';

import { useTenantApplications } from '@/hooks/applications';
import type { TenantApplication } from '@/hooks/applications';

import ApplicationStatusCard from './ApplicationStatusCard';
import ApplicationsEmptyState from './ApplicationsEmptyState';
import ApplicationStatusCardSkeleton from './ApplicationStatusCardSkeleton';

interface ApplicationsListProps {
  // Show the skeleton even if applications have loaded, while the parent
  // still waits for the rest of the page.
  isLoading?: boolean;
  applicationsOverride?: TenantApplication[];
  isEmptyFiltered?: boolean;
}

// No section header: the Rentals page title already sits directly above.
export default function ApplicationsList({
  isLoading = false,
  applicationsOverride,
  isEmptyFiltered = false,
}: ApplicationsListProps) {
  const { applications: loadedApplications, loading } = useTenantApplications();
  const applications = applicationsOverride ?? loadedApplications;

  if (isLoading || loading) {
    return (
      <View className="flex gap-3">
        <ApplicationStatusCardSkeleton />
        <ApplicationStatusCardSkeleton />
        <ApplicationStatusCardSkeleton />
      </View>
    );
  }

  if (applications.length === 0) {
    if (isEmptyFiltered) {
      return (
        <View className="flex-1 items-center justify-center gap-2 py-20">
          <Text className="text-center text-xl font-nunitoBold text-foreground">No Matching Applications</Text>
          <Text className="px-8 text-center text-base font-inter text-muted">
            Try changing your filters to see more applications.
          </Text>
        </View>
      );
    }
    return <ApplicationsEmptyState />;
  }

  return (
    <View className="flex gap-3">
      {applications.map((application) => (
        <ApplicationStatusCard
          key={application.id}
          applicationId={application.id}
          status={application.status}
          apartmentName={application.apartments.name}
          location={[application.apartments.barangay, application.apartments.city]
            .filter(Boolean)
            .join(', ')}
          thumbnailUrl={application.apartments.thumbnail_url}
          submittedAt={application.created_at}
          apartmentId={application.apartment_id}
        />
      ))}
    </View>
  );
}
