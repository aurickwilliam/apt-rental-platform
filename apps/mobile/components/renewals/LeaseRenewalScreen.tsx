import { useState } from "react";
import { Keyboard, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Button, Label, Spinner, TextArea } from "heroui-native";
import { IconCalendar, IconCheck, IconClock, IconFileText, IconHistory, IconRefresh } from "@tabler/icons-react-native";
import { canRequestLeaseRenewal, canTakeRenewalAction, formatPesoDisplay, lockedRenewalDurationMonths, renewalDefaultStart, type RenewalPortal } from "@repo/utils";
import ScreenWrapper from "@/components/layout/ScreenWrapper";
import StandardHeader from "@/components/layout/StandardHeader";
import AppDialog from "@/components/display/AppDialog";
import DetailField from "@/components/display/DetailField";
import EmptyState from "@/components/display/EmptyState";
import { useLeaseRenewal } from "@/hooks/tenancy/useLeaseRenewal";
import { useColors } from "@/hooks/useTheme";
import { buildConversationKey } from "@/service/chat/chatService";
import { renewalDate, renewalEventLabel } from "@/utils/renewalPresentation";
import RenewalSection from "./RenewalSection";
import RenewalNotice from "./RenewalNotice";
import RenewalProgress from "./RenewalProgress";
import RenewalProposalCard from "./RenewalProposalCard";
import RenewalSavedProposal from "./RenewalSavedProposal";
import RenewalProposalForm from "./RenewalProposalForm";
import RenewalPayment from "./RenewalPayment";

interface LeaseRenewalScreenProps { tenancyId: string; portal: RenewalPortal }

