import { useState } from "react";
import { Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Button } from "heroui-native";
import { IconCalendar } from "@tabler/icons-react-native";
import { useQuery } from "@tanstack/react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { canRequestLeaseRenewal, renewalDaysRemaining, renewalReminderMilestone, type RenewalPortal } from "@repo/utils";
import { useLeaseRenewal } from "@/hooks/tenancy/useLeaseRenewal";
import { usePortalStore } from "@/stores/usePortalStore";
import { renewalDate } from "@/utils/renewalPresentation";
import AppDialog from "@/components/display/AppDialog";
import RenewalSection from "./RenewalSection";
import RenewalStatusChip from "./RenewalStatusChip";

interface LeaseRenewalEntryProps { tenancyId: string; portal: RenewalPortal }

export default function LeaseRenewalEntry({ tenancyId, portal }: LeaseRenewalEntryProps) {
  const renewal = useLeaseRenewal(tenancyId, portal);
  const router = useRouter();
  const c = renewal.data;
  const authId = usePortalStore((s) => s.authUserId);
  const [dismissedFor, setDismissedFor] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);
  const focused = renewal.focused;
  const milestone = c ? renewalReminderMilestone(renewalDaysRemaining(c.leaseEnd, c.today) ?? -1) : null;
  const key = `apt-renewal-prompt:v1:${authId}:${tenancyId}:${c?.leaseEnd ?? "none"}:${milestone}`;
  const seen = useQuery({ queryKey: ["renewal-prompt-dismissal", key], queryFn: () => AsyncStorage.getItem(key), enabled: !!c && !!authId });
  const close = () => {
    if (renewal.isLocked()) return;
    setDismissedFor(key);
    setConfirm(false);
    void AsyncStorage.setItem(key, "seen").catch(() => { /* Local dismissal still lasts for this mount. */ });
  };
  const open = () => { close(); router.push({ pathname: "/lease-renewal/[tenancyId]", params: { tenancyId } }); };
  if (!c) return renewal.error ? (
    <RenewalSection title="Lease renewal" icon={IconCalendar}>
      <Text className="font-inter text-sm text-muted">Lease renewal details could not load.</Text>
      <Button variant="secondary" onPress={() => void renewal.refetch()}><Button.Label>Retry renewal details</Button.Label></Button>
    </RenewalSection>
  ) : null;
  const eligible = portal === "tenant" && !c.renewal && canRequestLeaseRenewal(c.leaseEnd, c.today, c.active);
  const currentProposal = c.proposals.find((p) => p.id === c.renewal?.current_proposal_id);

  return <>
    <RenewalSection title="Lease renewal" description={`Current lease ends ${renewalDate(c.leaseEnd)}`} icon={IconCalendar}>
      <RenewalStatusChip status={c.renewal?.status ?? null} start={currentProposal?.lease_start ?? null} today={c.today} />
      {eligible && <Text className="font-inter text-sm leading-5 text-muted">Your lease is ending soon. Review your options to continue your stay.</Text>}
      <Button variant="secondary" onPress={open}><Button.Label>{eligible ? "Review renewal options" : "View renewal details"}</Button.Label></Button>
      {portal === "landlord" && <Button variant="outline" onPress={() => router.push("/lease-renewal")}><Button.Label>All renewal requests</Button.Label></Button>}
      {renewal.actionError && <Text accessibilityRole="alert" className="font-inter text-sm text-danger">{renewal.actionError}</Text>}
    </RenewalSection>
    <AppDialog isOpen={focused && eligible && dismissedFor !== key && seen.isSuccess && seen.data !== "seen"}
      onOpenChange={(isOpen) => { if (!isOpen) close(); }} dismissible={!renewal.busy}
      title={confirm ? "Confirm you will not renew" : "Your lease is ending soon"}
      footer={<View className="gap-2">{confirm ? <>
        <Button variant="outline" isDisabled={renewal.busy} onPress={() => { if (!renewal.isLocked()) setConfirm(false); }}><Button.Label>Go back</Button.Label></Button>
        <Button isDisabled={renewal.busy} onPress={() => { void renewal.act("not_renewing").then((saved) => { if (saved) close(); }); }}><Button.Label>Confirm decision</Button.Label></Button>
      </> : <>
        <Button onPress={open}><Button.Label>Request Lease Renewal</Button.Label></Button>
        <Button variant="outline" isDisabled={renewal.busy} onPress={() => setConfirm(true)}><Button.Label>I Will Not Renew</Button.Label></Button>
        <Button variant="ghost" onPress={close}><Button.Label>Decide Later</Button.Label></Button>
      </>}</View>}>
      <Text className="font-nunitoSemiBold text-base text-foreground">{c.apartmentName}</Text>
      <Text className="font-inter text-sm text-muted">Current lease expires {renewalDate(c.leaseEnd)}.</Text>
      <Text className="font-inter text-sm leading-5 text-muted">{confirm ? "This notifies the landlord but does not end the current tenancy." : "You can always return to these options from Rentals."}</Text>
      {renewal.actionError && <Text accessibilityRole="alert" className="font-inter text-sm text-danger">{renewal.actionError}</Text>}
    </AppDialog>
  </>;
}
