"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Modal, Spinner, buttonVariants, toast, useOverlayState } from "@heroui/react";
import { IconExternalLink, IconRefresh, IconShieldCheck, IconTrash } from "@tabler/icons-react";

import { isReviewEligibleDocType } from "@repo/constants";
import { formatDate } from "@repo/utils";
import { getPassportDocumentStatus, isExpiredDate } from "@repo/passport";
import { PASSPORT_DOC_TYPE_KEYS, enumLabel } from "@repo/i18n";

import PhotoGalleryModal from "@/app/components/display/PhotoGalleryModal";
import { useTranslation } from "@/app/components/i18n/LocaleProvider";
import { useApplicationDocumentUrls } from "@/hooks/use-application-document-urls";
import { usePassportDocumentActions } from "@/hooks/use-passport-document-actions";
import { usePassportDocuments, type PassportDocumentRow } from "@/hooks/use-passport-documents";

import { documentTypeDescriptionKey } from "./documentTypeCopy";
import PassportDocumentThumbnail from "./PassportDocumentThumbnail";
import ReplaceDocumentModal from "./ReplaceDocumentModal";
import { PassportBackLink, PassportPageShell } from "./PassportPageLayout";
import PassportStatusChip from "./PassportStatusChip";
import { PassportDetailSkeleton } from "./PassportSkeleton";
import { DocumentTypeIcon, isImageDocument } from "./documentTypeIcons";

interface PassportDocumentDetailClientProps {
  userId: string;
  basePath: string;
  documentId: string;
}

interface PreviewSide {
  label: string;
  path: string;
  url: string | null;
  isImage: boolean;
}

function DetailRow({ label, value, isDanger = false }: { label: string; value: string; isDanger?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`text-right text-sm font-semibold ${isDanger ? "text-danger" : "text-card-foreground"}`}>
        {value}
      </span>
    </div>
  );
}

function Notice({ tone, title, children }: { tone: "danger" | "warning"; title: string; children: string }) {
  const styles =
    tone === "danger"
      ? "border-danger/30 bg-danger/10 [&>p:first-child]:text-danger"
      : "border-warning/40 bg-warning/10 [&>p:first-child]:text-card-foreground";
  return (
    <div className={`rounded-2xl border p-3 ${styles}`}>
      <p className="text-sm font-semibold">{title}</p>
      <p className="mt-0.5 text-sm text-muted-foreground">{children}</p>
    </div>
  );
}

