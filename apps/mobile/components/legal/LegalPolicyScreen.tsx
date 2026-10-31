import { Text, View } from "react-native";
import StandardHeader from "@/components/layout/StandardHeader";
import ScreenWrapper from "@/components/layout/ScreenWrapper";
import type { LegalPolicy } from "@/constants/legal/types";
import LegalPolicySection from "./LegalPolicySection";

interface LegalPolicyScreenProps {
  policy: LegalPolicy;
}

export default function LegalPolicyScreen({ policy }: LegalPolicyScreenProps) {
  return (
    <ScreenWrapper header={<StandardHeader title={policy.title} />} scrollable className="p-5">
      <View className="gap-1 mb-4">
        <Text selectable className="text-xs text-muted">Last updated: {policy.lastUpdated}</Text>
        <Text selectable className="text-xs text-muted">Version {policy.version} · {policy.jurisdiction}</Text>
      </View>
      <View className="gap-4 pb-10">
        {policy.sections.map((section, index) => (
          <LegalPolicySection key={section.id} section={section} number={index + 1} />
        ))}
        <View className="gap-2">
          <Text accessibilityRole="header" className="text-sm font-nunitoSemiBold text-foreground">Contact APT</Text>
          <Text selectable className="text-sm text-muted leading-6">Email: {policy.contact.email}</Text>
          <Text selectable className="text-sm text-muted leading-6">Address: {policy.contact.address}</Text>
          <Text selectable className="text-sm text-muted leading-6">Hours: {policy.contact.hours}</Text>
        </View>
      </View>
    </ScreenWrapper>
  );
}
