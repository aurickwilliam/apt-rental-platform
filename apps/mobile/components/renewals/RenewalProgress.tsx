import { Text, View } from "react-native";
import { IconCheck, IconRoute } from "@tabler/icons-react-native";
import type { RenewalPortal, RenewalStatus } from "@repo/utils";
import { useColors } from "@/hooks/useTheme";
import { RENEWAL_STEPS, renewalNextStep, renewalStage } from "@/utils/renewalPresentation";
import RenewalSection from "./RenewalSection";
import RenewalStatusChip from "./RenewalStatusChip";

interface RenewalProgressProps {
  status: RenewalStatus | null;
  portal: RenewalPortal;
  start: string | null;
  today: string;
}

export default function RenewalProgress({ status, portal, start, today }: RenewalProgressProps) {
  const { colors } = useColors();
  const stage = renewalStage(status);
  return (
    <RenewalSection title="Renewal progress" icon={IconRoute}>
      <RenewalStatusChip status={status} start={start} today={today} />
      {stage !== null && (
        <View className="flex-row gap-2" accessibilityLabel="Renewal stages">
          {RENEWAL_STEPS.map((label, index) => (
            <View key={label} className="min-w-0 flex-1 items-center gap-2"
              accessible accessibilityLabel={`${label}: ${index < stage ? "completed" : index === stage ? "current step" : "not started"}`}>
              <View className={`size-8 items-center justify-center rounded-full ${index < stage ? "bg-primary" : index === stage ? "border-2 border-primary bg-primary-light" : "border border-border bg-overlay"}`}>
                {index < stage ? <IconCheck size={16} color={colors.secondaryForeground} /> : <Text className={`font-nunitoBold text-sm ${index === stage ? "text-accent" : "text-muted"}`}>{index + 1}</Text>}
              </View>
              <Text className={`text-center font-nunitoSemiBold text-xs ${index === stage ? "text-accent" : "text-muted"}`}>{label}</Text>
            </View>
          ))}
        </View>
      )}
      <Text className="font-inter text-sm leading-5 text-muted">{status ? renewalNextStep(status, portal) : "Your renewal has not started. Requests open during the final 30 days of an active, dated lease."}</Text>
    </RenewalSection>
  );
}
