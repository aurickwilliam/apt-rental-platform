"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Card, toast } from "@heroui/react";
import { IconFileUpload, IconLayoutGrid, IconLayoutList, IconPlus } from "@tabler/icons-react";

import { getPassportDocumentStatus } from "@repo/passport";

import PhotoGalleryModal from "@/app/components/display/PhotoGalleryModal";
import { useApplicationDocumentUrls } from "@/hooks/use-application-document-urls";
import { usePassportDocuments, type PassportDocumentRow } from "@/hooks/use-passport-documents";

import AddDocumentModal from "./AddDocumentModal";
import PassportDocumentCard, { type PassportDocumentLayout } from "./PassportDocumentCard";
import { PassportPageHeader, PassportPageShell } from "./PassportPageLayout";
import PassportReadinessCard from "./PassportReadinessCard";
import { PassportWalletSkeleton } from "./PassportSkeleton";
import ValidIdCard from "./ValidIdCard";

interface PassportClientProps {
  userId: string;
  /** Route prefix for this portal's Passport, e.g. `/tenant/passport`. */
  basePath: string;
}

/** `?add=1` opens the type picker; `?add=<type>` opens the upload step. */
const ADD_PARAM = "add";
const ADD_PICKER_VALUE = "1";

export default function PassportClient({ userId, basePath }: PassportClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { documents, loading, error, refresh, addDocument } = usePassportDocuments(userId);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [layout, setLayout] = useState<PassportDocumentLayout>("grid");

  const addParam = searchParams.get(ADD_PARAM);
  const isAddOpen = addParam !== null;
  const addDocType = addParam && addParam !== ADD_PICKER_VALUE ? addParam : null;

  const addHref = (docType: string | null) =>
    `${basePath}?${ADD_PARAM}=${docType ? encodeURIComponent(docType) : ADD_PICKER_VALUE}`;
  // Opening pushes a history entry so Back closes the modal; steps replace it.
  const openAdd = (docType: string | null = null) => router.push(addHref(docType), { scroll: false });
  const selectAddType = (docType: string | null) => router.replace(addHref(docType), { scroll: false });
  const closeAdd = () => router.replace(basePath, { scroll: false });

  const handleUploaded = (row: PassportDocumentRow) => {
    addDocument(row);
    closeAdd();
    toast.success(`${row.doc_type} added`);
  };

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
  const { resolved: resolvedDocs } = useApplicationDocumentUrls(supportingEntries);

  const idSides = resolvedId.map((side) => ({
    label: side.label === "Back" ? ("Back" as const) : ("Front" as const),
    url: side.signedUrl,
  }));
  const viewerSides = idSides.filter((side): side is { label: "Front" | "Back"; url: string } => !!side.url);
  const signedByPath = useMemo(
    () => new Map(resolvedDocs.map((doc) => [doc.path, doc.signedUrl])),
    [resolvedDocs],
  );

  return (
    <PassportPageShell>
      <PassportPageHeader
        action={
          !loading && !error ? (
            <Button onPress={() => openAdd()}>
              <IconPlus size={18} aria-hidden="true" />
              Add a Document
            </Button>
          ) : null
        }
      />

      {error ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card px-4 py-12 text-center">
          <p className="font-nunito text-xl font-bold text-card-foreground">Couldn&apos;t load your documents</p>
          <p className="max-w-md text-sm text-muted-foreground">{error}</p>
          <Button onPress={refresh}>Try Again</Button>
        </div>
      ) : loading ? (
        <PassportWalletSkeleton />
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
          <aside className="space-y-4 lg:sticky lg:top-6">
            {primaryId ? (
              <ValidIdCard
                key={primaryId.id}
                idType={primaryId.id_type ?? primaryId.doc_type}
                sides={idSides}
                loading={idLoading}
                onOpenViewer={(label) => {
                  setViewerIndex(Math.max(viewerSides.findIndex((side) => side.label === label), 0));
                  setViewerOpen(true);
                }}
              />
            ) : (
              <Card className="rounded-2xl border border-border bg-card p-4 shadow-none">
                <Card.Content className="p-0">
                  <h2 className="font-nunito text-lg font-semibold text-card-foreground">Government ID</h2>
                  <p className="text-sm text-muted-foreground">
                    Your ID is linked automatically from your approved account verification.
                  </p>
                </Card.Content>
              </Card>
            )}
            <PassportReadinessCard documents={documents} onAddDocument={(docType) => openAdd(docType)} />
          </aside>

          <section className="space-y-4 rounded-2xl border border-border bg-card p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-nunito text-lg font-semibold text-card-foreground">Supporting documents</h2>
                <p className="text-sm text-muted-foreground">
                  {supportingDocs.length} {supportingDocs.length === 1 ? "document" : "documents"}
                </p>
              </div>
              {supportingDocs.length > 0 ? (
                <div className="flex items-center gap-1" role="group" aria-label="Document layout">
                  <Button
                    isIconOnly
                    size="sm"
                    variant={layout === "grid" ? "primary" : "ghost"}
                    aria-label="Grid view"
                    aria-pressed={layout === "grid"}
                    onPress={() => setLayout("grid")}
                  >
                    <IconLayoutGrid size={16} aria-hidden="true" />
                  </Button>
                  <Button
                    isIconOnly
                    size="sm"
                    variant={layout === "list" ? "primary" : "ghost"}
                    aria-label="List view"
                    aria-pressed={layout === "list"}
                    onPress={() => setLayout("list")}
                  >
                    <IconLayoutList size={16} aria-hidden="true" />
                  </Button>
                </div>
              ) : null}
            </div>

            {supportingDocs.length === 0 ? (
              <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-border px-4 py-12 text-center">
                <IconFileUpload size={48} className="text-primary" aria-hidden="true" />
                <p className="font-nunito text-lg font-bold text-card-foreground">No supporting documents yet</p>
                <p className="max-w-md text-sm text-muted-foreground">
                  Add payslips, billing statements, or clearances so they&apos;re ready when you apply for an
                  apartment. Documents are only shared with landlords you apply to.
                </p>
                <Button onPress={() => openAdd()}>
                  <IconPlus size={18} aria-hidden="true" />
                  Add a Document
                </Button>
              </div>
            ) : (
              <div
                className={
                  layout === "grid" ? "grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4" : "flex flex-col gap-2"
                }
              >
                {supportingDocs.map((doc) => (
                  <PassportDocumentCard
                    key={doc.id}
                    href={`${basePath}/${doc.id}`}
                    label={doc.doc_type}
                    storagePath={doc.storage_path}
                    signedUrl={signedByPath.get(doc.storage_path) ?? null}
                    mimeType={doc.mime_type}
                    status={getPassportDocumentStatus(doc)}
                    createdAt={doc.created_at}
                    expiresAt={doc.expires_at}
                    layout={layout}
                  />
                ))}
                <button
                  type="button"
                  onClick={() => openAdd()}
                  className={`flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border text-sm font-medium text-muted-foreground transition-colors hover:border-primary hover:bg-accent hover:text-primary focus-visible:outline-2 focus-visible:outline-primary ${
                    layout === "grid" ? "min-h-48 flex-col" : "py-4"
                  }`}
                >
                  <IconPlus size={24} aria-hidden="true" />
                  Add document
                </button>
              </div>
            )}
          </section>
        </div>
      )}

      <AddDocumentModal
        userId={userId}
        isOpen={isAddOpen && !loading && !error}
        docType={addDocType}
        onSelectType={selectAddType}
        onClose={closeAdd}
        onUploaded={handleUploaded}
      />

      <PhotoGalleryModal
        name="Government ID"
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
