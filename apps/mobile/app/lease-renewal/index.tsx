import { useState } from 'react';
import { Text,View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Button,Spinner } from 'heroui-native';
import { IconFileText } from '@tabler/icons-react-native';
import ScreenWrapper from '@/components/layout/ScreenWrapper';
import StandardHeader from '@/components/layout/StandardHeader';
import EmptyState from '@/components/display/EmptyState';
import { usePortalStore } from '@/stores/usePortalStore';
import { fetchRenewalRequests } from '@/service/tenancy/leaseRenewalService';
import { RENEWAL_STATUS_LABELS } from '@repo/utils';

export default function RenewalRequestsScreen() {
  const authId=usePortalStore((s)=>s.authUserId),portal=usePortalStore((s)=>s.portal),router=useRouter();
  const [cursor,setCursor]=useState<{before:string;id:string}|null>(null);
  const query=useQuery({queryKey:['lease-renewal-list',authId,portal,cursor],queryFn:()=>fetchRenewalRequests(cursor),enabled:!!authId&&portal==='landlord'});
  const items=query.data??[],shown=items.slice(0,25),last=shown.at(-1);
  return <ScreenWrapper scrollable className="p-5"><StandardHeader title="Lease renewals"/><View className="gap-3">
    {portal!=='landlord'?<Text className="text-muted">Open Rentals to manage your own renewal.</Text>:query.isLoading?<Spinner/>:query.error?<><Text accessibilityRole="alert" className="text-danger">Could not load renewal requests.</Text><Button onPress={()=>void query.refetch()}><Button.Label>Retry</Button.Label></Button></>:shown.length===0?<EmptyState icon={IconFileText} title="No renewal requests" description="Requests from existing tenants will appear here."/>:shown.map((item)=><View key={item.id} className="gap-2 rounded-2xl border border-border bg-surface p-4"><Text className="font-nunitoBold text-foreground">{item.apartment_name}</Text><Text className="text-muted">{item.tenant_name} · {RENEWAL_STATUS_LABELS[item.status]}</Text><Button variant="outline" onPress={()=>router.push({pathname:'/lease-renewal/[tenancyId]',params:{tenancyId:item.tenancy_id}})}><Button.Label>Review renewal</Button.Label></Button></View>)}
    {items.length>25&&last&&<Button variant="outline" onPress={()=>setCursor({before:last.updated_at,id:last.id})}><Button.Label>Next page</Button.Label></Button>}
    {cursor&&<Button variant="ghost" onPress={()=>setCursor(null)}><Button.Label>Newest requests</Button.Label></Button>}
  </View></ScreenWrapper>;
}
