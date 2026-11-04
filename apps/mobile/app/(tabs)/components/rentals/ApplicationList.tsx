import { View } from 'react-native';

import { useTenantApplications } from '@/hooks/applications';
import type { TenantApplication } from '@/hooks/applications';

import ApplicationStatusCard from './ApplicationStatusCard';
import ApplicationsEmptyState from './ApplicationsEmptyState';
import ApplicationStatusCardSkeleton from './ApplicationStatusCardSkeleton';
import EmptyState from "@/components/display/EmptyState";
import { IconSearchOff } from "@tabler/icons-react-native";

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
        <EmptyState
          className="flex-1"
          icon={IconSearchOff}
          title="No Matching Applications"
          description="Try changing your filters to see more applications."
        />
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
