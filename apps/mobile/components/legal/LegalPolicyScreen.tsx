import StandardHeader from "@/components/layout/StandardHeader";
import ScreenWrapper from "@/components/layout/ScreenWrapper";
import type { LegalPolicy } from "@/constants/legal/types";
import LegalPolicyContent from "./LegalPolicyContent";

interface LegalPolicyScreenProps {
  policy: LegalPolicy;
}

export default function LegalPolicyScreen({ policy }: LegalPolicyScreenProps) {
  return (
    <ScreenWrapper header={<StandardHeader title={policy.title} />} scrollable className="p-5">
      <LegalPolicyContent policy={policy} />
    </ScreenWrapper>
  );
}
