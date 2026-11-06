import { useState } from "react";
import { Text, View } from "react-native";
import { Button, Input, Label, TextArea, TextField } from "heroui-native";
import { IconFileText, IconFileUpload } from "@tabler/icons-react-native";
import type { DocumentPickerAsset } from "expo-document-picker";
import { formatPesoDisplay, initialRenewalProposalDraft, lockedRenewalDurationMonths, RENEWAL_DEPOSIT_NOTICE, type LeaseRenewalContext, type RenewalProposalDraft } from "@repo/utils";
import DropdownField from "@/components/inputs/DropdownField";
import DetailField from "@/components/display/DetailField";
import { useColors } from "@/hooks/useTheme";
import { pickRenewalFile } from "@/service/tenancy/leaseRenewalService";
import { renewalDate } from "@/utils/renewalPresentation";
import RenewalSection from "./RenewalSection";
import RenewalNotice from "./RenewalNotice";

interface RenewalProposalFormProps {
  context: LeaseRenewalContext;
  busy: boolean;
  onSubmit: (draft: RenewalProposalDraft, asset: DocumentPickerAsset | null) => void;
}

export default function RenewalProposalForm({ context, busy, onSubmit }: RenewalProposalFormProps) {
  const [draft, setDraft] = useState(() => initialRenewalProposalDraft(context));
  const [asset, setAsset] = useState<DocumentPickerAsset | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const { colors } = useColors();
  const field = (name: keyof RenewalProposalDraft, value: string) => setDraft((s) => ({ ...s, [name]: value }));
  const lockedMonths = lockedRenewalDurationMonths(context);

  return (
    <RenewalSection title="Prepare renewal terms" description="Set the terms and payment for the tenant to review." icon={IconFileText}>
      <View className="gap-3 rounded-2xl bg-overlay p-3">
        <View className="flex-row"><DetailField label="Renewal start" value={renewalDate(context.renewal?.requested_start ?? null)} /></View>
        {lockedMonths === null ? <Text accessibilityRole="alert" className="font-inter text-sm text-danger">Previous lease length is unclear. The renewal needs review.</Text>
          : <View className="flex-row"><DetailField label="Duration · same as the previous lease" value={`${lockedMonths} months`} /></View>}
      </View>
      <Text className="font-nunitoBold text-base text-foreground">Lease details</Text>
      <TextField isDisabled={busy}>
        <Label>Monthly rent (₱)</Label>
        <Input accessibilityLabel="Monthly rent" keyboardType="decimal-pad" value={draft.monthlyRent} onChangeText={(v) => field("monthlyRent", v)} editable={!busy} />
      </TextField>
      <Text className="font-inter text-sm leading-5 text-muted">Rent may stay the same or decrease. For a mid-month start, the new billing rate and any advance apply to the first full calendar month. The current month is not charged twice.</Text>
      <View className="h-px bg-border" />
      <Text className="font-nunitoBold text-base text-foreground">Deposit treatment</Text>
      <View className="flex-row"><DetailField label="Recorded deposit target · not a verified balance" value={context.depositTarget === null ? "Unknown — needs review" : formatPesoDisplay(context.depositTarget)} /></View>
      <TextField isDisabled={busy}>
        <Label>Deposit still retained (₱)</Label>
        <Input accessibilityLabel="Declared retained deposit" keyboardType="decimal-pad" placeholder="Enter the amount you still hold" value={draft.retainedDeposit} onChangeText={(v) => field("retainedDeposit", v)} editable={!busy} />
      </TextField>
      <DropdownField label="Deposit replenishment" bottomSheetLabel="Deposit replenishment" options={["No replenishment needed", "Partial replenishment", "Full replenishment"]}
        value={{ none: "No replenishment needed", partial: "Partial replenishment", full: "Full replenishment" }[draft.replenishmentKind]}
        onSelect={(v) => field("replenishmentKind", v === "Full replenishment" ? "full" : v === "Partial replenishment" ? "partial" : "none")} disabled={busy} />
      <TextField isDisabled={busy}>
        <Label>Explanation for replenishment</Label>
        <TextArea accessibilityLabel="Explanation for replenishment" placeholder="Explain any deposit replenishment" value={draft.reason} onChangeText={(v) => field("reason", v)} maxLength={1000} editable={!busy} />
        <Text className="text-right font-inter text-xs text-muted">{draft.reason.length}/1,000</Text>
      </TextField>
      <View className="h-px bg-border" />
      <Text className="font-nunitoBold text-base text-foreground">Advance rent</Text>
      <DropdownField label="Advance rent" bottomSheetLabel="Advance rent" options={["None", "One month"]} value={draft.advanceMonths === "1" ? "One month" : "None"} onSelect={(v) => field("advanceMonths", v === "One month" ? "1" : "0")} disabled={busy} />
      <View className="h-px bg-border" />
      <Text className="font-nunitoBold text-base text-foreground">Supporting document</Text>
      <Text className="font-inter text-sm text-muted">Optional evidence for the proposed charges.</Text>
      {asset && <Text className="font-inter text-sm text-foreground">{asset.name}</Text>}
      <Button variant="outline" isDisabled={busy} onPress={() => {
        void pickRenewalFile().then((file) => { setAsset(file); setFileError(null); }).catch(() => setFileError("Could not choose the supporting document."));
      }}><IconFileUpload size={18} color={colors.textPrimary} /><Button.Label>{asset ? "Change document" : "Add document"}</Button.Label></Button>
      {fileError && <Text accessibilityRole="alert" className="font-inter text-sm text-danger">{fileError}</Text>}
      <RenewalNotice>{`${RENEWAL_DEPOSIT_NOTICE} Verified applicable credit is calculated by APT before the tenant reviews the final charges.`}</RenewalNotice>
      <Button isDisabled={busy || lockedMonths === null} onPress={() => onSubmit(draft, asset)}><Button.Label>Send proposal for review</Button.Label></Button>
    </RenewalSection>
  );
}
