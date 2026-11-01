"use client";

import { Component, lazy, Suspense, useId, useState, type ReactNode } from "react";
import { Alert, Button, Modal, Spinner, Tabs } from "@heroui/react";
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
class PolicyContentBoundary extends Component<{ children: ReactNode; onRetry: () => void }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error) {
    console.error("Could not load registration policy", { name: error.name });
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
  policy: RegistrationPolicy | null;
  onPolicyChange: (policy: RegistrationPolicy) => void;
  onClose: () => void;
}

export default function RegistrationPoliciesModal({ policy, onPolicyChange, onClose }: RegistrationPoliciesModalProps) {
  const instanceId = useId();
  const [content, setContent] = useState(() => ({ Component: loadPolicyContent(), attempt: 0, open: policy !== null }));
  if (content.open !== (policy !== null)) {
    // Select a ready preload before mounting, then keep this component type
    // stable until dismissal (including after a cold lazy load resolves).
    setContent({ ...content, open: policy !== null, Component: policy !== null ? loadPolicyContent() : content.Component });
  }
  const [visited, setVisited] = useState<RegistrationPolicy[]>(() => policy ? [policy] : []);
  // Retain only visited panels during this opening, not every policy up front.
  // Modal dismissal unmounts its content, so clear the visit list too.
  if (policy === null && visited.length) setVisited([]);
  else if (policy !== null && !visited.includes(policy)) setVisited([...visited, policy]);
  // A finished preload can render synchronously, avoiding even a one-frame
  // Suspense fallback when the modal is first opened.
  const RegistrationPolicyContent = content.Component;
  const retryContent = () => setContent(previous => ({ ...previous, Component: loadPolicyContent(), attempt: previous.attempt + 1 }));
  return (
    <Modal isOpen={policy !== null} onOpenChange={open => { if (!open) onClose(); }}>
      <Modal.Backdrop variant="blur">
        <Modal.Container placement="center" size="lg" scroll="inside" className="registration-policies-container">
          <Modal.Dialog className="registration-policies-dialog">
            <Modal.CloseTrigger type="button" aria-label="Close policies" />
            <Modal.Header className="registration-policies-header">
              <Modal.Icon className="registration-policies-icon"><IconFileText size={32} aria-hidden="true" /></Modal.Icon>
              <div className="min-w-0 space-y-1">
                <Modal.Heading className="font-nunito text-3xl font-bold text-foreground">Policies</Modal.Heading>
                <p className="text-sm leading-6 text-muted-foreground sm:text-base">Review our policies before creating your account.</p>
              </div>
            </Modal.Header>
            <Modal.Body className="registration-policies-body">
              <Tabs selectedKey={policy ?? "privacy"} onSelectionChange={key => {
                if (key === "privacy" || key === "terms") onPolicyChange(key);
              }} variant="secondary" className="registration-policies-tabs">
                <Tabs.ListContainer className="registration-policies-tab-list">
                  <Tabs.List aria-label="Policy documents">
                    {(["privacy", "terms"] as const).map(key => (
                      <Tabs.Tab key={key} id={key}>
                        {key === "privacy" ? <IconFileText size={22} aria-hidden="true" /> : <IconNotes size={22} aria-hidden="true" />}
                        {REGISTRATION_POLICIES[key].label}
                        <Tabs.Indicator />
                      </Tabs.Tab>
                    ))}
                  </Tabs.List>
                </Tabs.ListContainer>
                {(["privacy", "terms"] as const).map(key => (
                  <Tabs.Panel key={key} id={key} shouldForceMount hidden={policy !== key} inert={policy !== key} className="registration-policy-panel">
                    {policy === key || visited.includes(key) ? (
                      <PolicyContentBoundary key={content.attempt} onRetry={retryContent}>
                        <Suspense fallback={<div role="status" className="flex items-center gap-3 p-5 text-sm text-muted-foreground"><Spinner size="sm" />Loading policy…</div>}>
                          <RegistrationPolicyContent policy={key} instanceId={instanceId} />
                        </Suspense>
                      </PolicyContentBoundary>
                    ) : null}
                  </Tabs.Panel>
                ))}
              </Tabs>
            </Modal.Body>
            <Modal.Footer className="registration-policies-footer">
              <Alert status="accent" role="note" className="registration-policies-reminder">
                <Alert.Indicator><IconInfoCircle size={20} aria-hidden="true" /></Alert.Indicator>
                <Alert.Content><Alert.Description>Reading a policy does not select its checkbox.</Alert.Description></Alert.Content>
              </Alert>
              <Button type="button" variant="primary" className="registration-policies-close" onPress={onClose}>Close</Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
