"use client";

import { Component, lazy, Suspense, useCallback, useId, useState, type ReactNode } from "react";
import { Alert, Button, Modal, Spinner } from "@heroui/react";
import { IconFileText, IconInfoCircle, IconNotes } from "@tabler/icons-react";
import { REGISTRATION_POLICIES, type RegistrationPolicy } from "@/lib/registration-policies";

// Share public-content loading across hover, focus and both registration forms.
// Discard rejected requests so preloading cannot poison a later open or Retry.
let contentRequest: Promise<typeof import("./RegistrationPolicyContent")> | undefined;
let loadedContent: typeof import("./RegistrationPolicyContent") | undefined;
function requestPolicyContent() {
  return contentRequest ??= import("./RegistrationPolicyContent").then(module => {
    loadedContent = module;
    return module;
  }).catch(error => {
    contentRequest = undefined;
    throw error;
  });
}

export function preloadRegistrationPolicyContent() {
  // Speculative failure is handled by the dialog if the user opens it.
  void requestPolicyContent().catch(() => {});
}

const loadPolicyContent = () => loadedContent?.default ?? lazy(requestPolicyContent);

// A failed chunk must not replace the registration screen with an error page.
// The surrounding dialog remains dismissible and the form draft stays mounted.
class PolicyContentBoundary extends Component<{ children: ReactNode; onRetry: () => void; onError: () => void }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error) {
    console.error("Could not load registration policy", { name: error.name });
    this.props.onError();
  }

  render() {
    if (this.state.failed) {
      return <div className="space-y-3 p-5">
        <p role="alert" className="text-sm leading-6 text-foreground">We could not load this policy. Check your connection and try again. Your form will stay unchanged.</p>
        <Button type="button" variant="secondary" onPress={this.props.onRetry}>Retry loading policy</Button>
      </div>;
    }
    return this.props.children;
  }
}

interface RegistrationPoliciesModalProps {
  policy: RegistrationPolicy;
  isOpen: boolean;
  onClose: () => void;
  onRead: (policy: RegistrationPolicy) => void;
  reviewed: boolean;
}

export default function RegistrationPoliciesModal({ policy, isOpen, onClose, onRead, reviewed }: RegistrationPoliciesModalProps) {
  const instanceId = useId();
  const [content, setContent] = useState(() => ({ Component: loadPolicyContent(), attempt: 0, open: isOpen, ready: false }));
  if (content.open !== isOpen) {
    // Select a ready preload before mounting, then keep this component type
    // stable until dismissal (including after a cold lazy load resolves).
    setContent({ ...content, open: isOpen, ready: false, Component: isOpen ? loadPolicyContent() : content.Component });
  }
  // A finished preload can render synchronously, avoiding even a one-frame
  // Suspense fallback when the modal is first opened.
  const RegistrationPolicyContent = content.Component;
  const retryContent = () => setContent(previous => ({ ...previous, ready: false, Component: loadPolicyContent(), attempt: previous.attempt + 1 }));
  const onReady = useCallback(() => setContent(previous => previous.open && !previous.ready ? { ...previous, ready: true } : previous), []);
  const onError = useCallback(() => setContent(previous => previous.ready ? { ...previous, ready: false } : previous), []);
  const closeLocked = isOpen && content.ready && !reviewed;
  const close = () => { if (!closeLocked) onClose(); };
  const label = REGISTRATION_POLICIES[policy].label;
  const PolicyIcon = policy === "privacy" ? IconFileText : IconNotes;
  return (
    <Modal isOpen={isOpen} onOpenChange={open => { if (!open) close(); }}>
      <Modal.Backdrop variant="blur" isDismissable={!closeLocked} isKeyboardDismissDisabled={closeLocked}>
        <Modal.Container placement="center" size="lg" scroll="inside" className="registration-policies-container">
          <Modal.Dialog className="registration-policies-dialog">
            <Modal.CloseTrigger type="button" aria-label={`Close ${label}`} isDisabled={closeLocked} />
            <Modal.Header className="registration-policies-header">
              <Modal.Icon className="registration-policies-icon"><PolicyIcon size={32} aria-hidden="true" /></Modal.Icon>
              <div className="min-w-0 space-y-1">
                <Modal.Heading className="font-nunito text-3xl font-bold text-foreground">{label}</Modal.Heading>
                <p className="text-sm leading-6 text-muted-foreground sm:text-base">Review this policy before creating your account.</p>
              </div>
            </Modal.Header>
            <Modal.Body className="registration-policies-body">
              <div role="region" aria-label={`${label} document`} tabIndex={0} data-registration-policy-scroll className="registration-policy-panel">
                {isOpen ? <PolicyContentBoundary key={content.attempt} onRetry={retryContent} onError={onError}>
                  <Suspense fallback={<div role="status" className="flex items-center gap-3 p-5 text-sm text-muted-foreground"><Spinner size="sm" />Loading policy…</div>}>
                    <RegistrationPolicyContent policy={policy} instanceId={instanceId} active={!reviewed} onRead={onRead} onReady={onReady} />
                  </Suspense>
                </PolicyContentBoundary> : null}
              </div>
            </Modal.Body>
            <Modal.Footer className="registration-policies-footer">
              <Alert status="accent" role="note" className="registration-policies-reminder">
                <Alert.Indicator><IconInfoCircle size={20} aria-hidden="true" /></Alert.Indicator>
                <Alert.Content><Alert.Description><span role="status">{reviewed
                  ? "You reached the end. You can now select this policy’s checkbox on the form."
                  : content.ready
                    ? "Scroll to the end to enable Close and this policy’s checkbox. Reading does not accept it."
                    : "You can close this dialog while the policy is loading or unavailable. Reading does not accept it."}</span></Alert.Description></Alert.Content>
              </Alert>
              <Button type="button" variant="primary" className="registration-policies-close" isDisabled={closeLocked} onPress={close}>Close</Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
