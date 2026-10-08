"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { Button, Checkbox, FieldError, Input, Label, Modal, Spinner, TextField } from "@heroui/react";
import { IconChevronDown, IconFileInfo, IconFileText, IconUpload } from "@tabler/icons-react";

import { getDocumentTypeDescription, isExpiredDate, toExpiryDateString } from "@repo/passport";

import PdfThumbnail from "@/app/components/display/PdfThumbnail";
import { PASSPORT_UPLOAD_ACCEPT, validatePassportUploadFile } from "@/lib/passport-upload";

import { DocumentTypeIcon, isImageDocument } from "./documentTypeIcons";
import { isPdfDocument } from "./PassportDocumentThumbnail";

interface PassportUploadFormProps {
  docType: string;
  isUploading: boolean;
  /** Rejects with a user-facing message; the chosen file is kept for a retry. */
  onSubmit: (input: { file: File; expiresAt: string | null }) => Promise<void>;
  onCancel: () => void;
}

function validateExpiry(value: string): string | null {
  if (!value) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return "Select a valid expiry date.";
  return isExpiredDate(value) ? "Expiry date cannot be in the past." : null;
}

/** Upload step of the add-document modal; renders the modal body and footer. */
export default function PassportUploadForm({ docType, isUploading, onSubmit, onCancel }: PassportUploadFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState("");
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isLegalOpen, setIsLegalOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const expiryError = validateExpiry(expiresAt);

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
    setPreviewUrl(URL.createObjectURL(picked));
  };

  const handleSubmit = async () => {
    if (!file || !isConfirmed || expiryError) return;
    setSubmitError(null);
    try {
      await onSubmit({ file, expiresAt: expiresAt || null });
    } catch (err) {
      console.error("Passport upload failed", err);
      setSubmitError(err instanceof Error ? err.message : "Could not save your document. Please try again.");
    }
  };

  return (
    <>
      <Modal.Body className="space-y-5">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-primary">
            <DocumentTypeIcon docType={docType} size={20} />
          </span>
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">{getDocumentTypeDescription(docType)}</p>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              <IconFileInfo size={14} aria-hidden="true" />
              JPG, PNG, WebP, or PDF, up to 5 MB
            </p>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
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
            <button
              type="button"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
              aria-label={file ? `Replace ${file.name}` : "Choose a file"}
              className={`relative flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 overflow-hidden rounded-xl border-2 border-dashed text-sm transition-colors focus-visible:outline-2 focus-visible:outline-primary ${
                fileError
                  ? "border-danger text-danger"
                  : file
                    ? "border-border"
                    : "border-border text-muted-foreground hover:border-primary hover:bg-accent"
              }`}
            >
              {file && previewUrl && isImageDocument(file.type, file.name) ? (
                // Local object URL preview; next/image cannot load blob: URLs.
                // eslint-disable-next-line @next/next/no-img-element
                <img src={previewUrl} alt={`${docType} preview`} className="absolute inset-0 size-full object-contain" />
              ) : file && previewUrl && isPdfDocument(file.type, file.name) ? (
                <PdfThumbnail
                  url={previewUrl}
                  cacheKey={`local:${file.name}:${file.size}:${file.lastModified}`}
                  alt={`${docType} preview`}
                  fit="contain"
                />
              ) : file ? (
                <>
                  <IconFileText size={36} className="text-muted-foreground" aria-hidden="true" />
                  <span className="px-3 text-center text-card-foreground">{file.name}</span>
                </>
              ) : (
                <>
                  <IconUpload size={24} aria-hidden="true" />
                  Choose a file
                </>
              )}
            </button>
            {file ? (
              <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                <span className="truncate">
                  {file.name} · {(file.size / 1024).toFixed(1)} KB
                </span>
                <button
                  type="button"
                  disabled={isUploading}
                  onClick={() => {
                    setFile(null);
                    setPreviewUrl(null);
                  }}
                  className="shrink-0 font-medium text-danger hover:underline"
                >
                  Remove
                </button>
              </div>
            ) : null}
            {fileError ? <p className="text-xs text-danger">{fileError}</p> : null}
          </div>

          <div className="space-y-5">
            <TextField isInvalid={!!expiryError} value={expiresAt} onChange={setExpiresAt} isDisabled={isUploading}>
              <Label className="text-sm font-medium text-card-foreground">Expiry date (optional)</Label>
              <Input
                type="date"
                min={toExpiryDateString(new Date())}
                className="border-border bg-card text-card-foreground"
              />
              <FieldError>{expiryError}</FieldError>
            </TextField>

            <Checkbox isSelected={isConfirmed} onChange={setIsConfirmed} isDisabled={isUploading}>
              <Checkbox.Content className="flex cursor-pointer items-start gap-2 select-none">
                <Checkbox.Control className="mt-0.5 size-5 shrink-0">
                  <Checkbox.Indicator />
                </Checkbox.Control>
                <Label className="text-sm font-semibold text-card-foreground">
                  I confirm that the information provided is true and the document belongs to me.{" "}
                  <span className="text-danger">*</span>
                </Label>
              </Checkbox.Content>
            </Checkbox>

            <div className="rounded-xl border border-border p-3">
              <button
                type="button"
                onClick={() => setIsLegalOpen((open) => !open)}
                aria-expanded={isLegalOpen}
                className="flex w-full items-center justify-between gap-2 text-left text-sm font-medium text-card-foreground"
              >
                Legal notice
                <IconChevronDown
                  size={16}
                  className={`shrink-0 transition-transform ${isLegalOpen ? "rotate-180" : ""}`}
                  aria-hidden="true"
                />
              </button>
              <p className="mt-1 text-xs text-muted-foreground">
                Fraudulent documents may lead to account suspension.
              </p>
              {isLegalOpen ? (
                <p className="mt-2 text-xs text-muted-foreground">
                  By uploading your documents, you certify that all information is true and valid. Any fraudulent or
                  falsified documents may result in account suspension and legal action in accordance with applicable
                  Philippine laws on fraud and identity theft, including the Cybercrime Prevention Act (Republic Act No.
                  10175).
                </p>
              ) : null}
            </div>
          </div>
        </div>

        {submitError ? (
          <p role="alert" className="rounded-lg border border-danger/40 bg-danger/10 p-3 text-sm text-danger">
            {submitError}
          </p>
        ) : null}
      </Modal.Body>

      <Modal.Footer className="flex justify-end gap-2">
        <Button variant="outline" isDisabled={isUploading} onPress={onCancel}>
          Cancel
        </Button>
        <Button
          isDisabled={!file || !isConfirmed || !!expiryError}
          isPending={isUploading}
          onPress={() => void handleSubmit()}
        >
          {isUploading ? <Spinner size="sm" color="current" /> : null}
          {isUploading ? "Adding…" : "Add Document"}
        </Button>
      </Modal.Footer>
    </>
  );
}
