import { useState } from "react";
import { Text, View } from "react-native";
import { Button } from "heroui-native";
import { IconChevronDown, IconChevronUp } from "@tabler/icons-react-native";
import { formatPesoDisplay, type LeaseRenewalProposal } from "@repo/utils";
import { useColors } from "@/hooks/useTheme";
import { renewalDate } from "@/utils/renewalPresentation";
import MoneyRow from "@/components/finance/MoneyRow";
import RenewalFileButton from "./RenewalFileButton";

interface RenewalSavedProposalProps { proposal: LeaseRenewalProposal; busy: boolean; onView: () => void }

export default function RenewalSavedProposal({ proposal: p, busy, onView }: RenewalSavedProposalProps) {
  const [expanded, setExpanded] = useState(false);
  const { colors } = useColors();
  const Chevron = expanded ? IconChevronUp : IconChevronDown;
  return (
    <View className="gap-3 rounded-2xl border border-border bg-overlay p-3">
      <View className="gap-1">
        <Text className="font-nunitoSemiBold text-base text-foreground">Proposal {p.version}</Text>
        <Text className="font-inter text-sm text-muted">{renewalDate(p.lease_start)} – {renewalDate(p.lease_end)}</Text>
      </View>
      <Button variant="ghost" size="sm" accessibilityLabel={`${expanded ? "Hide" : "View"} saved proposal ${p.version}`} accessibilityState={{ expanded }} onPress={() => setExpanded(!expanded)}>
        <Button.Label>{expanded ? "Hide details" : "View details"}</Button.Label><Chevron size={18} color={colors.primaryLightForeground} />
      </Button>
      {expanded && <View className="gap-3">
        <Text className="font-inter text-sm text-muted">{p.duration_months} months · {formatPesoDisplay(p.monthly_rent)} monthly</Text>
        <MoneyRow label="Advance due" amount={p.advance_due} />
        <MoneyRow label="Deposit replenishment" amount={p.deposit_due} />
        {p.agreement_path && <RenewalFileButton label="View preserved agreement" isDisabled={busy} onPress={onView} />}
      </View>}
    </View>
  );
}
