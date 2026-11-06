import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { View, useWindowDimensions } from "react-native";
import { GestureHandlerRootView, ScrollView } from "react-native-gesture-handler";
import { Button, Dialog } from "heroui-native";
import { TERMS_POLICY } from "@/constants/legal/terms";
import { PRIVACY_POLICY } from "@/constants/legal/privacy";
import { usePolicyReadingProgress } from "@/hooks/auth/usePolicyReadingProgress";
import { POLICY_SCROLL_BOTTOM_PADDING } from "@/utils/policyReadingProgress";
import LegalPolicyContent from "./LegalPolicyContent";
import RegistrationPolicyContentBoundary from "./RegistrationPolicyContentBoundary";

export type RegistrationPolicy = "privacy" | "terms";

interface RegistrationPoliciesDialogProps {
  policy: RegistrationPolicy;
  reviewed: boolean;
  onRead: (policy: RegistrationPolicy) => void;
  onClose: () => void;
}

// Mount only the requested fixed-policy dialog. Unmounting retires its native
// measurements; the surrounding form alone remembers completed revisions.
export default function RegistrationPoliciesDialog({ policy, reviewed, onRead, onClose }: RegistrationPoliciesDialogProps) {
  const { height } = useWindowDimensions();
  const content = policy === "terms" ? TERMS_POLICY : PRIVACY_POLICY;
  const [failed, setFailed] = useState(false);
  const handleRead = useCallback(() => onRead(policy), [onRead, policy]);
  const progress = usePolicyReadingProgress(handleRead, !reviewed && !failed);
  const closeLocked = progress.ready && !reviewed && !failed;
  const closeState = useRef({ closeLocked, onClose, active: true });
  useLayoutEffect(() => {
    closeState.current = { closeLocked, onClose, active: true };
    return () => { closeState.current.active = false; };
  }, [closeLocked, onClose]);
  // HeroUI's Android Back listener captures its initial callback. Keep this
  // guard stable, but read the current permission, including after scrolling.
  const close = useCallback(() => { if (closeState.current.active && !closeState.current.closeLocked) closeState.current.onClose(); }, []);
  const onOpenChange = useCallback((open: boolean) => { if (!open) close(); }, [close]);
  const onError = useCallback(() => setFailed(true), []);

  return (
    <Dialog isOpen onOpenChange={onOpenChange}>
      <Dialog.Portal unstable_accessibilityContainerViewIsModal>
        <Dialog.Overlay isCloseOnPress={!closeLocked} />
        <Dialog.Content isSwipeable={false} style={{ height: height * 0.85 }} className="gap-3 p-5" accessibilityViewIsModal>
          <Dialog.Title className="shrink-0">{content.title}</Dialog.Title>
          <GestureHandlerRootView style={{ flex: 1, minHeight: 0 }}>
            <RegistrationPolicyContentBoundary onError={onError}>
              <ScrollView
                style={{ flex: 1, minHeight: 0 }}
                accessibilityLabel={`${content.title} document`}
                nestedScrollEnabled
                disallowInterruption
                shouldActivateOnStart
                removeClippedSubviews={false}
                showsVerticalScrollIndicator
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ paddingBottom: POLICY_SCROLL_BOTTOM_PADDING }}
                onLayout={progress.onLayout}
                onContentSizeChange={progress.onContentSizeChange}
                onScroll={progress.onScroll}
                onScrollEndDrag={progress.onScrollEndDrag}
                onMomentumScrollEnd={progress.onMomentumScrollEnd}
                scrollEventThrottle={16}
              >
                <LegalPolicyContent policy={content} selectable={false} />
                <View testID="registration-policy-end" collapsable={false} onLayout={progress.onEndLayout} style={{ height: 1 }} accessible={false} />
              </ScrollView>
            </RegistrationPolicyContentBoundary>
          </GestureHandlerRootView>
          <Dialog.Description accessibilityLiveRegion="polite" className="shrink-0 text-xs text-muted leading-5">
            {reviewed ? "You reached the end. You can now select this policy’s checkbox on the form."
              : closeLocked ? "Scroll to the end to enable Close and this policy’s checkbox. Reading does not accept it."
                : "You can close this dialog while the policy is loading or unavailable."}
          </Dialog.Description>
          <Button variant="secondary" className="shrink-0" isDisabled={closeLocked} onPress={close} accessibilityLabel={`Close ${content.title}`}>
            <Button.Label>Close</Button.Label>
          </Button>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  );
}
