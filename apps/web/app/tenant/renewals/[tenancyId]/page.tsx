import { requirePortalViewer } from '@/lib/server-identity';
import LeaseRenewalClient from '@/app/components/renewals/LeaseRenewalClient';

export default async function RenewalPage({ params }: { params: Promise<{tenancyId:string}> }) {
  const { user } = await requirePortalViewer('tenant');
  const { tenancyId } = await params;
  return <LeaseRenewalClient tenancyId={tenancyId} portal="tenant" authUserId={user.id}/>;
}
