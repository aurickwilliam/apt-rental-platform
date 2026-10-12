"use client";

import Link from "next/link";
import { Button, Modal, buttonVariants } from "@heroui/react";
import { IconArrowLeft } from "@tabler/icons-react";

import { DOCUMENT_TYPES, PASSPORT_GOV_ID_DOC_TYPES } from "@repo/constants";

import { usePassportDocumentActions } from "@/hooks/use-passport-document-actions";
import type { PassportDocumentRow } from "@/hooks/use-passport-documents";

import DocumentTypePicker from "./DocumentTypePicker";
import PassportUploadForm from "./PassportUploadForm";

interface AddDocumentModalProps {
  userId: string;
  isOpen: boolean;
  /** Chosen type (step 2), or null for the type picker (step 1). */
  docType: string | null;
  onSelectType: (docType: string | null) => void;
  onClose: () => void;
  onUploaded: (row: PassportDocumentRow) => void;
}

/**
 * Two-step add flow: pick a type, then upload. The wallet drives `isOpen`
 * and `docType` from the URL. Closing is blocked while a file uploads.
 */
export default function AddDocumentModal({
  userId,
  isOpen,
  docType,
  onSelectType,
  onClose,
  onUploaded,
}: AddDocumentModalProps) {
  const { upload, pending } = usePassportDocumentActions(userId);
  const isUploading = pending === "upload";
  const isUploadable = !!docType && DOCUMENT_TYPES.includes(docType);
  const isIdentityDoc = !!docType && PASSPORT_GOV_ID_DOC_TYPES.includes(docType);

  const handleOpenChange = (open: boolean) => {
    if (!open && !isUploading) onClose();
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={handleOpenChange}>
      <Modal.Backdrop isDismissable={!isUploading} isKeyboardDismissDisabled={isUploading}>
        <Modal.Container placement="center" scroll="inside" size="lg">
          <Modal.Dialog className="w-full max-w-3xl! rounded-3xl bg-card">
            {!isUploading ? <Modal.CloseTrigger /> : null}
            <Modal.Header className="flex flex-col items-start gap-1">
              {docType ? (
                <button
                  type="button"
                  disabled={isUploading}
                  onClick={() => onSelectType(null)}
                  className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-primary disabled:opacity-50"
                >
                  <IconArrowLeft size={16} aria-hidden="true" />
                  Document types
                </button>
              ) : null}
              <Modal.Heading className="font-nunito text-2xl font-bold text-card-foreground">
                {docType ?? "Add a document"}
              </Modal.Heading>
            </Modal.Header>

            {!docType ? (
              <Modal.Body>
                <DocumentTypePicker onSelect={onSelectType} />
              </Modal.Body>
            ) : isUploadable ? (
              <PassportUploadForm
                key={docType}
                docType={docType}
                isUploading={isUploading}
                onCancel={onClose}
                onSubmit={async ({ file, expiresAt }) => {
                  const row = await upload({ docType, file, expiresAt });
                  onUploaded(row);
                }}
              />
            ) : (
              <>
                <Modal.Body>
                  <p className="text-sm text-muted-foreground">
                    {isIdentityDoc
                      ? "Identity documents use live ID capture and a selfie in account verification. Once approved, your ID is added to your APT Passport automatically."
                      : "This document type is not available for Passport uploads. Choose a type from the list instead."}
                  </p>
                </Modal.Body>
                <Modal.Footer className="flex justify-end gap-2">
                  {isIdentityDoc ? (
                    <Link href="/verify" className={buttonVariants({ variant: "primary" })}>
                      Go to ID verification
                    </Link>
                  ) : (
                    <Button onPress={() => onSelectType(null)}>Choose document type</Button>
                  )}
                </Modal.Footer>
              </>
            )}
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
