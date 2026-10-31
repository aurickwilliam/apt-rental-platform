import { useState } from "react";
import { Keyboard, Text, View } from "react-native";
import { Checkbox, ControlField, FieldError, Label, LinkButton } from "heroui-native";
import type { RegistrationAcceptanceForm } from "@/hooks/auth/useRegistrationAcceptance";
import RegistrationPoliciesDialog, { type RegistrationPolicy } from "./RegistrationPoliciesDialog";

interface RegistrationPolicyAcceptanceProps {
  form: RegistrationAcceptanceForm;
  isDisabled?: boolean;
}

export default function RegistrationPolicyAcceptance({ form, isDisabled = false }: RegistrationPolicyAcceptanceProps) {
  const [openPolicy, setOpenPolicy] = useState<RegistrationPolicy | null>(null);

  return (
    <View className="gap-2 mb-4">
      {(["privacy", "terms"] as const).map((policy) => {
        const field = policy === "privacy" ? "privacyAccepted" : "termsAccepted";
        const label = policy === "privacy" ? "Privacy Policy" : "Terms and Conditions";
        return (
          <View key={policy}>
            <View className="flex-row flex-wrap items-center gap-x-1">
              <ControlField isSelected={form.value[field]} onSelectedChange={(selected) => form.setAccepted(field, selected)}
                isDisabled={isDisabled} isRequired isInvalid={!!form.errors[field]}
                accessibilityLabel={`I have read and agree to the ${label}`} className="min-h-12 flex-row gap-2">
                <ControlField.Indicator><Checkbox className="size-5 border border-border shadow-none" /></ControlField.Indicator>
                <Label isRequired={false}><Label.Text className="text-sm text-foreground font-inter">I agree to the</Label.Text></Label>
              </ControlField>
              <LinkButton isDisabled={isDisabled} onPress={() => { Keyboard.dismiss(); setOpenPolicy(policy); }}
                accessibilityLabel={`Read ${label}`} className="min-h-12 px-0">
                <LinkButton.Label className="text-sm text-accent font-inter underline">
                  {label}<Text accessible={false} className="text-danger">*</Text>
                </LinkButton.Label>
              </LinkButton>
            </View>
            {form.errors[field] ? <FieldError accessibilityRole="alert">{form.errors[field]}</FieldError> : null}
          </View>
        );
      })}
      {form.errors.version ? <FieldError accessibilityRole="alert">{form.errors.version}</FieldError> : null}
      <View className="gap-1">
        <Text className="text-xs text-muted leading-5">False information or fraudulent listings may lead to account suspension or termination.</Text>
        <Text className="text-xs text-muted leading-5">Personal data is handled under our Privacy Policy and Philippine data protection laws.</Text>
      </View>
      <RegistrationPoliciesDialog policy={openPolicy} onPolicyChange={setOpenPolicy} onClose={() => setOpenPolicy(null)} />
    </View>
  );
}
