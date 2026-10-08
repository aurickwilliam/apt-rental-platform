"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Checkbox,
  FieldError,
  Input,
  Label,
  Modal,
  Spinner,
  TextField,
  useOverlayState,
} from "@heroui/react";
import { IconAlertTriangle, IconFileInfo, IconFileText, IconUpload } from "@tabler/icons-react";

import { getDocumentTypeDescription, isExpiredDate, toExpiryDateString } from "@repo/passport";

import { usePassportDocumentActions } from "@/hooks/use-passport-document-actions";
import { PASSPORT_UPLOAD_ACCEPT, validatePassportUploadFile } from "@/lib/passport-upload";

import { DocumentTypeIcon, isImageDocument } from "./documentTypeIcons";

interface PassportUploadFormProps {
  userId: string;
  basePath: string;
  docType: string;
}

function validateExpiry(value: string): string | null {
  if (!value) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return "Select a valid expiry date.";
  return isExpiredDate(value) ? "Expiry date cannot be in the past." : null;
}

export default function PassportUploadForm({ userId, basePath, docType }: PassportUploadFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const legalNotice = useOverlayState();
  const { upload, pending } = usePassportDocumentActions(userId);

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState("");
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const expiryError = validateExpiry(expiresAt);
  const isUploading = pending === "upload";

  // Object URLs hold the file in memory until revoked.
  useEffect(() => {
    if (!previewUrl) return;
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const picked = event.target.files?.[0] ?? null;
    event.target.value = "";
    if (!picked) return;

    const error = validatePassportUploadFile(picked);
    setFileError(error);
    setSubmitError(null);
    if (error) return;

    setFile(picked);
    setPreviewUrl(isImageDocument(picked.type, picked.name) ? URL.createObjectURL(picked) : null);
  };

  const handleRemoveFile = () => {
    setFile(null);
    setPreviewUrl(null);
  };

  const handleSubmit = async () => {
    if (!file || !isConfirmed || expiryError) return;
    setSubmitError(null);
    try {
      await upload({ docType, file, expiresAt: expiresAt || null });
      router.replace(basePath);
    } catch (err) {
      console.error("Passport upload failed", err);
      setSubmitError(err instanceof Error ? err.message : "Could not save your document. Please try again.");
    }
  };

  return (
    <div className="space-y-6 rounded-2xl border border-border bg-card p-4 sm:p-6">
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-primary">
            <DocumentTypeIcon docType={docType} size={20} />
          </span>
          <h2 className="font-nunito text-2xl font-bold text-primary">{docType}</h2>
        </div>
        <p className="text-sm text-muted-foreground">{getDocumentTypeDescription(docType)}</p>
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <IconFileInfo size={16} aria-hidden="true" />
          Accepted formats: JPG, PNG, WebP, or PDF (max 5MB)
        </p>
      </div>

      <div className="space-y-2">
        <Label className="block text-sm font-medium text-card-foreground">
          Document <span className="text-danger">*</span>
        </Label>
        <input
          ref={fileInputRef}
          type="file"
          accept={PASSPORT_UPLOAD_ACCEPT}
          className="hidden"
          onChange={handleFileChange}
          aria-label={`Choose your ${docType} file`}
        />
        {file ? (
          <div className="flex items-center gap-3 rounded-xl border border-border p-3">
            <span className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted">
              {previewUrl ? (
                // Local object URL preview; next/image cannot load blob: URLs.
                // eslint-disable-next-line @next/next/no-img-element
                <img src={previewUrl} alt={`${docType} preview`} className="size-full object-cover" />
              ) : (
                <IconFileText size={24} className="text-muted-foreground" aria-hidden="true" />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-card-foreground">{file.name}</p>
              <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
            </div>
            <Button size="sm" variant="outline" isDisabled={isUploading} onPress={handleRemoveFile}>
              Remove
            </Button>
            <Button
              size="sm"
              variant="tertiary"
              isDisabled={isUploading}
              onPress={() => fileInputRef.current?.click()}
            >
              Replace
            </Button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={`flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed py-8 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-primary ${
              fileError ? "border-danger text-danger" : "border-border text-muted-foreground hover:border-primary hover:bg-accent"
            }`}
          >
            <IconUpload size={20} aria-hidden="true" />
            Choose a file
          </button>
        )}
        {fileError ? <p className="text-xs text-danger">{fileError}</p> : null}
      </div>

      <TextField isInvalid={!!expiryError} value={expiresAt} onChange={setExpiresAt}>
        <Label className="text-sm font-medium text-card-foreground">Expiry date (optional)</Label>
        <Input
          type="date"
          min={toExpiryDateString(new Date())}
          className="border-border bg-card text-card-foreground"
        />
        <FieldError>{expiryError}</FieldError>
      </TextField>

      <div className="space-y-3">
        <Checkbox isSelected={isConfirmed} onChange={setIsConfirmed}>
          <Checkbox.Content className="flex cursor-pointer items-start gap-2 select-none">
            <Checkbox.Control className="mt-0.5 size-5 shrink-0">
              <Checkbox.Indicator />
            </Checkbox.Control>
            <Label className="text-sm font-semibold text-card-foreground">
              I confirm that the information provided is true and the document belongs to me.
            </Label>
          </Checkbox.Content>
        </Checkbox>

        <p className="text-sm text-muted-foreground">
          <span className="text-danger">*</span> By uploading, you confirm this document is valid and belongs to
          you. Fraudulent documents may lead to account suspension.{" "}
          <button
            type="button"
            onClick={legalNotice.open}
            className="font-medium text-primary underline focus-visible:outline-2 focus-visible:outline-primary"
          >
            Legal notice
          </button>
        </p>
      </div>

      {submitError ? (
        <p role="alert" className="rounded-lg border border-danger/40 bg-danger/10 p-3 text-sm text-danger">
          {submitError}
        </p>
      ) : null}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="outline" isDisabled={isUploading} onPress={() => router.push(`${basePath}/add`)}>
          Change type
        </Button>
        <Button
          isDisabled={!file || !isConfirmed || !!expiryError}
          isPending={isUploading}
          onPress={() => void handleSubmit()}
        >
          {isUploading ? <Spinner size="sm" color="current" /> : null}
          Add Document
        </Button>
      </div>

      <Modal isOpen={legalNotice.isOpen} onOpenChange={legalNotice.setOpen}>
        <Modal.Backdrop>
          <Modal.Container size="sm">
            <Modal.Dialog>
              <Modal.CloseTrigger />
              <Modal.Header>
                <Modal.Heading className="flex items-center gap-2">
                  <IconAlertTriangle size={20} className="text-warning" aria-hidden="true" />
                  Legal notice
                </Modal.Heading>
              </Modal.Header>
              <Modal.Body>
                <p className="text-sm text-muted-foreground">
                  By uploading your documents, you certify that all information is true and valid. Any fraudulent
                  or falsified documents may result in account suspension and legal action in accordance with
                  applicable Philippine laws on fraud and identity theft, including the Cybercrime Prevention Act
                  (Republic Act No. 10175).
                </p>
              </Modal.Body>
              <Modal.Footer className="flex justify-end">
                <Button variant="secondary" size="sm" onPress={legalNotice.close}>
                  Close
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </div>
  );
}
