import { useState } from 'react';
import { Keyboard,Text,View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button,Input,Spinner,TextArea } from 'heroui-native';
import { canRequestLeaseRenewal,canTakeRenewalAction,formatPesoDisplay,previousLeaseDurationMonths,RENEWAL_DEPOSIT_NOTICE,renewalDefaultStart,renewalStatusLabel,type RenewalPortal } from '@repo/utils';
import ScreenWrapper from '@/components/layout/ScreenWrapper';
import StandardHeader from '@/components/layout/StandardHeader';
import AppDialog from '@/components/display/AppDialog';
import RenewalProposalForm from './RenewalProposalForm';
import RenewalPayment from './RenewalPayment';
import { useLeaseRenewal } from '@/hooks/tenancy/useLeaseRenewal';
import { buildConversationKey } from '@/service/chat/chatService';

interface LeaseRenewalScreenProps {tenancyId:string;portal:RenewalPortal}

export default function LeaseRenewalScreen({tenancyId,portal}:LeaseRenewalScreenProps) {
  const renewal=useLeaseRenewal(tenancyId,portal),router=useRouter();
  const [confirm,setConfirm]=useState<'not_renewing'|'decline'|null>(null),[reason,setReason]=useState(''),[duration,setDuration]=useState('');
  const c=renewal.data,r=c?.renewal,p=c?.proposals.find((proposal)=>proposal.id===r?.current_proposal_id);
  const allowed=(action:Parameters<typeof canTakeRenewalAction>[2])=>!!r&&canTakeRenewalAction(r.status,portal,action);
  const months=duration||String(c?previousLeaseDurationMonths(c.leaseStart,c.leaseEnd)??'':'');
  const ownConfirmation=c?.agreement&&(portal==='tenant'?c.agreement.tenant_confirmed_at:c.agreement.landlord_confirmed_at);
  return <ScreenWrapper scrollable className="p-5" refreshing={renewal.isRefetching} onRefresh={async()=>{await renewal.refetch();}}>
    <StandardHeader title="Lease renewal"/>
    <View className="gap-4">
    {renewal.isLoading?<Spinner/>:renewal.error||!c?<><Text accessibilityRole="alert" className="text-danger">{renewal.error instanceof Error?renewal.error.message:'Renewal unavailable.'}</Text><Button onPress={()=>void renewal.refetch()}><Button.Label>Retry</Button.Label></Button></>:<>
      <View className="gap-2 rounded-3xl border border-border bg-surface p-5">
        <Text className="font-nunitoBold text-xl text-foreground">{c.apartmentName}</Text><Text className="text-foreground">{c.tenantName}</Text>
        <Text className="text-foreground">Current lease: {c.leaseStart} – {c.leaseEnd??'No end date'}</Text><Text className="text-foreground">Monthly rent: {formatPesoDisplay(c.monthlyRent??0)}</Text>
        <Text className="text-muted">Recorded deposit target: {c.depositTarget===null?'Unknown':formatPesoDisplay(c.depositTarget)}. This is not a verified remaining balance.</Text>
        {c.originalAgreementPath&&<Button variant="outline" isDisabled={renewal.busy} onPress={()=>renewal.view(c.originalAgreementPath!,'signed-leases')}><Button.Label>View original agreement</Button.Label></Button>}
        {r&&<Text className="font-nunitoBold text-accent">{renewalStatusLabel(r.status,p?.lease_start??null,c.today)}</Text>}
      </View>
      {!r&&portal==='tenant'&&canRequestLeaseRenewal(c.leaseEnd,c.today,c.active)&&<View className="gap-3 rounded-3xl border border-border bg-surface p-5">
        <Text className="text-foreground">Same duration as the previous lease (months)</Text><Input accessibilityLabel="Previous lease duration in months" value={months} onChangeText={setDuration} keyboardType="number-pad"/>
        <Text className="text-muted">Proposed renewal start: {renewalDefaultStart(c.leaseEnd)}. You review the landlord&apos;s end date and final charges before accepting.</Text>
        <Button isDisabled={renewal.busy||!months} onPress={()=>{Keyboard.dismiss();renewal.act('request',{durationMonths:Number(months)});}}><Button.Label>Request Lease Renewal</Button.Label></Button>
        <Button variant="outline" isDisabled={renewal.busy} onPress={()=>setConfirm('not_renewing')}><Button.Label>I Will Not Renew</Button.Label></Button>
        <Button variant="ghost" onPress={()=>router.back()}><Button.Label>Decide Later</Button.Label></Button>
      </View>}
      {!r&&!canRequestLeaseRenewal(c.leaseEnd,c.today,c.active)&&<Text className="text-muted">Renewal requests open during the final 30 days of an active, dated lease. Missing or expired terms need review.</Text>}
      {allowed('approve')&&<Button isDisabled={renewal.busy} onPress={()=>renewal.act('approve')}><Button.Label>Approve request and prepare terms</Button.Label></Button>}
      {r&&allowed('propose')&&<RenewalProposalForm key={r.version} context={c} busy={renewal.busy} onSubmit={(draft,asset)=>{Keyboard.dismiss();renewal.propose(draft,asset);}}/>}
      {p&&<View className="gap-2 rounded-3xl border border-border bg-surface p-5">
        <Text className="font-nunitoBold text-xl text-foreground">Proposal {p.version}</Text><Text className="text-foreground">{p.lease_start} – {p.lease_end} · {p.duration_months} months</Text>
        <Text className="text-foreground">Monthly rent: {formatPesoDisplay(p.monthly_rent)}</Text><Text className="text-foreground">Advance covering {p.advance_period}: {formatPesoDisplay(p.monthly_rent*p.advance_months)}</Text>
        <Text className="text-foreground">Verified applicable credit: −{formatPesoDisplay(p.advance_credit)}</Text><Text className="text-foreground">Advance due: {formatPesoDisplay(p.advance_due)}</Text>
        <Text className="text-foreground">Declared retained deposit: {formatPesoDisplay(p.retained_deposit)}</Text><Text className="text-foreground">Deposit replenishment: {formatPesoDisplay(p.deposit_due)}</Text>
        {!!p.replenishment_reason&&<Text className="text-foreground">{p.replenishment_reason}</Text>}<Text className="text-muted">{RENEWAL_DEPOSIT_NOTICE}</Text>
        {p.evidence_path&&<Button variant="outline" isDisabled={renewal.busy} onPress={()=>renewal.view(p.evidence_path!)}><Button.Label>View supporting document</Button.Label></Button>}
        <Text className="font-nunitoBold text-foreground">Total renewal payment: {formatPesoDisplay(p.advance_due+p.deposit_due)}</Text>
        {allowed('accept')&&<Button isDisabled={renewal.busy} onPress={()=>renewal.act('accept',{proposalId:p.id})}><Button.Label>Accept Renewal Terms</Button.Label></Button>}
        {allowed('discuss')&&<Button variant="outline" onPress={()=>router.push({pathname:'/chat/[conversationId]',params:{conversationId:buildConversationKey(c.tenantId,c.landlordId,c.apartmentId),otherUserId:portal==='tenant'?c.landlordId:c.tenantId,apartmentId:c.apartmentId,apartmentTitle:c.apartmentName}})}><Button.Label>Discuss Charges — open messages</Button.Label></Button>}
      </View>}
      {r?.status==='awaiting_agreement_confirmation'&&p&&<View className="gap-3 rounded-3xl border border-border bg-surface p-5">
        <Text className="font-nunitoBold text-lg text-foreground">Renewal agreement</Text><Text className="text-muted">Both parties must confirm the executed agreement matches these dates, rent, deposit treatment, and payment conditions.</Text>
        {!c.agreement&&portal==='landlord'&&<Button isDisabled={renewal.busy} onPress={renewal.uploadAgreement}><Button.Label>Upload executed agreement</Button.Label></Button>}
        {!c.agreement&&portal==='tenant'&&<Text className="text-muted">Waiting for the landlord&apos;s agreement upload.</Text>}
        {c.agreement&&<><Button variant="outline" isDisabled={renewal.busy} onPress={()=>renewal.view(c.agreement!.path)}><Button.Label>View renewal agreement</Button.Label></Button>
          <Button isDisabled={!!ownConfirmation||renewal.busy} onPress={()=>renewal.act('confirm_agreement',{proposalId:p.id,path:c.agreement!.path})}><Button.Label>{ownConfirmation?'Your confirmation is saved':'I confirm this agreement matches the proposal'}</Button.Label></Button></>}
      </View>}
      {r&&p&&portal==='tenant'&&['awaiting_payment','payment_verification_pending'].includes(r.status)&&<RenewalPayment context={c} busy={renewal.busy} run={renewal.run}/>}
      {c.payment&&<Button variant="outline" onPress={()=>router.push(portal==='tenant'?{pathname:'/tenant/payment/success',params:{referenceId:c.payment!.referenceId??''}}:'/landlord/payments')}><Button.Label>View payment: {c.payment.status}</Button.Label></Button>}
      {c.proposals.map((history)=><View key={history.id} className="gap-2 rounded-2xl border border-border p-3"><Text className="text-foreground">Saved proposal: {history.lease_start} – {history.lease_end}, {formatPesoDisplay(history.monthly_rent)} monthly</Text>{history.agreement_path&&<Button variant="outline" onPress={()=>renewal.view(history.agreement_path!)}><Button.Label>View preserved agreement</Button.Label></Button>}</View>)}
      {allowed('decline')&&<Button variant="outline" isDisabled={renewal.busy} onPress={()=>setConfirm('decline')}><Button.Label>Decline Renewal</Button.Label></Button>}
      {c.events.length>0&&<View className="gap-2"><Text className="font-nunitoBold text-foreground">Renewal history</Text>{c.events.map((event)=><Text key={event.id} className="text-muted">{event.created_at.slice(0,10)} · {event.event.replaceAll('_',' ')}{event.reason?` — ${event.reason}`:''}</Text>)}</View>}
      {renewal.actionError&&<Text selectable accessibilityRole="alert" className="text-danger">{renewal.actionError} Refresh to confirm the saved state before repeating an action.</Text>}
      <Button variant="outline" isDisabled={renewal.busy} onPress={()=>void renewal.refetch()}><Button.Label>Refresh renewal</Button.Label></Button>
    </>}
    </View>
    <AppDialog isOpen={confirm!==null} onOpenChange={(open)=>{if(!open&&!renewal.isLocked())setConfirm(null);}} dismissible={!renewal.busy} title={confirm==='not_renewing'?'Confirm you will not renew':'Decline this renewal?'} footer={<View className="gap-2"><Button variant="outline" isDisabled={renewal.busy} onPress={()=>{if(!renewal.isLocked())setConfirm(null);}}><Button.Label>Cancel</Button.Label></Button><Button isDisabled={renewal.busy||(confirm==='decline'&&!reason.trim())} onPress={()=>{if(confirm)void renewal.act(confirm,{reason,durationMonths:Number(months)}).then((saved)=>{if(saved)setConfirm(null);});}}><Button.Label>Confirm decision</Button.Label></Button></View>}>
      <Text className="text-foreground">This records your decision and notifies the other party. It does not end the current tenancy.</Text>
      {confirm==='decline'&&<TextArea accessibilityLabel="Reason for declining" value={reason} onChangeText={setReason} maxLength={1000}/>}
      {renewal.actionError&&<Text accessibilityRole="alert" className="text-danger">{renewal.actionError}</Text>}
    </AppDialog>
  </ScreenWrapper>;
}
