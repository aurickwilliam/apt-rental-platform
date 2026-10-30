"use client";

import { Component, lazy, Suspense, useId, type ReactNode } from "react";
import { Alert, Button, Modal, Spinner, Tabs } from "@heroui/react";
import { IconFileText, IconInfoCircle, IconNotes } from "@tabler/icons-react";
import { REGISTRATION_POLICIES, type RegistrationPolicy } from "@/lib/registration-policies";

// The dialog/focus boundary opens immediately; policy prose is loaded only
// when requested. Registration inputs never unmount when reading a policy.
const RegistrationPolicyContent = lazy(() => import("./RegistrationPolicyContent"));

// A failed chunk must not replace the registration screen with an error page.
// The surrounding dialog remains dismissible and the form draft stays mounted.
class PolicyContentBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error) {
    console.error("Could not load registration policy", { name: error.name });
  }

  render() {
    if (this.state.failed) {
      return <p role="alert" className="p-5 text-sm leading-6 text-foreground">We could not load this policy. You can close this dialog without losing your form. Check your connection and reload the page when you are ready to try again.</p>;
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
                  <Tabs.Panel key={key} id={key} className="registration-policy-panel">
                    {policy === key ? (
                      <PolicyContentBoundary>
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
