import { useState } from 'react';
import { Text,View } from 'react-native';
import { Button,Input,TextArea } from 'heroui-native';
import type { DocumentPickerAsset } from 'expo-document-picker';
import { initialRenewalProposalDraft,RENEWAL_DEPOSIT_NOTICE,type LeaseRenewalContext,type RenewalProposalDraft } from '@repo/utils';
import DropdownField from '@/components/inputs/DropdownField';
import { pickRenewalFile } from '@/service/tenancy/leaseRenewalService';

interface RenewalProposalFormProps {context:LeaseRenewalContext;busy:boolean;onSubmit:(draft:RenewalProposalDraft,asset:DocumentPickerAsset|null)=>void}

export default function RenewalProposalForm({context,busy,onSubmit}:RenewalProposalFormProps) {
  const [draft,setDraft]=useState(()=>initialRenewalProposalDraft(context));
  const [asset,setAsset]=useState<DocumentPickerAsset|null>(null);
  const [fileError,setFileError]=useState<string|null>(null);
  const field=(name:keyof RenewalProposalDraft,value:string)=>setDraft((s)=>({...s,[name]:value}));
  return <View className="gap-3 rounded-3xl border border-border bg-surface p-5">
    <Text className="font-nunitoBold text-xl text-foreground">Prepare renewal terms</Text>
    <Text className="text-muted">Start: {context.renewal?.requested_start}. Rent may stay the same or decrease. For a mid-month start, the new billing rate and any advance apply to the first full calendar month. The current month is not charged twice.</Text>
    <Text className="text-foreground">Monthly rent (₱)</Text><Input accessibilityLabel="Monthly rent" keyboardType="decimal-pad" value={draft.monthlyRent} onChangeText={(v)=>field('monthlyRent',v)} editable={!busy}/>
    <Text className="text-foreground">Duration (months)</Text><Input accessibilityLabel="Renewal duration in months" keyboardType="number-pad" value={draft.durationMonths} onChangeText={(v)=>field('durationMonths',v)} editable={!busy}/>
    <Text className="text-foreground">Recorded deposit target: {context.depositTarget===null?'Unknown — needs review':`₱${context.depositTarget.toLocaleString()}`}. This is not a verified balance.</Text>
    <Text className="text-foreground">Deposit you declare is still retained (₱)</Text><Input accessibilityLabel="Declared retained deposit" keyboardType="decimal-pad" value={draft.retainedDeposit} onChangeText={(v)=>field('retainedDeposit',v)} editable={!busy}/>
    <DropdownField label="Deposit replenishment" bottomSheetLabel="Deposit replenishment" options={['No replenishment needed','Partial replenishment','Full replenishment']} value={{none:'No replenishment needed',partial:'Partial replenishment',full:'Full replenishment'}[draft.replenishmentKind]} onSelect={(v)=>field('replenishmentKind',v==='Full replenishment'?'full':v==='Partial replenishment'?'partial':'none')} disabled={busy}/>
    <DropdownField label="Advance rent" bottomSheetLabel="Advance rent" options={['None','One month']} value={draft.advanceMonths==='1'?'One month':'None'} onSelect={(v)=>field('advanceMonths',v==='One month'?'1':'0')} disabled={busy}/>
    <Text className="text-foreground">Explanation for replenishment</Text><TextArea accessibilityLabel="Explanation for replenishment" value={draft.reason} onChangeText={(v)=>field('reason',v)} maxLength={1000} editable={!busy}/>
    <Button variant="outline" isDisabled={busy} onPress={()=>{void pickRenewalFile().then((file)=>{setAsset(file);setFileError(null);}).catch(()=>setFileError('Could not choose the supporting document.'));}}><Button.Label>{asset?asset.name:'Add supporting document (optional)'}</Button.Label></Button>
    {fileError&&<Text accessibilityRole="alert" className="text-danger">{fileError}</Text>}
    <Text className="text-muted">{RENEWAL_DEPOSIT_NOTICE} Verified applicable credit is calculated by APT before the tenant reviews the final charges.</Text>
    <Button isDisabled={busy} onPress={()=>onSubmit(draft,asset)}><Button.Label>Send proposal for review</Button.Label></Button>
  </View>;
}
