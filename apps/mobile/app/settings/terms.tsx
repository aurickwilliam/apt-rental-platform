import LegalPolicyScreen from "@/components/legal/LegalPolicyScreen";
import { TERMS_POLICY } from "@/constants/legal/terms";

export default function TermsScreen() {
  return <LegalPolicyScreen policy={TERMS_POLICY} />;
}
