"use client";

import Link from "next/link";
import { Button, Modal, buttonVariants } from "@heroui/react";
import { IconArrowLeft } from "@tabler/icons-react";

import {
  PASSPORT_GOV_ID_DOC_TYPES,
  PASSPORT_UPLOADABLE_DOC_TYPES,
  type PassportPortalRole,
} from "@repo/constants";
import { PASSPORT_DOC_TYPE_KEYS, enumLabel } from "@repo/i18n";

import { useTranslation } from "@/app/components/i18n/LocaleProvider";
import { usePassportDocumentActions } from "@/hooks/use-passport-document-actions";
import type { PassportDocumentRow } from "@/hooks/use-passport-documents";

import DocumentTypePicker from "./DocumentTypePicker";
import PassportUploadForm from "./PassportUploadForm";

interface AddDocumentModalProps {
  userId: string;
  portal: PassportPortalRole;
  /** Supporting types already added; each type holds one document, replaced from its page. */
  addedDocTypes: readonly string[];
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
  portal,
  addedDocTypes,
  isOpen,
  docType,
  onSelectType,
  onClose,
  onUploaded,
}: AddDocumentModalProps) {
  const { language, t } = useTranslation();
  const { upload, pending } = usePassportDocumentActions(userId);
  const isUploading = pending === "upload";
  const isAlreadyAdded = !!docType && addedDocTypes.includes(docType);
  const isUploadable =
    !!docType &&
    !isAlreadyAdded &&
    PASSPORT_UPLOADABLE_DOC_TYPES.includes(docType);
  const isIdentityDoc =
    !!docType && PASSPORT_GOV_ID_DOC_TYPES.includes(docType);

  const handleOpenChange = (open: boolean) => {
    if (!open && !isUploading) onClose();
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={handleOpenChange}>
      <Modal.Backdrop
        isDismissable={!isUploading}
        isKeyboardDismissDisabled={isUploading}
      >
        <Modal.Container placement="center" scroll="inside" size="lg">
          <Modal.Dialog className="w-full max-w-3xl! rounded-3xl bg-card">
            {!isUploading ? (
              <Modal.CloseTrigger className="text-card-foreground" />
            ) : null}
            <Modal.Header className="flex flex-col items-start gap-1">
              {docType ? (
                <Button
                  variant="ghost"
                  isDisabled={isUploading}
                  onClick={() => onSelectType(null)}
                  className="button--bare inline-flex cursor-pointer items-center gap-1 text-sm font-medium text-muted-foreground hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <IconArrowLeft size={16} aria-hidden="true" />
                  {t("passport.add.documentTypes")}
                </Button>
              ) : null}
              <Modal.Heading className="font-nunito text-2xl font-bold text-card-foreground">
                {docType ? enumLabel(language, PASSPORT_DOC_TYPE_KEYS, docType) : t("passport.add.title")}
              </Modal.Heading>
            </Modal.Header>

            {!docType ? (
              <Modal.Body>
                <DocumentTypePicker
                  portal={portal}
                  addedDocTypes={addedDocTypes}
                  onSelect={onSelectType}
                />
              </Modal.Body>
            ) : isUploadable ? (
              <PassportUploadForm
                key={docType}
                portal={portal}
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
                    {isAlreadyAdded
                      ? t("passport.add.alreadyAdded", {
                          type: enumLabel(language, PASSPORT_DOC_TYPE_KEYS, docType ?? ""),
                        })
                      : isIdentityDoc
                        ? t("passport.add.identity")
                        : t("passport.add.unavailable")}
                  </p>
                </Modal.Body>
                <Modal.Footer className="flex justify-end gap-2">
                  {isIdentityDoc ? (
                    <Link
                      href="/verify"
                      className={buttonVariants({ variant: "primary" })}
                    >
                      {t("passport.add.goVerify")}
                    </Link>
                  ) : (
                    <Button onPress={() => onSelectType(null)}>
                      {t("passport.add.chooseType")}
                    </Button>
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
