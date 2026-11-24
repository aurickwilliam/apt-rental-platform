import { Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { usePortalStore } from '@/stores/usePortalStore';
import LeaseRenewalScreen from '@/components/renewals/LeaseRenewalScreen';

export default function LeaseRenewalRoute() {
  const {tenancyId}=useLocalSearchParams<{tenancyId:string}>();
  const portal=usePortalStore((s)=>s.portal),authId=usePortalStore((s)=>s.authUserId);
  if(!authId||(portal!=='tenant'&&portal!=='landlord')||typeof tenancyId!=='string')return <Text>Reopen your rental or property to view renewal.</Text>;
  return <LeaseRenewalScreen key={`${authId}:${portal}:${tenancyId}`} tenancyId={tenancyId} portal={portal}/>;
}