export default function LeaseRenewalScreen({ tenancyId, portal }: LeaseRenewalScreenProps) {
  const renewal = useLeaseRenewal(tenancyId, portal);
  const router = useRouter();
  const { colors } = useColors();
  const [confirm, setConfirm] = useState<"not_renewing" | "decline" | null>(null);
  const [reason, setReason] = useState("");
  const c = renewal.data;
  const r = c?.renewal;
  const p = c?.proposals.find((proposal) => proposal.id === r?.current_proposal_id);
  const allowed = (action: Parameters<typeof canTakeRenewalAction>[2]) => !!r && canTakeRenewalAction(r.status, portal, action);
  const lockedMonths = c ? lockedRenewalDurationMonths(c) : null;
  const ownConfirmation = c?.agreement && (portal === "tenant" ? c.agreement.tenant_confirmed_at : c.agreement.landlord_confirmed_at);

  return (
    <ScreenWrapper header={<StandardHeader title="Lease renewal" />} scrollable className="px-5 pt-4 pb-5"
      refreshing={renewal.isRefetching} onRefresh={async () => { await renewal.refetch(); }}>
      <View className="gap-5">
        {renewal.isLoading ? (
          <RenewalSection title="Loading renewal" icon={IconFileText}>
            <View className="flex-row items-center gap-3 py-4"><Spinner accessibilityLabel="Loading renewal details" /><Text className="font-inter text-sm text-muted">Getting your lease details…</Text></View>
          </RenewalSection>
        ) : renewal.error || !c ? (
          <RenewalSection title="Renewal unavailable" icon={IconFileText}>
            <Text selectable accessibilityRole="alert" className="font-inter text-sm leading-5 text-danger">{renewal.error instanceof Error ? renewal.error.message : "Renewal unavailable."}</Text>
            <Button variant="secondary" onPress={() => void renewal.refetch()}><Button.Label>Retry</Button.Label></Button>
          </RenewalSection>
        ) : <>
          <View className="gap-1">
            <Text className="font-nunitoBold text-xl text-foreground">{c.apartmentName}</Text>
            <Text className="font-inter text-sm text-muted">Tenant · {c.tenantName}</Text>
          </View>
          {renewal.actionError && <View className="rounded-2xl border border-danger bg-surface p-4">
            <Text selectable accessibilityRole="alert" className="font-inter text-sm leading-5 text-danger">{renewal.actionError} Refresh to confirm the saved state before repeating an action.</Text>
          </View>}
          <RenewalSection title="Current agreed lease" description="Your existing agreement and key details." icon={IconFileText}>
            <View className="flex-row"><DetailField label="Lease period" value={`${renewalDate(c.leaseStart)} – ${renewalDate(c.leaseEnd)}`} /></View>
            <View className="h-px bg-border" />
            <View className="flex-row"><DetailField label="Monthly rent" value={c.monthlyRent === null ? "Not recorded" : formatPesoDisplay(c.monthlyRent)} /></View>
            <View className="flex-row"><DetailField label="Recorded deposit target" value={c.depositTarget === null ? "Unknown" : formatPesoDisplay(c.depositTarget)} /></View>
            <RenewalNotice>The recorded deposit is not a verified remaining balance. Renewal does not end your current tenancy early.</RenewalNotice>
            {c.originalAgreementPath && <Button variant="outline" isDisabled={renewal.busy} onPress={() => renewal.view(c.originalAgreementPath!, "signed-leases")}>
              <IconFileText size={18} color={colors.textPrimary} /><Button.Label>View original agreement</Button.Label>
            </Button>}
          </RenewalSection>
          <RenewalProgress status={r?.status ?? null} portal={portal} start={p?.lease_start ?? null} today={c.today} />

          {!r && portal === "tenant" && canRequestLeaseRenewal(c.leaseEnd, c.today, c.active) && (
            <RenewalSection title="Would you like to renew?" description="Continue your stay with a new agreed lease." icon={IconCalendar}>
              {lockedMonths === null ? <Text accessibilityRole="alert" className="font-inter text-sm text-danger">Previous lease length is unclear. The renewal needs review.</Text>
                : <View className="flex-row"><DetailField label="Same duration as your current lease" value={`${lockedMonths} months`} /></View>}
              <View className="flex-row"><DetailField label="Proposed renewal start" value={renewalDate(renewalDefaultStart(c.leaseEnd))} /></View>
              <Text className="font-inter text-sm leading-5 text-muted">The landlord will send the end date and final charges for your review before you accept.</Text>
              <Button isDisabled={renewal.busy || lockedMonths === null} onPress={() => { Keyboard.dismiss(); void renewal.act("request", { durationMonths: lockedMonths }); }}><Button.Label>Request Lease Renewal</Button.Label></Button>
              <Button variant="outline" isDisabled={renewal.busy} onPress={() => setConfirm("not_renewing")}><Button.Label>I Will Not Renew</Button.Label></Button>
              <Button variant="ghost" onPress={() => router.back()}><Button.Label>Decide Later</Button.Label></Button>
            </RenewalSection>
          )}
          {!r && !canRequestLeaseRenewal(c.leaseEnd, c.today, c.active) && <RenewalNotice>Renewal requests open during the final 30 days of an active, dated lease. Missing or expired terms need review.</RenewalNotice>}

          {(allowed("approve") || allowed("decline")) && <RenewalSection title={portal === "landlord" ? "Renewal decision" : "Your renewal request"}
            description={allowed("approve") ? "Approve the request to prepare the renewal terms, or decline." : "You can decline this renewal before it is finalized. This does not end the current tenancy."} icon={IconCheck}>
            {allowed("approve") && <Button isDisabled={renewal.busy} onPress={() => void renewal.act("approve")}><Button.Label>Approve request</Button.Label></Button>}
            {allowed("decline") && <Button variant="outline" isDisabled={renewal.busy} onPress={() => setConfirm("decline")}><Button.Label>Decline Renewal</Button.Label></Button>}
          </RenewalSection>}
          {r && allowed("propose") && <RenewalProposalForm key={r.version} context={c} busy={renewal.busy} onSubmit={(draft, asset) => { Keyboard.dismiss(); renewal.propose(draft, asset); }} />}
          {p && <RenewalProposalCard proposal={p} busy={renewal.busy} onViewEvidence={() => { if (p.evidence_path) renewal.view(p.evidence_path); }}>
            {allowed("accept") && <Button isDisabled={renewal.busy} onPress={() => void renewal.act("accept", { proposalId: p.id })}><Button.Label>Accept Renewal Terms</Button.Label></Button>}
            {allowed("discuss") && <Button variant="secondary" onPress={() => router.push({ pathname: "/chat/[conversationId]", params: {
              conversationId: buildConversationKey(c.tenantId, c.landlordId, c.apartmentId), otherUserId: portal === "tenant" ? c.landlordId : c.tenantId, apartmentId: c.apartmentId, apartmentTitle: c.apartmentName,
            } })}><Button.Label>Discuss charges</Button.Label></Button>}
          </RenewalProposalCard>}

          {r?.status === "awaiting_agreement_confirmation" && p && <RenewalSection title="Renewal agreement" description="Both parties must confirm the executed agreement matches the proposal, including dates, rent, deposit treatment and payment conditions." icon={IconFileText}>
            {!c.agreement && portal === "landlord" && <Button isDisabled={renewal.busy} onPress={renewal.uploadAgreement}><Button.Label>Upload signed agreement</Button.Label></Button>}
            {!c.agreement && portal === "tenant" && <RenewalNotice>Waiting for the landlord to upload the signed renewal agreement.</RenewalNotice>}
            {c.agreement && <>
              <Button variant="outline" isDisabled={renewal.busy} onPress={() => renewal.view(c.agreement!.path)}><Button.Label>View renewal agreement</Button.Label></Button>
              <Text className="font-inter text-sm leading-5 text-muted">By confirming, you agree that this document matches the proposal above.</Text>
              <Button isDisabled={!!ownConfirmation || renewal.busy} onPress={() => void renewal.act("confirm_agreement", { proposalId: p.id, path: c.agreement!.path })}><Button.Label>{ownConfirmation ? "Confirmation saved" : "Confirm agreement"}</Button.Label></Button>
            </>}
          </RenewalSection>}
          {r && p && portal === "tenant" && ["awaiting_payment", "payment_verification_pending"].includes(r.status) && <RenewalPayment key={p.id} context={c} busy={renewal.busy} run={renewal.run} />}
          {c.payment && <RenewalSection title="Payment record" description={`Payment status: ${c.payment.status}`} icon={IconCheck}>
            <Button variant="secondary" onPress={() => router.push(portal === "tenant" ? { pathname: "/tenant/payment/success", params: { referenceId: c.payment!.referenceId ?? "" } } : "/landlord/payments")}><Button.Label>View payment</Button.Label></Button>
          </RenewalSection>}

          {c.proposals.length > 0 && <RenewalSection title="Saved proposals" description="Review the recorded terms and preserved agreements." icon={IconFileText}>
            {c.proposals.map((history) => <RenewalSavedProposal key={history.id} proposal={history} busy={renewal.busy} onView={() => { if (history.agreement_path) renewal.view(history.agreement_path); }} />)}
          </RenewalSection>}
          <RenewalSection title="Renewal history" description="A record of requests, proposals and decisions." icon={IconHistory}>
            {c.events.length === 0 ? <EmptyState className="py-4" icon={IconHistory} title="No renewal actions yet" description="Your renewal activity will appear here." /> : c.events.map((event) => (
              <View key={event.id} className="flex-row items-start gap-3 rounded-2xl bg-overlay p-3">
                <IconClock size={18} color={colors.textSecondary} />
                <View className="min-w-0 flex-1 gap-1">
                  <Text className="font-nunitoSemiBold text-sm text-foreground">{renewalEventLabel(event.event)}</Text>
                  <Text className="font-inter text-xs text-muted">{renewalDate(event.created_at)}</Text>
                  {!!event.reason && <Text selectable className="font-inter text-sm leading-5 text-muted">{event.reason}</Text>}
                </View>
              </View>
            ))}
            <Button variant="outline" isDisabled={renewal.busy} onPress={() => void renewal.refetch()}><IconRefresh size={18} color={colors.textPrimary} /><Button.Label>Refresh renewal</Button.Label></Button>
          </RenewalSection>
        </>}
      </View>
      <AppDialog isOpen={confirm !== null} onOpenChange={(open) => { if (!open && !renewal.isLocked()) setConfirm(null); }} dismissible={!renewal.busy}
        title={confirm === "not_renewing" ? "Confirm you will not renew" : "Decline this renewal?"}
        footer={<View className="gap-2">
          <Button variant="outline" isDisabled={renewal.busy} onPress={() => { if (!renewal.isLocked()) setConfirm(null); }}><Button.Label>Cancel</Button.Label></Button>
          <Button isDisabled={renewal.busy || (confirm === "decline" && !reason.trim())} onPress={() => {
            if (confirm) void renewal.act(confirm, { reason, durationMonths: lockedMonths }).then((saved) => { if (saved) setConfirm(null); });
          }}><Button.Label>Confirm decision</Button.Label></Button>
        </View>}>
        <Text className="font-inter text-sm leading-5 text-foreground">This records your decision and notifies the other party. It does not end the current tenancy.</Text>
        {confirm === "decline" && <View className="gap-2"><Label>Reason for declining</Label><TextArea accessibilityLabel="Reason for declining" value={reason} onChangeText={setReason} maxLength={1000} editable={!renewal.busy} /></View>}
        {renewal.actionError && <Text accessibilityRole="alert" className="font-inter text-sm text-danger">{renewal.actionError}</Text>}
      </AppDialog>
    </ScreenWrapper>
  );
}
