import { useState } from 'react';
import { Linking,Text,View } from 'react-native';
import * as ExpoLinking from 'expo-linking';
import { Button } from 'heroui-native';
import type { BankCode } from '@repo/constants';
import { generatePaymentReference,type LeaseRenewalContext,type PaymentMethod } from '@repo/utils';
import { useAcceptedPaymentMethods } from '@/hooks/payments/useAcceptedPaymentMethods';
import { usePortalStore } from '@/stores/usePortalStore';
import { createCashPayment } from '@/service/payments/paymentService';
import { createCheckoutSession,getCheckoutSessionStatus,cancelCheckoutSession } from '@/service/payments/paymongoService';
import PaymentMethodSelector from '@/app/tenant/payment/components/PaymentMethodSelector';

interface RenewalPaymentProps {context:LeaseRenewalContext;busy:boolean;run:(operation:(isCurrent:()=>boolean)=>Promise<unknown>)=>Promise<boolean>}

export default function RenewalPayment({context:c,busy,run}:RenewalPaymentProps) {
  const authId=usePortalStore((s)=>s.authUserId);
  const methods=useAcceptedPaymentMethods(authId,c.tenancyId);
  const [method,setMethod]=useState<PaymentMethod|null>(null),[date,setDate]=useState<Date|null>(null),[bank,setBank]=useState<BankCode|null>(null);
  const p=c.proposals.find((proposal)=>proposal.id===c.renewal?.current_proposal_id);
  if(!p)return null;
  const total=p.advance_due+p.deposit_due,session=c.payment?.sessionId;
  async function pay(isCurrent:()=>boolean) {
    if(!isCurrent())throw new Error('Reopen this renewal before paying.');
    if(!p||!method||!methods.acceptedMethods.includes(method))throw new Error('Choose an accepted payment method.');
    if(usePortalStore.getState().authUserId!==authId||usePortalStore.getState().portal!=='tenant')throw new Error('Your session changed. Reopen Rentals.');
    const referenceId=generatePaymentReference();
    if(method==='Cash') {
      if(!date)throw new Error('Choose the cash payment date.');
      const paymentDate=`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
      if(paymentDate>c.today)throw new Error('A cash payment date cannot be in the future.');
      await createCashPayment({renewalProposalId:p.id,referenceId,amount:total,date:paymentDate,
        tenancyId:c.tenancyId,tenantId:c.tenantId,apartmentId:c.apartmentId,periodStart:p.advance_period,periodEnd:null,dueDate:p.lease_start});return;
    }
    if(method==='Bank Transfer'&&!bank)throw new Error('Choose your bank.');
    const map={'GCash':'gcash','Maya':'maya','QRPh':'qrph','Bank Transfer':'bank_transfer','Debit/Credit-Card':'card'} as const;
    const session=await createCheckoutSession({renewalProposalId:p.id,referenceId,amount:total,description:'APT Lease Renewal',
      redirectBaseUrl:ExpoLinking.createURL('/tenant/payment/verify'),tenancyId:c.tenancyId,periodStart:p.advance_period,
      method:map[method],...(bank?{bankCode:bank}:{})});
    if(isCurrent()&&usePortalStore.getState().authUserId===authId)await Linking.openURL(session.checkoutUrl);
  }
  return <View className="gap-3 rounded-3xl border border-border bg-surface p-5">
    <Text className="text-xl font-nunitoBold text-foreground">Lease renewal payment</Text>
    {c.payment?.status==='pending'?<><Text className="text-muted">Awaiting payment verification. Do not submit another payment.</Text>
      {session?<><Button isDisabled={busy} onPress={()=>run(()=>getCheckoutSessionStatus(session))}><Button.Label>Check payment</Button.Label></Button>
        <Button variant="outline" isDisabled={busy} onPress={()=>run(()=>cancelCheckoutSession(session))}><Button.Label>Cancel unfinished online payment</Button.Label></Button></>
        :<Text className="text-muted">Cash awaits landlord confirmation. An online attempt without a provider reference needs reconciliation before retry.</Text>}</>
      :<><PaymentMethodSelector selectedMethod={method} onPaymentMethodChange={setMethod} cashPaymentDate={date} onCashPaymentDateChange={setDate}
        acceptedMethods={methods.acceptedMethods} methodsLoading={methods.loading} methodsError={methods.error}
        onRetryMethods={()=>void methods.refetch()} amount={total} selectedBank={bank} onBankChange={setBank}/>
      <Button isDisabled={busy||!method||methods.loading||!!methods.error||!methods.acceptedMethods.includes(method)} onPress={()=>run(pay)}><Button.Label>Pay renewal</Button.Label></Button></>}
  </View>;
}
