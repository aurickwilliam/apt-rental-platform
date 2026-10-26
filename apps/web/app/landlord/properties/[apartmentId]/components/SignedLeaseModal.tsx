"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { Button, Label, Modal } from "@heroui/react";
import { IconFileUpload as FileUp, IconUpload as Upload } from "@tabler/icons-react";

import { formatLeaseDate } from "@/app/tenant/payment/utils";
import { SIGNED_LEASE_ACCEPT, validateSignedLeaseFile } from "@/lib/signed-lease";
import { uploadSignedLease } from "@/service/signedLeaseService";

interface SignedLeaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenancyId: string;
  /** Path of the contract already on file, when there is one. */
  currentPath: string | null;
  uploadedAt: string | null;
  acknowledgedAt: string | null;
  /** Called after the database accepted the new file. */
  onUploaded: () => void;
}

/** Upload or replace the executed contract; replacing removes the old file. */
export default function SignedLeaseModal({
  isOpen,
  onClose,
  tenancyId,
  currentPath,
  uploadedAt,
  acknowledgedAt,
  onUploaded,
}: SignedLeaseModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const isReplacing = Boolean(currentPath);

  const reset = () => {
    setFile(null);
    setFileError(null);
    setSubmitError(null);
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const picked = event.target.files?.[0] ?? null;
    event.target.value = "";
    if (!picked) return;

    const error = validateSignedLeaseFile(picked);
    setFileError(error);
    setSubmitError(null);
    if (error) return;

    setFile(picked);
  };

  const handleUpload = async () => {
    if (!file || uploading) return;
    const error = validateSignedLeaseFile(file);
    if (error) {
      setFileError(error);
      return;
    }

    setUploading(true);
    setSubmitError(null);
    try {
      await uploadSignedLease({ tenancyId, file, previousPath: currentPath });
      onUploaded();
      onClose();
    } catch (err) {
      console.error("Signed lease upload failed", err);
      setSubmitError(err instanceof Error ? err.message : "Could not upload the signed lease. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open && !uploading) {
      reset();
      onClose();
    }
  };

  return (
    <Modal>
      <Modal.Backdrop
        isOpen={isOpen}
        onOpenChange={handleOpenChange}
        isDismissable={!uploading}
        isKeyboardDismissDisabled={uploading}
      >
        <Modal.Container placement="center" size="sm">
          <Modal.Dialog className="rounded-3xl">
            <Modal.CloseTrigger className="text-card-foreground" />
            <Modal.Header>
              <Modal.Heading className="text-base font-nunito font-semibold">
                {isReplacing ? "Replace Signed Lease" : "Upload Signed Lease"}
              </Modal.Heading>
            </Modal.Header>

            <Modal.Body className="space-y-4">
              {isReplacing && (
                <div className="rounded-2xl border border-border bg-muted px-4 py-3">
                  <p className="text-sm font-nunito font-semibold text-card-foreground">
                    Current signed lease
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {uploadedAt ? `Uploaded ${formatLeaseDate(uploadedAt)}` : "On file"}
                    {acknowledgedAt ? ` · Confirmed by the tenant ${formatLeaseDate(acknowledgedAt)}` : " · Awaiting tenant confirmation"}
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label className="block text-sm font-medium text-card-foreground">
                  {isReplacing ? "Replacement file" : "Lease file"} <span className="text-danger">*</span>
                </Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={SIGNED_LEASE_ACCEPT}
                  className="hidden"
                  onChange={handleFileChange}
                  aria-label={isReplacing ? "Choose a replacement signed lease file" : "Choose a signed lease file"}
                />
                <Button
                  variant="ghost"
                  isDisabled={uploading}
                  onClick={() => fileInputRef.current?.click()}
                  className={`button--bare flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-6 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-primary ${
                    fileError
                      ? "border-danger text-danger"
                      : "border-border text-muted-foreground hover:border-primary hover:bg-accent"
                  }`}
                >
                  {file ? (
                    <>
                      <FileUp size={24} aria-hidden="true" />
                      <span className="max-w-full truncate font-nunito font-semibold text-card-foreground">
                        {file.name}
                      </span>
                      <span className="text-xs">{(file.size / 1024).toFixed(1)} KB</span>
                    </>
                  ) : (
                    <>
                      <Upload size={24} aria-hidden="true" />
                      Choose a file
                    </>
                  )}
                </Button>
                {file ? (
                  <div className="flex justify-end">
                    <Button
                      variant="ghost"
                      isDisabled={uploading}
                      onClick={reset}
                      className="button--bare cursor-pointer text-xs font-medium text-danger hover:underline"
                    >
                      Remove
                    </Button>
                  </div>
                ) : null}
                {fileError ? <p className="text-xs text-danger">{fileError}</p> : null}
                <p className="text-xs text-muted-foreground">PDF, JPG, PNG, or WebP, up to 10 MB.</p>
              </div>

              <p className="text-xs text-muted-foreground">
                {isReplacing
                  ? "Uploading a replacement deletes the current file and asks the tenant to confirm the new one."
                  : "Upload the contract both parties signed. The tenant can open and confirm it from My Rental."}
              </p>

              {submitError ? (
                <p role="alert" className="rounded-lg border border-danger/40 bg-danger/10 p-3 text-sm text-danger">
                  {submitError}
                </p>
              ) : null}
            </Modal.Body>

            <Modal.Footer className="flex gap-2">
              <Button variant="ghost" size="sm" isDisabled={uploading} onPress={onClose} className="flex-1 rounded-full font-nunito">
                Cancel
              </Button>
              <Button
                size="sm"
                isPending={uploading}
                isDisabled={!file || !!fileError}
                onPress={() => void handleUpload()}
                className="flex-1 rounded-full font-nunito"
              >
                {isReplacing ? "Replace file" : "Upload file"}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
