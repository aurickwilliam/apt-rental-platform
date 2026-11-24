"use client";

import { useState } from 'react';
import { Button } from '@heroui/react';
import type { BankCode } from '@repo/constants';
import { generatePaymentReference, type LeaseRenewalContext, type PaymentMethod } from '@repo/utils';
import { createCashPayment } from '@/service/paymentService';
import { createCheckoutSession, getCheckoutSessionStatus, cancelCheckoutSession } from '@/service/paymongoService';
import { useAcceptedPaymentMethods } from '@/hooks/use-accepted-payment-methods';
import PaymentMethodSelector from '@/app/tenant/payment/components/PaymentMethodSelector';

interface RenewalPaymentProps { context:LeaseRenewalContext;busy:boolean;run:(operation:(isCurrent:()=>boolean)=>Promise<unknown>)=>Promise<unknown> }

export default function RenewalPayment({context:c,busy,run}:RenewalPaymentProps) {
  const methods=useAcceptedPaymentMethods(c.tenancyId);
  const [method,setMethod]=useState<PaymentMethod|null>(null);
  const [date,setDate]=useState<Date|null>(null);
  const [bank,setBank]=useState<BankCode|null>(null);
  const p=c.proposals.find((proposal)=>proposal.id===c.renewal?.current_proposal_id);
  if(!p) return null;
  const total=p.advance_due+p.deposit_due;
  const pending=c.payment?.status==='pending';
  const session=c.payment?.sessionId;
  async function pay(isCurrent:()=>boolean) {
    if(!isCurrent())throw new Error('Reopen this renewal before paying.');
    if(!p||!method||!methods.acceptedMethods.includes(method)) throw new Error('Choose an accepted payment method.');
    const referenceId=generatePaymentReference();
    if(method==='Cash') {
      if(!date) throw new Error('Choose the cash payment date.');
      const paymentDate=`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
      if(paymentDate>c.today) throw new Error('A cash payment date cannot be in the future.');
      await createCashPayment({referenceId,renewalProposalId:p.id,amount:total,date:paymentDate,
        tenancyId:c.tenancyId,tenantId:c.tenantId,apartmentId:c.apartmentId,
        periodStart:p.advance_period,periodEnd:null,dueDate:p.lease_start});
      return;
    }
    if(method==='Bank Transfer'&&!bank) throw new Error('Choose your bank.');
    const map={'GCash':'gcash','Maya':'maya','QRPh':'qrph','Bank Transfer':'bank_transfer','Debit/Credit-Card':'card'} as const;
    const session=await createCheckoutSession({referenceId,renewalProposalId:p.id,amount:total,
      description:'APT Lease Renewal',redirectBaseUrl:`${window.location.origin}/tenant/payment/verify`,
      tenancyId:c.tenancyId,periodStart:p.advance_period,method:map[method],...(bank?{bankCode:bank}:{})});
    if(isCurrent())window.location.assign(session.checkoutUrl);
  }
  return <section className="grid gap-3 rounded-2xl border border-border bg-card p-5" data-fab-clearance>
    <h2 className="font-nunito text-xl font-bold">Lease renewal payment</h2>
    {pending?<><p>Payment is awaiting verification. Do not submit another payment.</p>
      {session&&<><Button isDisabled={busy} onPress={()=>void run(()=>getCheckoutSessionStatus(session))}>Check payment</Button>
      <Button variant="outline" isDisabled={busy} onPress={()=>void run(()=>cancelCheckoutSession(session))}>Cancel unfinished online payment</Button></>}
      {!session&&<p>Cash awaits landlord confirmation. An online attempt without a provider reference needs reconciliation; do not retry blindly.</p>}
    </>:<><PaymentMethodSelector selectedMethod={method} onPaymentMethodChange={setMethod}
      cashPaymentDate={date} onCashPaymentDateChange={setDate} isCashPaymentPending={false}
      acceptedMethods={methods.acceptedMethods} methodsLoading={methods.loading} methodsError={methods.error}
      onRetryMethods={()=>void methods.refresh()} amount={total} selectedBank={bank} onBankChange={setBank}/>
      <Button isDisabled={busy||!method||methods.loading||!!methods.error||!methods.acceptedMethods.includes(method)} onPress={()=>void run(pay)}>Pay renewal</Button></>}
  </section>;
}
