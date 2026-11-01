"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { Button, Modal, Spinner } from "@heroui/react";

import VerifyClient from "./VerifyClient";
import {
  getVerificationPageStateShared,
  invalidateVerificationPageState,
  readCachedVerificationPageState,
} from "./verificationPageStateCache";

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

  // Fast open path: when the profile card has prewarmed the entry state,
  // derive it during render so the modal paints content immediately with
  // no loading flash. The effect below only fetches on a cache miss.
  const [lastOpen, setLastOpen] = useState(open);
  const [openEpoch, setOpenEpoch] = useState(0);
  const revalidatedEpochRef = useRef(0);
  if (open !== lastOpen) {
    setLastOpen(open);
    if (open) {
      setOpenEpoch((epoch) => epoch + 1);
      const hit = readCachedVerificationPageState();
      if (!hit) {
        setState({ name: "loading" });
      } else if (!hit.signedIn) {
        setState({ name: "error", message: "Please sign in to verify your account." });
      } else {
        setState({
          name: "ready",
          siteUrl: resolveSiteUrl(),
          accountStatus: hit.accountStatus,
          hasPending: hit.hasPending,
        });
      }
    } else {
      // Reset for the next open so a stale session never flashes.
      setState({ name: "loading" });
    }
  }

  useEffect(() => {
    if (!open) return;

    const siteUrl = resolveSiteUrl();

    // Cache miss: fetch once (shared in-flight request).
    if (state.name === "loading") {
      let cancelled = false;
      void getVerificationPageStateShared()
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
    }

    // Cache hit painted synchronously above; revalidate once per open so a
    // verification submitted natively surfaces without a loading flash.
    // Identical snapshots keep identity: no re-render, no flicker.
    if (revalidatedEpochRef.current === openEpoch || state.name !== "ready") return;
    revalidatedEpochRef.current = openEpoch;
    let cancelled = false;
    void getVerificationPageStateShared()
      .then((pageState) => {
        if (cancelled) return;
        setState((prev) => {
          if (prev.name !== "ready") return prev;
          if (!pageState.signedIn) {
            return { name: "error", message: "Please sign in to verify your account." };
          }
          if (
            prev.accountStatus === pageState.accountStatus &&
            prev.hasPending === pageState.hasPending
          ) {
            return prev;
          }
          return {
            name: "ready",
            siteUrl,
            accountStatus: pageState.accountStatus,
            hasPending: pageState.hasPending,
          };
        });
      })
      .catch(() => {
        // Silent: the painted snapshot stands; the next open retries.
      });
    return () => {
      cancelled = true;
    };
  }, [open, openEpoch, state ]);

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
    invalidateVerificationPageState();
    onClose();
    router.refresh();
  }, [onClose, router]);

  return (
    <Modal isOpen={open} onOpenChange={handleOpenChange}>
      <Modal.Backdrop>
        <Modal.Container placement="center" size="lg" scroll="inside" className="w-full max-w-[800px] sm:w-full">
          {/* max-w-[800px]! (important) on the Dialog is what actually widens
              the modal: size="lg" caps .modal__dialog at 32rem and a plain
              max-w-* class loses the cascade (see SettingsModal). */}
          <Modal.Dialog className="max-h-[90dvh] w-[calc(100vw-2rem)] max-w-[800px]! overflow-y-auto rounded-2xl sm:w-full">
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
              <Modal.Body className="p-2">
                <VerifyClient
                  embedded
                  siteUrl={state.siteUrl}
                  accountStatus={state.accountStatus}
                  hasPending={state.hasPending}
                  onCompleted={handleCompleted}
                  onNavigate={onClose}
                />
              </Modal.Body>
            )}
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
