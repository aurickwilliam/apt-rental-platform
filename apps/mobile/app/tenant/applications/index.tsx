import ScreenWrapper from 'components/layout/ScreenWrapper';
import ApplicationsList from '@/app/(tabs)/components/rentals/ApplicationList';

export default function ApplicationsPage() {
  return (
    <ScreenWrapper scrollable className="p-5">
      <ApplicationsList />
    </ScreenWrapper>
  );
}