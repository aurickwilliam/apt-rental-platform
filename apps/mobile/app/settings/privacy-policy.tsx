import LegalPolicyScreen from "@/components/legal/LegalPolicyScreen";
import { PRIVACY_POLICY } from "@/constants/legal/privacy";

export default function PrivacyPolicyScreen() {
  return <LegalPolicyScreen policy={PRIVACY_POLICY} />;
}
