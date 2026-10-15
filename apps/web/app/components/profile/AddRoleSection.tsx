"use client";

import { useActionState, useState } from "react";
import { Button, Modal, Spinner } from "@heroui/react";
import { IconBuilding, IconCheck, IconKey, IconUser } from "@tabler/icons-react";

import { addRole } from "@/app/(auth)/actions/add-role";

type Props = {
  currentRoles: string[];
  targetRole: "tenant" | "landlord";
};

// Profile-page section letting a single-role account add its second role.
// Renders nothing when the account already holds the target role. Clicking
// the trigger only opens a confirmation dialog; the existing `addRole`
// server action runs when the dialog's confirm button submits this form.
export default function AddRoleSection({ currentRoles, targetRole }: Props) {
  const [state, action, isPending] = useActionState(addRole, {});
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (currentRoles.includes(targetRole)) return null;

  const targetLabel = targetRole === "landlord" ? "Landlord" : "Tenant";
  const isLandlordTarget = targetRole === "landlord";

  const handleOpenChange = (open: boolean) => {
    // Block every dismissal path (backdrop, Escape, close trigger) while
    // the role grant is in flight so it can never be abandoned mid-submit.
    if (!open && isPending) return;
    if (!open) setConfirmOpen(false);
  };

  const closeDialog = () => {
    if (!isPending) setConfirmOpen(false);
  };

  return (
    // NOTE: the role-grant `<form>` lives inside the dialog footer (not
    // around this whole section) because the Modal renders in a React
    // portal attached to `document.body`. A `type="submit"` button only
    // submits a form it is DOM-associated with, so a confirm button nested
    // under an outer form in JSX but portaled out in the DOM would never
    // submit and the server action would never run.
    <div className="flex flex-col gap-3">
      <div>
        <h2 className="flex items-center gap-2 font-nunito text-lg font-semibold text-primary">
          <IconKey size={20} className="shrink-0 text-primary" aria-hidden="true" />
          Account roles
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Your account currently has{" "}
          {currentRoles.length > 0 ? currentRoles.join(" and ") : "no"} access.
          Add {targetLabel.toLowerCase()} access to use this account as{" "}
          {targetRole === "landlord" ? "an owner" : "a renter"} too — no
          re-registration needed.
        </p>
      </div>

      {state?.error && (
        <div className="rounded-lg border border-danger-200 bg-danger-50 p-3">
          <p className="text-center text-sm text-danger">{state.error}</p>
        </div>
      )}

      <div>
        <Button
          type="button"
          variant="primary"
          onPress={() => setConfirmOpen(true)}
          className="w-full sm:w-auto"
        >
          {`Add ${targetLabel} access`}
        </Button>
      </div>

      <Modal isOpen={confirmOpen} onOpenChange={handleOpenChange}>
        <Modal.Backdrop>
          <Modal.Container placement="center" size="sm" scroll="inside">
            <Modal.Dialog
              aria-label={isLandlordTarget ? "Add Landlord Access?" : "Add Tenant Access?"}
              className="w-[calc(100vw-2rem)] max-w-sm overflow-y-auto rounded-2xl sm:w-full"
            >
              <Modal.CloseTrigger
                aria-label="Close confirmation"
                className="top-4 right-4 z-10 size-8 rounded-full bg-muted text-foreground hover:bg-muted-foreground/20 focus-visible:outline-2 focus-visible:outline-primary"
              />
              <Modal.Header className="pr-12 pb-2">
                <Modal.Heading className="flex items-center gap-2 font-nunito text-lg font-bold text-foreground">
                  {isLandlordTarget ? (
                    <IconBuilding size={20} className="shrink-0 text-primary" aria-hidden="true" />
                  ) : (
                    <IconUser size={20} className="shrink-0 text-primary" aria-hidden="true" />
                  )}
                  {isLandlordTarget ? "Add Landlord Access?" : "Add Tenant Access?"}
                </Modal.Heading>
              </Modal.Header>
              <Modal.Body>
                <p className="font-nunito text-[15px] font-semibold leading-6 text-foreground">
                  {isLandlordTarget
                    ? "You'll be able to manage rental properties and access the Landlord portal using your existing APT account."
                    : "You'll be able to browse rentals and access the Tenant portal using your existing APT account."}
                </p>
                <ul className="mt-4 flex list-none flex-col gap-2.5 p-0">
                  <ReassuranceItem
                    label={
                      isLandlordTarget
                        ? "Your Tenant access will remain active."
                        : "Your Landlord access will remain active."
                    }
                  />
                  {isLandlordTarget ? (
                    <ReassuranceItem label="Your saved rental preferences will be preserved." />
                  ) : null}
                  <ReassuranceItem label="No new account or registration is required." />
                </ul>
                {state?.error && (
                  <div className="mt-4 rounded-lg border border-danger-200 bg-danger-50 p-3">
                    <p className="text-center font-inter text-sm text-danger">{state.error}</p>
                  </div>
                )}
              </Modal.Body>
              <Modal.Footer className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onPress={closeDialog}
                  isDisabled={isPending}
                  className="min-h-10 rounded-full px-6 font-nunito text-sm font-semibold"
                >
                  Cancel
                </Button>
                {/* `contents` keeps the footer layout identical: the form
                  generates no box, so Confirm participates directly. */}
                <form action={action} className="contents">
                  <input type="hidden" name="role" value={targetRole} />
                  <Button
                    type="submit"
                    variant="primary"
                    isDisabled={isPending}
                    isPending={isPending}
                    className="min-h-10 rounded-full px-6 font-nunito text-sm font-semibold"
                  >
                    {isPending ? (
                      <>
                        <Spinner size="sm" color="current" aria-hidden="true" />
                        Adding access...
                      </>
                    ) : (
                      "Confirm & Add Access"
                    )}
                  </Button>
                </form>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </div>
  );
}

function ReassuranceItem({ label }: { label: string }) {
  return (
    <li className="flex items-center gap-2.5">
      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-success/10 text-success">
        <IconCheck size={14} aria-hidden="true" />
      </span>
      <span className="font-inter text-sm leading-5 text-muted-foreground">{label}</span>
    </li>
  );
}
