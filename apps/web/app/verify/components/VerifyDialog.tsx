"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Button, Modal, Spinner } from "@heroui/react";

import VerifyClient from "./VerifyClient";
import { getVerificationPageState } from "../actions";

type VerifyDialogProps = {
  open: boolean;
  onClose: () => void;
};

type DialogState =
  | { name: "loading" }
  | { name: "error"; message: string }
  | {
      name: "ready";
      siteUrl: string;
      accountStatus: string | null;
      hasPending: boolean;
    };

// Self-loading verification modal: fetches the same page state the /verify
// route uses when opened, so profile pages don't need new server props.
// siteUrl prefers NEXT_PUBLIC_SITE_URL, falling back to the current origin.
function resolveSiteUrl(): string {
  const override = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (override) return override;
  return window.location.origin;
}

export default function VerifyDialog({ open, onClose }: VerifyDialogProps) {
  const router = useRouter();
  const [state, setState] = useState<DialogState>({ name: "loading" });

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    const siteUrl = resolveSiteUrl();
    void getVerificationPageState()
      .then((pageState) => {
        if (cancelled) return;
        if (!pageState.signedIn) {
          setState({ name: "error", message: "Please sign in to verify your account." });
          return;
        }
        setState({
          name: "ready",
          siteUrl,
          accountStatus: pageState.accountStatus,
          hasPending: pageState.hasPending,
        });
      })
      .catch(() => {
        if (!cancelled) {
          setState({ name: "error", message: "Couldn't load verification. Please try again." });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [open ]);

  const handleOpenChange = useCallback(
    (value: boolean) => {
      if (!value) {
        // Reset for the next open so a stale session never flashes.
        setState({ name: "loading" });
        onClose();
      }
    },
    [onClose],
  );

  const handleCompleted = useCallback(() => {
    setState({ name: "loading" });
    onClose();
    router.refresh();
  }, [onClose, router]);

  return (
    <Modal isOpen={open} onOpenChange={handleOpenChange}>
      <Modal.Backdrop>
        <Modal.Container placement="center" size="lg" scroll="inside" className="w-full max-w-3xl sm:w-full">
          {/* max-w-3xl! (important) on the Dialog is what actually widens the
              modal: size="lg" caps .modal__dialog at 32rem and a plain
              max-w-* class loses the cascade (see SettingsModal). */}
          <Modal.Dialog className="max-h-[90vh] w-full max-w-3xl! overflow-y-auto rounded-2xl">
            <Modal.CloseTrigger
              aria-label="Close verification"
              className="top-4 right-4 z-10 size-8 rounded-full bg-muted text-foreground hover:bg-muted-foreground/20 focus-visible:outline-2 focus-visible:outline-primary"
            />
            {/* VerifyClient unmounts with the closed dialog, so its polling
                intervals clean up and its phase resets to idle on reopen. */}
            {open && state.name === "loading" && (
              <Modal.Body className="flex flex-col items-center gap-4 p-6 text-center sm:p-8">
                <Spinner size="lg" aria-hidden="true" />
                <p className="text-sm text-muted-foreground">Loading verification…</p>
              </Modal.Body>
            )}
            {open && state.name === "error" && (
              <Modal.Body className="flex flex-col items-center gap-4 p-6 text-center sm:p-8">
                <p className="max-w-md text-sm text-muted-foreground">{state.message}</p>
                <Button type="button" variant="primary" size="sm" onPress={onClose}>
                  Close
                </Button>
              </Modal.Body>
            )}
            {open && state.name === "ready" && (
              <Modal.Body className="p-6 sm:p-8">
                <VerifyClient
                  embedded
                  siteUrl={state.siteUrl}
                  accountStatus={state.accountStatus}
                  hasPending={state.hasPending}
                  onCompleted={handleCompleted}
                />
              </Modal.Body>
            )}
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
