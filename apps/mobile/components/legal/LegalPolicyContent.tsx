import { Text, View } from "react-native";
import type { LegalPolicy } from "@/constants/legal/types";
import LegalPolicySection from "./LegalPolicySection";

interface LegalPolicyContentProps {
  policy: LegalPolicy;
  selectable?: boolean;
}

export default function LegalPolicyContent({ policy, selectable = true }: LegalPolicyContentProps) {
  return (
    <View>
      <View className="gap-1 mb-4">
        <Text selectable={selectable} className="text-xs text-muted">Last updated: {policy.lastUpdated}</Text>
        <Text selectable={selectable} className="text-xs text-muted">Version {policy.version} · {policy.jurisdiction}</Text>
      </View>
      <View className="gap-4 pb-10">
        {policy.sections.map((section, index) => (
          <LegalPolicySection key={section.id} section={section} number={index + 1} selectable={selectable} />
        ))}
      </View>
    </View>
  );
}
