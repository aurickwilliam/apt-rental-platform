import type { ReactNode } from "react";
import { Text, View } from "react-native";
import { Button } from "heroui-native";
import { IconCoins } from "@tabler/icons-react-native";
import { RENEWAL_DEPOSIT_NOTICE, type LeaseRenewalProposal } from "@repo/utils";
import DetailField from "@/components/display/DetailField";
import MoneyRow from "@/components/finance/MoneyRow";
import { renewalDate } from "@/utils/renewalPresentation";
import RenewalSection from "./RenewalSection";
import RenewalNotice from "./RenewalNotice";

interface RenewalProposalCardProps {
  proposal: LeaseRenewalProposal;
  busy: boolean;
  onViewEvidence: () => void;
  children?: ReactNode;
}

export default function RenewalProposalCard({ proposal: p, busy, onViewEvidence, children }: RenewalProposalCardProps) {
  return (
    <RenewalSection title="Proposed renewal terms" description={`Proposal ${p.version} · ${p.duration_months} months`} icon={IconCoins}>
      <View className="gap-3 rounded-2xl bg-overlay p-3">
        <View className="flex-row"><DetailField label="Renewal period" value={`${renewalDate(p.lease_start)} – ${renewalDate(p.lease_end)}`} /></View>
        <MoneyRow label="Monthly rent" amount={p.monthly_rent} />
      </View>
      <Text className="font-nunitoBold text-base text-foreground">Advance rent</Text>
      <MoneyRow label={`Advance covering ${renewalDate(p.advance_period)}`} amount={p.monthly_rent * p.advance_months} />
      <MoneyRow label="Verified applicable credit (deducted)" amount={p.advance_credit} />
      <MoneyRow label="Advance due" amount={p.advance_due} emphasized />
      <View className="h-px bg-border" />
      <Text className="font-nunitoBold text-base text-foreground">Deposit treatment</Text>
      <MoneyRow label="Recorded deposit target" amount={p.deposit_target} />
      <MoneyRow label="Declared retained deposit" amount={p.retained_deposit} />
      <MoneyRow label="Deposit replenishment" amount={p.deposit_due} />
      {!!p.replenishment_reason && <Text selectable className="font-inter text-sm leading-5 text-foreground">{p.replenishment_reason}</Text>}
      <RenewalNotice>{RENEWAL_DEPOSIT_NOTICE}</RenewalNotice>
      {p.evidence_path && <Button variant="outline" isDisabled={busy} onPress={onViewEvidence}><Button.Label>View supporting document</Button.Label></Button>}
      <View className="rounded-2xl bg-primary-light p-4">
        <MoneyRow label="Total renewal payment" amount={p.advance_due + p.deposit_due} emphasized />
      </View>
      {children}
    </RenewalSection>
  );
}
