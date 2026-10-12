"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Modal, Spinner, buttonVariants, toast, useOverlayState } from "@heroui/react";
import { IconExternalLink, IconShieldCheck, IconTrash } from "@tabler/icons-react";

import { isReviewEligibleDocType } from "@repo/constants";
import { formatDate } from "@repo/utils";
import { getDocumentTypeDescription, getPassportDocumentStatus, isExpiredDate } from "@repo/passport";

import PhotoGalleryModal from "@/app/components/display/PhotoGalleryModal";
import { useApplicationDocumentUrls } from "@/hooks/use-application-document-urls";
import { usePassportDocumentActions } from "@/hooks/use-passport-document-actions";
import { usePassportDocuments } from "@/hooks/use-passport-documents";

import PassportDocumentThumbnail from "./PassportDocumentThumbnail";
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
  const router = useRouter();
  const { documents, loading, error, refresh, replaceDocument } = usePassportDocuments(userId);
  const { remove, requestReview, pending } = usePassportDocumentActions(userId);
  const confirmDelete = useOverlayState();

  const [actionError, setActionError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);

  const document = documents.find((doc) => doc.id === documentId) ?? null;

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
            {error ? "Couldn't load this document" : "Document not found"}
          </p>
          <p className="text-sm text-muted-foreground">{error ?? "This document may have been deleted."}</p>
          {error ? (
            <Button onPress={refresh}>Try Again</Button>
          ) : (
            <Link href={basePath} className={buttonVariants({ variant: "primary" })}>
              Back to Documents
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
      toast.success("Verification requested. We'll notify you once an admin has checked it.");
    } catch (err) {
      console.error("Passport review request failed", err);
      setActionError(err instanceof Error ? err.message : "Could not request review. Please try again.");
    }
  };

  const handleDelete = async () => {
    setDeleteError(null);
    try {
      await remove({ id: document.id, storagePath: document.storage_path });
      confirmDelete.close();
      toast.success("Document deleted");
      router.replace(basePath);
    } catch (err) {
      console.error("Passport delete failed", err);
      setDeleteError(err instanceof Error ? err.message : "Could not delete this document. Please try again.");
    }
  };

  return (
    <PassportPageShell>
      <PassportBackLink basePath={basePath} />

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <section className="space-y-4" aria-label="Document preview">
          {sides.map((side) => (
            <div key={side.label} className="space-y-2">
              {sides.length > 1 ? (
                <p className="font-nunito text-base font-semibold text-card-foreground">{side.label}</p>
              ) : null}
              <button
                type="button"
                disabled={!side.url}
                onClick={() => openSide(side)}
                aria-label={
                  side.isImage
                    ? `Enlarge ${document.doc_type} ${side.label.toLowerCase()}`
                    : `Open ${document.doc_type} file`
                }
                className="relative flex aspect-[4/3] max-h-[70vh] w-full items-center justify-center overflow-hidden rounded-2xl border border-border bg-muted enabled:cursor-pointer focus-visible:outline-2 focus-visible:outline-primary"
              >
                {side.url ? (
                  <PassportDocumentThumbnail
                    label={`${document.doc_type} ${side.label.toLowerCase()}`}
                    storagePath={side.path}
                    signedUrl={side.url}
                    mimeType={side.label === "Front" ? document.mime_type : null}
                    fit="contain"
                    iconSize={48}
                  />
                ) : urlsLoading ? (
                  <Spinner size="sm" color="accent" />
                ) : (
                  <span className="text-sm text-muted-foreground">Preview unavailable</span>
                )}
                {side.url && !side.isImage ? (
                  <span className="absolute right-3 bottom-3 flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                    Open file <IconExternalLink size={14} aria-hidden="true" />
                  </span>
                ) : null}
              </button>
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
                <h1 className="font-nunito text-xl font-bold text-primary">{document.doc_type}</h1>
                <PassportStatusChip status={status} />
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              {isLinkedVerification
                ? "This ID is linked to your approved account verification and is managed automatically."
                : getDocumentTypeDescription(document.doc_type)}
            </p>

            <div className="space-y-3 border-t border-border pt-4">
              <DetailRow label="Uploaded" value={formatDate(document.created_at, "medium")} />
              <DetailRow
                label="Expiry date"
                value={
                  document.expires_at
                    ? `${formatDate(`${document.expires_at}T00:00:00`, "medium")}${isExpired ? " (Expired)" : ""}`
                    : "No expiry"
                }
                isDanger={isExpired}
              />
            </div>
          </div>

          {reviewStatus === "rejected" ? (
            <Notice tone="danger" title="Not verified">
              {document.rejection_reason ?? "An admin could not verify this document."}
            </Notice>
          ) : null}
          {isExpired ? (
            <Notice tone="danger" title="Expired document">
              Upload a current copy before requesting verification.
            </Notice>
          ) : null}

          {isUnderReview && !isLinkedVerification ? (
            <Notice tone="warning" title="Under admin review">
              We&apos;ll notify you once an admin has checked this document.
            </Notice>
          ) : !isLinkedVerification ? (
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
                  {reviewStatus === "rejected" ? "Request Review Again" : "Request Verification"}
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
                Delete Document
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
                <Modal.Heading>Delete document?</Modal.Heading>
              </Modal.Header>
              <Modal.Body className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  This document will be permanently removed from your passport. Documents attached to an active
                  application cannot be deleted.
                </p>
                {deleteError ? (
                  <p role="alert" className="text-sm text-danger">
                    {deleteError}
                  </p>
                ) : null}
              </Modal.Body>
              <Modal.Footer className="flex justify-end gap-2">
                <Button variant="outline" size="sm" isDisabled={pending === "delete"} onPress={confirmDelete.close}>
                  Keep
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  isPending={pending === "delete"}
                  onPress={() => void handleDelete()}
                >
                  {pending === "delete" ? "Deleting…" : "Delete"}
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>

      <PhotoGalleryModal
        name={document.doc_type}
        photos={viewerSides.map(({ url }) => ({ url }))}
        labels={viewerSides.map(({ label }) => label)}
        isOpen={viewerOpen}
        onOpenChange={setViewerOpen}
        activeIndex={viewerIndex}
        onActiveIndexChange={setViewerIndex}
      />
    </PassportPageShell>
  );
}
