import { useEffect, useRef, useState } from "react";
import * as DocumentPicker from "expo-document-picker";
import { File } from "expo-file-system";
import { useToast } from "heroui-native";
import { signedLeaseOperationGuard, uploadSignedLease, viewSignedLease } from "@/service/tenancy/signedLeaseService";
import { SIGNED_LEASE_TYPES, validateSignedLeaseFile } from "@/utils/signedLease";
import { getErrorMessage } from "@/utils/getErrorMessage";

interface SignedLeaseOptions {
  tenancyId: string;
  path: string | null;
  onSaved: () => Promise<void>;
}

export function useSignedLease({ tenancyId, path, onSaved }: SignedLeaseOptions) {
  const { toast } = useToast();
  const [isOpen, setOpen] = useState(false);
  const [asset, setAsset] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [viewing, setViewing] = useState(false);
  const lock = useRef(false);
  const viewLock = useRef(false);
  const lifetime = useRef({ active: true });
  useEffect(() => {
    const current = { active: true };
    lifetime.current = current;
    return () => { current.active = false; };
  }, [tenancyId]);

  function guard() {
    const current = lifetime.current;
    const validScope = signedLeaseOperationGuard();
    return () => current.active && validScope();
  }

  function open() {
    setAsset(null);
    setError(null);
    setSaved(false);
    setOpen(true);
  }

  function close() {
    if (lock.current) return;
    setOpen(false);
    setAsset(null);
    setError(null);
  }

  async function pick() {
    if (lock.current) return;
    const isCurrent = guard();
    lock.current = true;
    setBusy(true);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: SIGNED_LEASE_TYPES, multiple: false, copyToCacheDirectory: true,
      });
      if (!isCurrent() || result.canceled) return;
      const picked = result.assets[0];
      const size = new File(picked.uri).size;
      const validation = validateSignedLeaseFile({
        name: picked.name, type: picked.mimeType ?? "", size,
      });
      setError(validation);
      // An invalid second pick must not leave an old valid selection submittable.
      setAsset(validation ? null : { ...picked, size });
    } catch (err) {
      if (isCurrent()) setError(getErrorMessage(err, "Could not choose a file. Please try again."));
    } finally {
      lock.current = false;
      if (isCurrent()) setBusy(false);
    }
  }

  async function save() {
    if (lock.current || (!asset && !saved)) return;
    const isCurrent = guard();
    lock.current = true;
    setBusy(true);
    setError(null);
    let committed = saved;
    try {
      if (!committed && asset) {
        await uploadSignedLease({ tenancyId, asset, previousPath: path, isCurrent });
        if (!isCurrent()) return;
        committed = true;
        setSaved(true);
      }
      if (!isCurrent()) return;
      await onSaved();
      if (!isCurrent()) return;
      setOpen(false);
      setAsset(null);
      toast.show({ variant: "success", label: "Signed lease saved" });
    } catch (err) {
      if (isCurrent()) {
        console.error("Signed lease action failed", err instanceof Error ? err.name : "UnknownError");
        setError(committed
          ? "The signed lease was saved, but details could not refresh. Retry refresh; do not upload again."
          : getErrorMessage(err, "Could not save the signed lease. Please try again."));
      }
    } finally {
      lock.current = false;
      if (isCurrent()) setBusy(false);
    }
  }

  async function view() {
    if (!path || viewLock.current) return;
    const isCurrent = guard();
    viewLock.current = true;
    setViewing(true);
    try {
      await viewSignedLease(path, isCurrent);
    } catch (err) {
      if (isCurrent()) toast.show({ variant: "danger", label: getErrorMessage(err, "Could not open the signed lease.") });
    } finally {
      viewLock.current = false;
      if (isCurrent()) setViewing(false);
    }
  }

  return { isOpen, open, close, asset, error, busy, saved, viewing, pick, save, view,
    clear: () => { if (!lock.current) { setAsset(null); setError(null); } },
  };
}
