"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button, Spinner, buttonVariants } from "@heroui/react";
import { IconFileUpload, IconPlus } from "@tabler/icons-react";

import { getPassportDocumentStatus } from "@repo/passport";

import PhotoGalleryModal from "@/app/components/display/PhotoGalleryModal";
import { useApplicationDocumentUrls } from "@/hooks/use-application-document-urls";
import { usePassportDocuments } from "@/hooks/use-passport-documents";

import PassportDocumentCard from "./PassportDocumentCard";
import ValidIdCard from "./ValidIdCard";

interface PassportClientProps {
  userId: string;
  /** Route prefix for this portal's Passport, e.g. `/tenant/passport`. */
  basePath: string;
}

function AddDocumentLink({ basePath, label = "Add a Document" }: { basePath: string; label?: string }) {
  return (
    <Link href={`${basePath}/add`} className={buttonVariants({ variant: "primary" })}>
      <IconPlus size={18} aria-hidden="true" />
      {label}
    </Link>
  );
}

export default function PassportClient({ userId, basePath }: PassportClientProps) {
  const { documents, loading, error, refresh } = usePassportDocuments(userId);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);

  const primaryId = useMemo(
    () =>
      documents.find((doc) => doc.is_primary) ??
      documents.find((doc) => !!doc.verification_id && doc.is_verified) ??
      null,
    [documents],
  );
  const supportingDocs = useMemo(
    () => documents.filter((doc) => doc.id !== primaryId?.id),
    [documents, primaryId],
  );

  const idEntries = useMemo(
    () =>
      primaryId
        ? [
            { label: "Front", path: primaryId.storage_path },
            { label: "Back", path: primaryId.storage_path_back },
          ]
        : [],
    [primaryId],
  );
  const supportingEntries = useMemo(
    () => supportingDocs.map((doc) => ({ label: doc.doc_type, path: doc.storage_path })),
    [supportingDocs],
  );
  const { resolved: resolvedId, loading: idLoading } = useApplicationDocumentUrls(idEntries);
  const { resolved: resolvedDocs, loading: docsLoading } = useApplicationDocumentUrls(supportingEntries);

  const frontUrl = resolvedId.find((doc) => doc.label === "Front")?.signedUrl ?? null;
  const backUrl = resolvedId.find((doc) => doc.label === "Back")?.signedUrl ?? null;
  const viewerPhotos = [
    { label: "Front", url: frontUrl },
    { label: "Back", url: backUrl },
  ].filter((photo): photo is { label: string; url: string } => !!photo.url);
  const signedByPath = useMemo(
    () => new Map(resolvedDocs.map((doc) => [doc.path, doc.signedUrl])),
    [resolvedDocs],
  );

  // Signed URLs resolve after the rows arrive; the spinner covers both.
  const showSpinner = !error && (loading || docsLoading);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:py-8">
      <div className="mx-auto max-w-4xl space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-nunito text-2xl font-bold text-card-foreground">APT Passport</h1>
            <p className="text-sm text-muted-foreground">
              Your verified ID and supporting documents, attached automatically when you apply.
            </p>
          </div>
          {!loading && !error && documents.length > 0 ? <AddDocumentLink basePath={basePath} /> : null}
        </div>

        {error ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card px-4 py-12 text-center">
            <p className="font-nunito text-xl font-bold text-card-foreground">Couldn&apos;t load your documents</p>
            <p className="max-w-md text-sm text-muted-foreground">{error}</p>
            <Button onPress={refresh}>Try Again</Button>
          </div>
        ) : showSpinner ? (
          <div className="flex justify-center py-16">
            <Spinner color="accent" />
          </div>
        ) : documents.length === 0 ? (
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-card px-4 py-16 text-center">
            <IconFileUpload size={64} className="text-primary" aria-hidden="true" />
            <p className="font-nunito text-xl font-bold text-card-foreground">No documents yet</p>
            <p className="max-w-md text-base text-muted-foreground">
              Add your IDs and supporting documents so they&apos;re ready when you apply for an apartment.
            </p>
            <AddDocumentLink basePath={basePath} />
            <p className="max-w-md text-sm text-muted-foreground">
              Uploaded documents are stored securely and only shared with landlords during the application
              process.
            </p>
          </div>
        ) : (
          <>
            {primaryId ? (
              <ValidIdCard
                key={primaryId.id}
                idType={primaryId.id_type ?? primaryId.doc_type}
                frontUrl={frontUrl}
                backUrl={backUrl}
                loading={idLoading}
                onOpenViewer={(index) => {
                  setViewerIndex(Math.min(index, Math.max(viewerPhotos.length - 1, 0)));
                  setViewerOpen(true);
                }}
              />
            ) : null}

            <section className="space-y-3">
              <h2 className="font-nunito text-lg font-semibold text-card-foreground">Uploaded Documents</h2>
              {supportingDocs.length === 0 ? (
                <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card px-4 py-10 text-center">
                  <IconFileUpload size={48} className="text-primary" aria-hidden="true" />
                  <p className="font-nunito text-lg font-bold text-card-foreground">No supporting documents yet</p>
                  <p className="max-w-md text-sm text-muted-foreground">
                    Add payslips, billing statements, or clearances so they&apos;re ready when you apply for an
                    apartment.
                  </p>
                  <AddDocumentLink basePath={basePath} />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {supportingDocs.map((doc) => (
                    <PassportDocumentCard
                      key={doc.id}
                      href={`${basePath}/${doc.id}`}
                      label={doc.doc_type}
                      storagePath={doc.storage_path}
                      signedUrl={signedByPath.get(doc.storage_path) ?? null}
                      mimeType={doc.mime_type}
                      status={getPassportDocumentStatus(doc)}
                    />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>

      <PhotoGalleryModal
        name="Valid ID"
        photos={viewerPhotos.map(({ url }) => ({ url }))}
        labels={viewerPhotos.map(({ label }) => label)}
        isOpen={viewerOpen}
        onOpenChange={setViewerOpen}
        activeIndex={viewerIndex}
        onActiveIndexChange={setViewerIndex}
      />
    </div>
  );
}
