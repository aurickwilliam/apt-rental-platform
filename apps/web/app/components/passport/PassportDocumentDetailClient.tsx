"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Modal, Spinner, buttonVariants, toast, useOverlayState } from "@heroui/react";
import { IconArrowLeft, IconExternalLink, IconFileText, IconShieldCheck, IconTrash } from "@tabler/icons-react";

import { isReviewEligibleDocType } from "@repo/constants";
import { formatDate } from "@repo/utils";
import { getDocumentTypeDescription, getPassportDocumentStatus, isExpiredDate } from "@repo/passport";

import PhotoGalleryModal from "@/app/components/display/PhotoGalleryModal";
import { useApplicationDocumentUrls } from "@/hooks/use-application-document-urls";
import { usePassportDocumentActions } from "@/hooks/use-passport-document-actions";
import { usePassportDocuments } from "@/hooks/use-passport-documents";

import PassportStatusChip from "./PassportStatusChip";
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

function BackLink({ basePath }: { basePath: string }) {
  return (
    <Link
      href={basePath}
      className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-primary"
    >
      <IconArrowLeft size={16} aria-hidden="true" />
      APT Passport
    </Link>
  );
}

function DetailRow({ label, value, isDanger = false }: { label: string; value: string; isDanger?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`text-sm font-semibold ${isDanger ? "text-danger" : "text-card-foreground"}`}>{value}</span>
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
      <div className="flex justify-center px-4 py-16">
        <Spinner color="accent" />
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 px-4 py-6 sm:py-8">
        <BackLink basePath={basePath} />
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
      </div>
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
      toast.success("Document deleted.");
      router.replace(basePath);
    } catch (err) {
      console.error("Passport delete failed", err);
      setDeleteError(err instanceof Error ? err.message : "Could not delete this document. Please try again.");
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:py-8">
      <div className="mx-auto max-w-2xl space-y-4">
        <BackLink basePath={basePath} />

        <div className="flex items-center gap-3">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-primary/30 bg-accent text-primary">
            <DocumentTypeIcon docType={document.doc_type} size={24} isIdentity={isLinkedVerification} />
          </span>
          <div className="min-w-0 space-y-1">
            <h1 className="font-nunito text-2xl font-bold text-primary">{document.doc_type}</h1>
            <PassportStatusChip status={status} />
          </div>
        </div>

        <p className="text-sm text-muted-foreground">
          {isLinkedVerification
            ? "This ID is linked to your approved account verification and is managed automatically."
            : getDocumentTypeDescription(document.doc_type)}
        </p>

        <section className="space-y-3">
          <h2 className="font-nunito text-base font-semibold text-muted-foreground">Document Preview</h2>
          <div className={`grid gap-3 ${sides.length > 1 ? "sm:grid-cols-2" : ""}`}>
            {sides.map((side) => (
              <div key={side.label} className="space-y-2">
                {sides.length > 1 ? (
                  <p className="font-nunito text-base font-semibold text-card-foreground">{side.label}</p>
                ) : null}
                <button
                  type="button"
                  disabled={!side.url}
                  onClick={() => openSide(side)}
                  aria-label={side.isImage ? `Enlarge ${document.doc_type} ${side.label.toLowerCase()}` : `Open ${document.doc_type} file`}
                  className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-2xl border border-border bg-muted enabled:cursor-pointer focus-visible:outline-2 focus-visible:outline-primary"
                >
                  {side.isImage && side.url ? (
                    <Image src={side.url} alt={`${document.doc_type} ${side.label.toLowerCase()}`} fill unoptimized className="object-contain" />
                  ) : urlsLoading ? (
                    <Spinner size="sm" color="accent" />
                  ) : side.url ? (
                    <span className="flex flex-col items-center gap-2 text-muted-foreground">
                      <IconFileText size={40} aria-hidden="true" />
                      <span className="flex items-center gap-1 text-sm font-medium text-primary">
                        Open file <IconExternalLink size={14} aria-hidden="true" />
                      </span>
                    </span>
                  ) : (
                    <span className="text-sm text-muted-foreground">Preview unavailable</span>
                  )}
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="font-nunito text-base font-semibold text-muted-foreground">Details</h2>
          <div className="space-y-3 rounded-2xl border border-border bg-card p-4">
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
        </section>

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
          <div className="space-y-3">
            {actionError ? (
              <p role="alert" className="text-sm text-danger">
                {actionError}
              </p>
            ) : null}
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button
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
              {canRequestReview ? (
                <Button
                  isDisabled={isExpired || pending !== null}
                  isPending={pending === "review"}
                  onPress={() => void handleRequestReview()}
                >
                  {pending === "review" ? <Spinner size="sm" color="current" /> : <IconShieldCheck size={18} aria-hidden="true" />}
                  {reviewStatus === "rejected" ? "Request Review Again" : "Request Verification"}
                </Button>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>

      <Modal isOpen={confirmDelete.isOpen} onOpenChange={confirmDelete.setOpen}>
        <Modal.Backdrop>
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
    </div>
  );
}
