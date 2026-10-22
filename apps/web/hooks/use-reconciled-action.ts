"use client";

import { useEffect, useRef, useState } from "react";

type ActionResult = "confirmed" | "unresolved" | "failed" | null;

/** Component-local lock: retry an uncertain read, never repeat a successful write. */
export function useReconciledAction(revalidate: () => Promise<boolean>) {
  const active = useRef(true);
  const busy = useRef(false);
  const saved = useRef(false);
  const writeConfirmed = useRef(false);
  const [pending, setPending] = useState(false);
  const [needsReconciliation, setNeedsReconciliation] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    active.current = true;
    return () => { active.current = false; };
  }, []);

  const reconcile = async () => {
    let confirmed = false;
    try { confirmed = await revalidate(); }
    catch { console.error("Updated details could not be loaded."); }
    if (!active.current) return false;
    saved.current = !confirmed;
    setNeedsReconciliation(!confirmed);
    setError(confirmed ? null : writeConfirmed.current
      ? "The update was saved, but the latest details could not be verified. Refresh the details before taking another action."
      : "The latest details could not be verified. Refresh the details before taking another action.");
    return confirmed;
  };

  const run = async (write: () => Promise<boolean>, reconcileAfter = true): Promise<ActionResult> => {
    if (!active.current || busy.current || saved.current) return null;
    busy.current = true;
    writeConfirmed.current = false;
    setPending(true);
    setError(null);
    try {
      const succeeded = await write();
      if (!active.current) return null;
      if (!succeeded) return "failed";
      writeConfirmed.current = true;
      saved.current = true;
      setNeedsReconciliation(true);
      if (!reconcileAfter) return "confirmed"; // The caller leaves this page; keep it locked.
      return await reconcile() ? "confirmed" : active.current ? "unresolved" : null;
    } catch {
      if (!active.current) return null;
      console.error("Action result could not be verified.");
      setError("The result could not be verified. Refresh the details before taking another action.");
      saved.current = true;
      setNeedsReconciliation(true);
      return "unresolved";
    } finally {
      busy.current = false;
      if (active.current) setPending(false);
    }
  };

  const retry = async () => {
    if (!active.current || busy.current) return;
    busy.current = true;
    setPending(true);
    try { await reconcile(); }
    finally {
      busy.current = false;
      if (active.current) setPending(false);
    }
  };

  return { run, retry, pending, needsReconciliation, error, blocked: pending || needsReconciliation };
}
