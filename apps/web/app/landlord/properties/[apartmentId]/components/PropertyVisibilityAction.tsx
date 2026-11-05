"use client";

import { useEffect, useRef, useState } from "react";
import { Button, Modal, toast } from "@heroui/react";
import { IconEye, IconEyeOff } from "@tabler/icons-react";
import { createClient } from "@repo/supabase/browser";
import ErrorBanner from "@/app/components/display/ErrorBanner";
import { canChangeListingVisibility } from "@/lib/property-listing-visibility";
import { changePropertyVisibility } from "@/service/propertyVisibilityService";

interface PropertyVisibilityActionProps {
  apartmentId: string;
  status: string;
  hasActiveTenancy: boolean;
  onStatusChanged: (status: "available" | "under_maintenance") => void;
}

export default function PropertyVisibilityAction({ apartmentId, status, hasActiveTenancy, onStatusChanged }: PropertyVisibilityActionProps) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const savingRef = useRef(false);
  const activeRef = useRef(true);
  const hidden = status === "under_maintenance";
  const label = hidden ? "Show Listing" : "Hide Listing";

  useEffect(() => {
    activeRef.current = true;
    return () => { activeRef.current = false; };
  }, []);

  if (!canChangeListingVisibility(status, hasActiveTenancy)) return null;

  const close = () => {
    if (savingRef.current) return;
    setOpen(false);
    setError(null);
  };

  const confirm = async () => {
    if (savingRef.current || (status !== "available" && status !== "under_maintenance")) return;
    savingRef.current = true;
    setSaving(true);
    setError(null);
    try {
      const result = await changePropertyVisibility(createClient(), apartmentId, status);
      if (!activeRef.current) return;
      if (!result.success) {
        setError(result.error);
        return;
      }
      onStatusChanged(result.status);
      setOpen(false);
      toast.success(hidden ? "Listing shown" : "Listing hidden", {
        description: hidden ? "The listing is available for browsing unless restricted by an administrator." : "Your property is hidden from browsing until you show it again.",
      });
    } catch {
      console.error("Property visibility request failed");
      if (!activeRef.current) return;
      setError("Could not update listing visibility. Refresh the page to check its status before trying again.");
    } finally {
      savingRef.current = false;
      if (activeRef.current) setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-2 pb-4">
      <p className="text-sm text-muted-foreground">
        {hidden ? "Hidden from browsing during renovation or maintenance. Show it again when it is ready." : "Temporarily hide this listing from browsing during renovation or maintenance."}
      </p>
      <Button variant="secondary" size="sm" className="w-full" onPress={() => setOpen(true)}>
        {hidden ? <IconEye size={16} aria-hidden="true" /> : <IconEyeOff size={16} aria-hidden="true" />}
        {label}
      </Button>
      <Modal>
        <Modal.Backdrop isOpen={open} onOpenChange={(value) => { if (!value) close(); }} isDismissable={!saving} isKeyboardDismissDisabled={saving}>
          <Modal.Container placement="center" size="sm">
            <Modal.Dialog>
              <Modal.Header><Modal.Heading>{label}</Modal.Heading></Modal.Header>
              <Modal.Body className="flex flex-col gap-3">
                <p className="text-sm text-muted-foreground">
                  {hidden ? "Make this listing available for browsing again? Any administrator restriction will still apply." : "Hide this listing from browsing, search and maps? It will be marked as hidden and under maintenance. Your property and existing records will not be deleted."}
                </p>
                {error ? <ErrorBanner message={error} /> : null}
              </Modal.Body>
              <Modal.Footer>
                <Button variant="ghost" onPress={close} isDisabled={saving}>Cancel</Button>
                <Button onPress={() => void confirm()} isPending={saving}>{label}</Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </div>
  );
}
