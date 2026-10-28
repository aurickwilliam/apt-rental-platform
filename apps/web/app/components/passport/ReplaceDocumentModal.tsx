"use client";

import { Modal } from "@heroui/react";

import { usePassportDocumentActions } from "@/hooks/use-passport-document-actions";
import type { PassportDocumentRow } from "@/hooks/use-passport-documents";

import PassportUploadForm from "./PassportUploadForm";

interface ReplaceDocumentModalProps {
  userId: string;
  portal: "tenant" | "landlord";
  document: PassportDocumentRow;
  isOpen: boolean;
  onClose: () => void;
  onReplaced: (row: PassportDocumentRow) => void;
}

/**
 * Replaces the file of a supporting document. Each type holds one document, so
 * this is how a user swaps in a new copy; the document goes back to unverified.
 */
export default function ReplaceDocumentModal({
  userId,
  portal,
  document,
  isOpen,
  onClose,
  onReplaced,
}: ReplaceDocumentModalProps) {
  const { replace, pending } = usePassportDocumentActions(userId);
  const isReplacing = pending === "replace";
  const wasChecked = document.review_status === "verified" || document.review_status === "pending";

  return (
    <Modal isOpen={isOpen} onOpenChange={(open) => (!open && !isReplacing ? onClose() : undefined)}>
      <Modal.Backdrop isDismissable={!isReplacing} isKeyboardDismissDisabled={isReplacing}>
        <Modal.Container placement="center" scroll="inside" size="lg">
          <Modal.Dialog className="w-full max-w-3xl! rounded-3xl bg-card">
            {!isReplacing ? <Modal.CloseTrigger className="text-card-foreground" /> : null}
            <Modal.Header className="flex flex-col items-start gap-1">
              <Modal.Heading className="font-nunito text-2xl font-bold text-card-foreground">
                Replace {document.doc_type}
              </Modal.Heading>
            </Modal.Header>
            <PassportUploadForm
              key={document.id}
              portal={portal}
              docType={document.doc_type}
              isUploading={isReplacing}
              onCancel={onClose}
              submitLabel="Replace Document"
              pendingLabel="Replacing…"
              notice={
                wasChecked
                  ? "Replacing this document sets it back to not verified. You'll need to request verification again."
                  : "The new file replaces the current one."
              }
              onSubmit={async ({ file, expiresAt }) => {
                const row = await replace({ id: document.id, file, expiresAt });
                onReplaced(row);
              }}
            />
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
