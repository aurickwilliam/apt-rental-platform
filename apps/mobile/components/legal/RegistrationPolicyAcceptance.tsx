import { useCallback, useState } from "react";
import { Keyboard, Pressable, Text, View } from "react-native";
import { Checkbox, ControlField, FieldError, Label, LinkButton } from "heroui-native";
import { IconAlertTriangle, IconInfoCircle } from "@tabler/icons-react-native";
import type { RegistrationAcceptanceForm } from "@/hooks/auth/useRegistrationAcceptance";
import { useColors } from "@/hooks/useTheme";
import { PRIVACY_POLICY } from "@/constants/legal/privacy";
import { TERMS_POLICY } from "@/constants/legal/terms";
import RegistrationPoliciesDialog, { type RegistrationPolicy } from "./RegistrationPoliciesDialog";

const POLICY_VERSIONS = { privacy: PRIVACY_POLICY.version, terms: TERMS_POLICY.version };

interface RegistrationPolicyAcceptanceProps {
  form: RegistrationAcceptanceForm;
  isDisabled?: boolean;
}

export default function RegistrationPolicyAcceptance({ form, isDisabled = false }: RegistrationPolicyAcceptanceProps) {
  const { colors } = useColors();
  const [openPolicy, setOpenPolicy] = useState<RegistrationPolicy | null>(null);
  const [attemptedPolicy, setAttemptedPolicy] = useState<RegistrationPolicy | null>(null);
  const [readVersions, setReadVersions] = useState<Partial<Record<RegistrationPolicy, string>>>({});
  const onRead = useCallback((policy: RegistrationPolicy) => {
    setReadVersions((current) => current[policy] === POLICY_VERSIONS[policy]
      ? current : { ...current, [policy]: POLICY_VERSIONS[policy] });
  }, []);
  const reviewed = {
    privacy: readVersions.privacy === form.value.privacyVersion && form.value.privacyVersion === POLICY_VERSIONS.privacy,
    terms: readVersions.terms === form.value.termsVersion && form.value.termsVersion === POLICY_VERSIONS.terms,
  };
  const warningPolicy = attemptedPolicy && !reviewed[attemptedPolicy] ? attemptedPolicy : null;

  return (
    <View className="gap-2 mb-4">
      {(["privacy", "terms"] as const).map((policy) => {
        const field = policy === "privacy" ? "privacyAccepted" : "termsAccepted";
        const label = policy === "privacy" ? "Privacy Policy" : "Terms and Conditions";
        return (
          <View key={policy}>
            <View className="flex-row flex-wrap items-center gap-x-1">
              <View className="relative">
                <ControlField isSelected={form.value[field]} onSelectedChange={(selected) => {
                  if (isDisabled) return;
                  if (selected && !reviewed[policy]) { setAttemptedPolicy(policy); return; }
                  form.setAccepted(field, selected);
                }}
                  isDisabled={isDisabled || !reviewed[policy]} isRequired isInvalid={!!form.errors[field]}
                  accessibilityRole="checkbox" accessibilityState={{ checked: form.value[field], disabled: isDisabled || !reviewed[policy] }}
                  accessibilityHint={!reviewed[policy] ? "Open this policy and scroll to the end before accepting it." : undefined}
                  accessibilityLabel={`I have read and agree to the ${label}`} className="min-h-11 flex-row gap-2">
                  <ControlField.Indicator><Checkbox accessible={false} importantForAccessibility="no-hide-descendants" className="size-5 border border-border shadow-none" /></ControlField.Indicator>
                  <Label isRequired={false}><Label.Text className="text-sm text-foreground font-inter">I agree to the</Label.Text></Label>
                </ControlField>
                {!reviewed[policy] ? <Pressable className="absolute inset-0" accessibilityRole="button"
                  accessibilityLabel={`Review required before accepting the ${label}`}
                  accessibilityHint="Open this policy and scroll to the end before accepting it."
                  accessibilityState={{ disabled: isDisabled }} disabled={isDisabled}
                  onPress={() => { if (!isDisabled) setAttemptedPolicy(policy); }} /> : null}
              </View>
              <LinkButton isDisabled={isDisabled} onPress={() => { Keyboard.dismiss(); setOpenPolicy(policy); }}
                accessibilityLabel={`Read ${label}`} className="min-h-11 px-0">
                <LinkButton.Label className="text-sm text-accent font-inter underline">
                  {label}<Text accessible={false} className="text-danger">*</Text>
                </LinkButton.Label>
              </LinkButton>
            </View>
            {warningPolicy === policy ? <View className="flex-row items-start gap-1.5 mt-1">
              <IconAlertTriangle size={16} color={colors.warningText} style={{ marginTop: 2 }} accessible={false} />
              <Text accessibilityRole="alert" accessibilityLiveRegion="polite" className="flex-1 text-xs text-foreground leading-5">
                Please open the {label} and scroll to the end before accepting it.
              </Text>
            </View> : null}
            {form.errors[field] ? <FieldError accessibilityRole="alert">{form.errors[field]}</FieldError> : null}
          </View>
        );
      })}
      {!reviewed.privacy || !reviewed.terms ? <View className="flex-row items-start gap-1.5">
        <IconInfoCircle size={16} color={colors.primary} style={{ marginTop: 2 }} accessible={false} />
        <Text className="flex-1 text-xs text-foreground leading-5">Open each policy and scroll to the end to enable its checkbox.</Text>
      </View> : null}
      {form.errors.version ? <FieldError accessibilityRole="alert">{form.errors.version}</FieldError> : null}
      <View className="gap-1">
        <Text className="text-xs text-muted leading-5">False information or fraudulent listings may lead to account suspension or termination.</Text>
        <Text className="text-xs text-muted leading-5">Personal data is handled under our Privacy Policy and Philippine data protection laws.</Text>
      </View>
      {(["privacy", "terms"] as const).map((policy) => openPolicy === policy ? (
        <RegistrationPoliciesDialog key={policy} policy={policy} reviewed={reviewed[policy]} onRead={onRead} onClose={() => setOpenPolicy(null)} />
      ) : null)}
    </View>
  );
}
