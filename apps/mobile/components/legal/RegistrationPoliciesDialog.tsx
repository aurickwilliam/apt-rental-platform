import { ScrollView, View, useWindowDimensions } from "react-native";
import { Button, Dialog } from "heroui-native";
import { TERMS_POLICY } from "@/constants/legal/terms";
import { PRIVACY_POLICY } from "@/constants/legal/privacy";
import LegalPolicyContent from "./LegalPolicyContent";

export type RegistrationPolicy = "privacy" | "terms";

interface RegistrationPoliciesDialogProps {
  policy: RegistrationPolicy | null;
  onPolicyChange: (policy: RegistrationPolicy) => void;
  onClose: () => void;
}

export default function RegistrationPoliciesDialog({ policy, onPolicyChange, onClose }: RegistrationPoliciesDialogProps) {
  const { height } = useWindowDimensions();
  const content = policy === "terms" ? TERMS_POLICY : PRIVACY_POLICY;

  return (
    <Dialog isOpen={policy !== null} onOpenChange={(open) => { if (!open) onClose(); }}>
      <Dialog.Portal unstable_accessibilityContainerViewIsModal>
        <Dialog.Overlay />
        <Dialog.Content isSwipeable={false} style={{ height: height * 0.85 }} className="gap-3 p-5" accessibilityViewIsModal>
          <Dialog.Title className="shrink-0">{content.title}</Dialog.Title>
          <View className="flex-row shrink-0 gap-2">
            {(["privacy", "terms"] as const).map((item) => (
              <Button key={item} size="sm" variant={policy === item ? "primary" : "tertiary"}
                className="flex-1" accessibilityState={{ selected: policy === item }}
                onPress={() => onPolicyChange(item)}>
                <Button.Label>{item === "privacy" ? "Privacy" : "Terms"}</Button.Label>
              </Button>
            ))}
          </View>
          <ScrollView
            key={policy}
            style={{ flex: 1, minHeight: 0 }}
            nestedScrollEnabled
            showsVerticalScrollIndicator
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 16 }}
          >
            <LegalPolicyContent policy={content} />
          </ScrollView>
          <Button variant="secondary" className="shrink-0" onPress={onClose} accessibilityLabel="Close policies">
            <Button.Label>Close</Button.Label>
          </Button>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  );
}
