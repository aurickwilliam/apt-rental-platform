import { useCallback, useEffect, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";
import { useToast } from "heroui-native";
import { acknowledgeSignedLease, signedLeaseOperationGuard, viewSignedLease } from "@/service/tenancy/signedLeaseService";
import { getErrorMessage } from "@/utils/getErrorMessage";

interface TenantSignedLeaseOptions {
  tenancyId: string;
  path: string | null;
  acknowledgedAt: string | null;
  onAcknowledged: () => Promise<boolean>;
}

const REFRESH_ERROR = "Your confirmation was saved, but rental details could not refresh. Please try refreshing again.";

// The card is keyed by Auth ID + tenancy + document path, so replacement
// retires drafts and late callbacks rather than transferring confirmation.
export function useTenantSignedLease({ tenancyId, path, acknowledgedAt, onAcknowledged }: TenantSignedLeaseOptions) {
  const { toast } = useToast();
  const [confirming, setConfirming] = useState(false);
  const [viewing, setViewing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const busy = useRef(false);
  const submitted = useRef(false);
  const viewBusy = useRef(false);
  const nudged = useRef(false);
  const lifetime = useRef({ active: true });

  useEffect(() => {
    const current = { active: true };
    lifetime.current = current;
    return () => { current.active = false; };
  }, []);

  useFocusEffect(useCallback(() => {
    if (!path || acknowledgedAt || saved || nudged.current || !signedLeaseOperationGuard("tenant")()) return;
    nudged.current = true;
    toast.show({ variant: "default", label: "Signed lease ready for review",
      description: "Your landlord uploaded the signed lease. Open it below and confirm it matches your agreement." });
  }, [path, acknowledgedAt, saved, toast]));

  function guard() {
    const current = lifetime.current;
    const validScope = signedLeaseOperationGuard("tenant");
    return () => current.active && validScope();
  }

  async function confirm() {
    if (!path || acknowledgedAt || busy.current || submitted.current) return;
    const isCurrent = guard();
    if (!isCurrent()) return;
    busy.current = true;
    setConfirming(true);
    setError(null);
    try {
      await acknowledgeSignedLease(tenancyId, isCurrent);
      if (!isCurrent()) return;
      submitted.current = true;
      setSaved(true);
      if (!await onAcknowledged() && isCurrent()) setError(REFRESH_ERROR);
    } catch (err) {
      if (isCurrent()) {
        console.error("Signed lease confirmation failed", err instanceof Error ? err.name : "RequestError");
        setError(submitted.current ? REFRESH_ERROR : getErrorMessage(err, "Could not confirm the lease. Please try again."));
      }
    } finally {
      busy.current = false;
      if (isCurrent()) setConfirming(false);
    }
  }

  async function refresh() {
    if (busy.current || !submitted.current) return;
    const isCurrent = guard();
    if (!isCurrent()) return;
    busy.current = true;
    setConfirming(true);
    try {
      const ok = await onAcknowledged();
      if (isCurrent()) setError(ok ? null : REFRESH_ERROR);
    } catch {
      if (isCurrent()) setError(REFRESH_ERROR);
    } finally {
      busy.current = false;
      if (isCurrent()) setConfirming(false);
    }
  }

  async function view() {
    if (!path || viewBusy.current || busy.current) return;
    const isCurrent = guard();
    if (!isCurrent()) return;
    viewBusy.current = true;
    setViewing(true);
    try {
      await viewSignedLease(path, isCurrent);
    } catch (err) {
      if (isCurrent()) toast.show({ variant: "danger", label: getErrorMessage(err, "Could not open the signed lease. Please try again.") });
    } finally {
      viewBusy.current = false;
      if (isCurrent()) setViewing(false);
    }
  }

  return { confirming, viewing, saved, error, confirm, refresh, view };
}