export default function PassportDocumentDetailClient({
  userId,
  basePath,
  documentId,
}: PassportDocumentDetailClientProps) {
  const { language, t } = useTranslation();
  const router = useRouter();
  const { documents, loading, error, refresh, replaceDocument } = usePassportDocuments(userId);
  const { remove, requestReview, pending } = usePassportDocumentActions(userId);
  const confirmDelete = useOverlayState();
  const replaceModal = useOverlayState();

  const [actionError, setActionError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);

  const document = documents.find((doc) => doc.id === documentId) ?? null;
  const sideLabel = (side: string) =>
    side === "Back" ? t("passport.id.side.back") : t("passport.id.side.front");

  const entries = useMemo(
    () =>
      document
        ? [
            { label: "Front", path: document.storage_path },
            { label: "Back", path: document.storage_path_back },
          ]
        : [],
    [document],
  );
  const { resolved, loading: urlsLoading } = useApplicationDocumentUrls(entries);

  if (loading) {
    return (
      <PassportPageShell>
        <PassportBackLink basePath={basePath} />
        <PassportDetailSkeleton />
      </PassportPageShell>
    );
  }

  if (error || !document) {
    return (
      <PassportPageShell>
        <PassportBackLink basePath={basePath} />
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card px-4 py-12 text-center">
          <p className="font-nunito text-xl font-bold text-card-foreground">
            {error ? t("passport.detail.loadError") : t("passport.detail.notFound")}
          </p>
          <p className="text-sm text-muted-foreground">{error ?? t("passport.detail.deleted")}</p>
          {error ? (
            <Button onPress={refresh}>{t("passport.loadError.retry")}</Button>
          ) : (
            <Link href={basePath} className={buttonVariants({ variant: "primary" })}>
              {t("passport.detail.backToDocuments")}
            </Link>
          )}
        </div>
      </PassportPageShell>
    );
  }

  const status = getPassportDocumentStatus(document);
  const isLinkedVerification = !!document.verification_id || document.is_primary;
  const reviewStatus = document.review_status;
  const isExpired = isExpiredDate(document.expires_at);
  const isUnderReview = reviewStatus === "pending";
  const canRequestReview =
    !isLinkedVerification &&
    isReviewEligibleDocType(document.doc_type) &&
    (reviewStatus === "unverified" || reviewStatus === "rejected");

  const sides: PreviewSide[] = resolved.map((side) => ({
    label: side.label,
    path: side.path,
    url: side.signedUrl,
    isImage: isImageDocument(side.label === "Front" ? document.mime_type : null, side.path),
  }));
  const viewerSides = sides.filter((side): side is PreviewSide & { url: string } => side.isImage && !!side.url);

  const openSide = (side: PreviewSide) => {
    if (!side.url) return;
    if (!side.isImage) {
      window.open(side.url, "_blank", "noopener,noreferrer");
      return;
    }
    setViewerIndex(Math.max(viewerSides.findIndex((viewerSide) => viewerSide.label === side.label), 0));
    setViewerOpen(true);
  };

  const handleRequestReview = async () => {
    setActionError(null);
    try {
      const updated = await requestReview(document.id);
      replaceDocument(updated);
      toast.success(t("passport.detail.reviewRequested"));
    } catch (err) {
      console.error("Passport review request failed", err);
      setActionError(err instanceof Error ? err.message : t("passport.detail.reviewError"));
    }
  };

  const handleReplaced = (row: PassportDocumentRow) => {
    replaceDocument(row);
    replaceModal.close();
    toast.success(
      t("passport.detail.replaced", {
        type: enumLabel(language, PASSPORT_DOC_TYPE_KEYS, row.doc_type),
      }),
    );
  };

  const handleDelete = async () => {
    setDeleteError(null);
    try {
      await remove({ id: document.id, storagePath: document.storage_path });
      confirmDelete.close();
      toast.success(t("passport.detail.deletedToast"));
      router.replace(basePath);
    } catch (err) {
      console.error("Passport delete failed", err);
      setDeleteError(err instanceof Error ? err.message : t("passport.detail.deleteError"));
    }
  };

  return (
    <PassportPageShell>
      <PassportBackLink basePath={basePath} />

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <section className="space-y-4" aria-label={t("passport.detail.previewAria")}>
          {sides.map((side, index) => (
            <div key={side.label} className="space-y-2">
              {sides.length > 1 ? (
                <p className="font-nunito text-base font-semibold text-card-foreground">
                  {sideLabel(side.label)}
                </p>
              ) : null}
              <Button
                variant="ghost"
                isDisabled={!side.url}
                onClick={() => openSide(side)}
                aria-label={
                  side.isImage
                    ? t("passport.detail.enlargeAria", {
                        type: enumLabel(language, PASSPORT_DOC_TYPE_KEYS, document.doc_type),
                        side: sideLabel(side.label),
                      })
                    : t("passport.detail.openAria", {
                        type: enumLabel(language, PASSPORT_DOC_TYPE_KEYS, document.doc_type),
                      })
                }
                className="button--bare relative flex aspect-[4/3] max-h-[70vh] w-full items-center justify-center overflow-hidden rounded-2xl border border-border bg-muted enabled:cursor-pointer focus-visible:outline-2 focus-visible:outline-primary"
              >
                {side.url ? (
                  <PassportDocumentThumbnail
                    label={`${enumLabel(language, PASSPORT_DOC_TYPE_KEYS, document.doc_type)} ${sideLabel(side.label)}`}
                    storagePath={side.path}
                    signedUrl={side.url}
                    mimeType={side.label === "Front" ? document.mime_type : null}
                    fit="contain"
                    iconSize={48}
                    priority={index === 0}
                  />
                ) : urlsLoading ? (
                  <Spinner size="sm" color="accent" />
                ) : (
                  <span className="text-sm text-muted-foreground">
                    {t("passport.detail.previewUnavailable")}
                  </span>
                )}
                {side.url && !side.isImage ? (
                  <span className="absolute right-3 bottom-3 flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                    {t("passport.detail.openFile")} <IconExternalLink size={14} aria-hidden="true" />
                  </span>
                ) : null}
              </Button>
            </div>
          ))}
        </section>

        <aside className="space-y-4 lg:sticky lg:top-6">
          <div className="space-y-4 rounded-2xl border border-border bg-card p-4">
            <div className="flex items-start gap-3">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-primary/30 bg-accent text-primary">
                <DocumentTypeIcon docType={document.doc_type} size={24} isIdentity={isLinkedVerification} />
              </span>
              <div className="min-w-0 space-y-1">
                <h1 className="font-nunito text-xl font-bold text-primary">
                  {enumLabel(language, PASSPORT_DOC_TYPE_KEYS, document.doc_type)}
                </h1>
                <PassportStatusChip status={status} />
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              {isLinkedVerification
                ? t("passport.detail.linkedId")
                : t(
                    documentTypeDescriptionKey(
                      document.doc_type,
                      basePath.startsWith("/landlord") ? "landlord" : "tenant",
                    ),
                  )}
            </p>

            <div className="space-y-3 border-t border-border pt-4">
              <DetailRow
                label={t("passport.detail.uploaded")}
                value={formatDate(document.created_at, "medium", language)}
              />
              <DetailRow
                label={t("passport.detail.expiryDate")}
                value={
                  document.expires_at
                    ? `${formatDate(`${document.expires_at}T00:00:00`, "medium", language)}${
                        isExpired ? ` ${t("passport.detail.expiredSuffix")}` : ""
                      }`
                    : t("passport.detail.noExpiry")
                }
                isDanger={isExpired}
              />
            </div>
          </div>

          {reviewStatus === "rejected" ? (
            <Notice tone="danger" title={t("passport.detail.notVerified")}>
              {document.rejection_reason ?? t("passport.detail.notVerifiedBody")}
            </Notice>
          ) : null}
          {isExpired ? (
            <Notice tone="danger" title={t("passport.detail.expiredTitle")}>
              {t("passport.detail.expiredBody")}
            </Notice>
          ) : null}

          {isUnderReview && !isLinkedVerification ? (
            <Notice tone="warning" title={t("passport.detail.underReviewTitle")}>
              {t("passport.detail.underReviewBody")}
            </Notice>
          ) : null}
          {!isLinkedVerification ? (
            <Button fullWidth variant="outline" isDisabled={pending !== null} onPress={replaceModal.open}>
              <IconRefresh size={18} aria-hidden="true" />
              {t("passport.detail.replace")}
            </Button>
          ) : null}
          {!isUnderReview && !isLinkedVerification ? (
            <div className="space-y-2">
              {actionError ? (
                <p role="alert" className="text-sm text-danger">
                  {actionError}
                </p>
              ) : null}
              {canRequestReview ? (
                <Button
                  fullWidth
                  isDisabled={isExpired || pending !== null}
                  isPending={pending === "review"}
                  onPress={() => void handleRequestReview()}
                >
                  {pending === "review" ? (
                    <Spinner size="sm" color="current" />
                  ) : (
                    <IconShieldCheck size={18} aria-hidden="true" />
                  )}
                  {reviewStatus === "rejected"
                    ? t("passport.detail.requestAgain")
                    : t("passport.detail.request")}
                </Button>
              ) : null}
              <Button
                fullWidth
                variant="danger-soft"
                isDisabled={pending !== null}
                onPress={() => {
                  setDeleteError(null);
                  confirmDelete.open();
                }}
              >
                <IconTrash size={18} aria-hidden="true" />
                {t("passport.detail.delete")}
              </Button>
            </div>
          ) : null}
        </aside>
      </div>

      <Modal isOpen={confirmDelete.isOpen} onOpenChange={confirmDelete.setOpen}>
        <Modal.Backdrop isDismissable={pending !== "delete"} isKeyboardDismissDisabled={pending === "delete"}>
          <Modal.Container size="sm">
            <Modal.Dialog>
              <Modal.Header>
                <Modal.Heading>{t("passport.detail.deleteTitle")}</Modal.Heading>
              </Modal.Header>
              <Modal.Body className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  {t("passport.detail.deleteBody")}
                </p>
                {deleteError ? (
                  <p role="alert" className="text-sm text-danger">
                    {deleteError}
                  </p>
                ) : null}
              </Modal.Body>
              <Modal.Footer className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  fullWidth
                  isDisabled={pending === "delete"}
                  onPress={confirmDelete.close}
                >
                  {t("passport.detail.keep")}
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  fullWidth
                  isPending={pending === "delete"}
                  onPress={() => void handleDelete()}
                >
                  {pending === "delete" ? t("passport.detail.deleting") : t("passport.detail.deleteConfirm")}
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>

      {!isLinkedVerification ? (
        <ReplaceDocumentModal
          userId={userId}
          portal={basePath.startsWith("/landlord") ? "landlord" : "tenant"}
          document={document}
          isOpen={replaceModal.isOpen}
          onClose={replaceModal.close}
          onReplaced={handleReplaced}
        />
      ) : null}

      <PhotoGalleryModal
        name={document.doc_type}
        photos={viewerSides.map(({ url }) => ({ url }))}
        labels={viewerSides.map(({ label }) => sideLabel(label))}
        isOpen={viewerOpen}
        onOpenChange={setViewerOpen}
        activeIndex={viewerIndex}
        onActiveIndexChange={setViewerIndex}
      />
    </PassportPageShell>
  );
}
