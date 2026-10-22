"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { Button, Card, FieldError, Label, Modal, TextArea, TextField, useOverlayState } from "@heroui/react";
import { IconArrowLeft as ArrowLeft, IconMail as Mail, IconMapPin as MapPin, IconPhone as Phone, IconFileText as FileText, IconEye as Eye, IconCheck as Check, IconX as X, IconShieldCheck as ShieldCheck, IconHome, IconUser, IconBriefcase, IconAdjustments, IconAddressBook, IconMessage, IconClipboardList } from "@tabler/icons-react";
import { formatDate, formatPesoDisplay, getInitials } from "@repo/utils";
import StatusChip from "@/app/components/display/StatusChip";
import UserAvatar from "@/app/components/profile/UserAvatar";
import { useLandlordApplications } from "@/hooks/use-landlord-applications";
import { useLandlordApplicationActions } from "@/hooks/use-landlord-application-actions";
import { useApplicationDocumentUrls } from "@/hooks/use-application-document-urls";
import { usePassportVerifiedPaths } from "@/hooks/use-passport-verified-paths";
import { buildApplicationDocumentList } from "@/lib/application-documents";
import { statusChipColor } from "../lib/application-status";
import { applicationStatusLabel } from "../lib/application-list";
import ApplicationDetailSection from "./components/ApplicationDetailSection";
import ApplicationDetailSkeleton from "./components/ApplicationDetailSkeleton";
import { useAuthIdentity } from "@/hooks/use-auth-identity";

function DetailField({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="min-w-0 rounded-xl bg-muted/40 px-3 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-nunito font-semibold leading-6 text-card-foreground wrap-break-word">{value?.trim() || "Not provided"}</p>
    </div>
  );
}

function DocumentRow({ label, path, signedUrl, verified, emptyLabel, loading }: {
  label: string; path: string | null; signedUrl: string | null; verified: boolean; emptyLabel: string; loading: boolean;
}) {
  const hint = !path ? emptyLabel : loading ? "Preparing secure preview…" : signedUrl ? "Open attached document" : "Document preview unavailable";
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-muted/30 p-3">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><FileText size={20} aria-hidden="true" /></span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-nunito font-semibold text-card-foreground">{label}</p>
            {path && verified ? <StatusChip size="sm" tone="success"><span className="inline-flex items-center gap-1"><ShieldCheck size={13} aria-hidden="true" />Verified</span></StatusChip> : null}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
        </div>
      </div>
      <Button size="sm" variant="secondary" aria-label={`View ${label}`} isDisabled={!signedUrl || loading} onPress={() => {
        if (signedUrl) window.open(signedUrl, "_blank", "noopener,noreferrer");
      }}><Eye size={15} aria-hidden="true" />View</Button>
    </div>
  );
}

export default function LandlordApplicationDetailPage() {
  const { applicationId } = useParams<{ applicationId: string }>();
  const identity = useAuthIdentity();
  return <ApplicationDetailContent key={`${identity.authUserId ?? "none"}:${identity.generation}:${applicationId}`} applicationId={applicationId} />;
}

function ApplicationDetailContent({ applicationId }: { applicationId: string }) {
  const router = useRouter();
  const { applications, loading, error, refresh, revalidate, revalidating } = useLandlordApplications();
  const { localStatus, actionLoading, isRejectDialogOpen, errorMessage, approve, reject, openRejectDialog, closeRejectDialog, clearError } = useLandlordApplicationActions(revalidate);
  const rejectModal = useOverlayState();
  const [rejectReason, setRejectReason] = useState("");
  const [rejectError, setRejectError] = useState("");
  const app = useMemo(() => applications.find((application) => application.id === applicationId) ?? null, [applications, applicationId]);
  const docEntries = useMemo(() => app ? buildApplicationDocumentList(app, {}) : [], [app]);
  const { resolved: resolvedDocs, loading: documentsLoading, error: documentsError } = useApplicationDocumentUrls(docEntries);
  const signedByLabel = useMemo(() => new Map(resolvedDocs.map((document) => [document.label, document.signedUrl])), [resolvedDocs]);
  const docPaths = useMemo(() => docEntries.map((document) => document.path).filter((path): path is string => !!path), [docEntries]);
  const verifiedPaths = usePassportVerifiedPaths(app?.tenant_id ?? null, docPaths);

  const backButton = (
    <Button variant="ghost" size="sm" className="gap-1.5 font-nunito w-fit"
      onPress={() => router.push("/landlord/applications")}
      onHoverStart={() => router.prefetch("/landlord/applications")}
      onFocus={() => router.prefetch("/landlord/applications")}>
      <ArrowLeft size={16} aria-hidden="true" />Back to Applications
    </Button>
  );

  if (loading) return <ApplicationDetailSkeleton />;
  if (error || !app) {
    return (
      <div className="w-full min-w-0 p-4 md:p-6 flex flex-col gap-4 bg-card">
        {backButton}
        <Card className="landlord-application-detail-card border border-border">
          <div className="flex flex-col items-center gap-3 py-10 text-center" role={error ? "alert" : undefined}>
            <IconClipboardList size={32} className="text-primary" aria-hidden="true" />
            <h1 className="text-xl font-nunito font-bold text-card-foreground">{error ? "Could not load application" : "Application not found"}</h1>
            <p className="max-w-md text-sm leading-6 text-muted-foreground">{error || "This application does not exist or you don't have access to it."}</p>
            {error ? <Button variant="secondary" onPress={() => void refresh()}>Try Again</Button> : null}
          </div>
        </Card>
      </div>
    );
  }

  const displayStatus = app.status === "Applied" ? (localStatus ?? app.status) : app.status;
  const isPending = displayStatus === "Applied";
  const isUnitOccupied = app.apartment_status === "occupied";
  const handleRejectConfirm = () => {
    if (!rejectReason.trim()) {
      setRejectError("Please provide a reason for rejection.");
      return;
    }
    setRejectError("");
    void reject(app.id, rejectReason.trim());
  };

  return (
    <div className="w-full min-w-0 p-4 md:p-6 flex flex-col gap-4 bg-card min-h-0">
      <div>
        {backButton}
        <h1 className="mt-2 text-2xl font-nunito font-bold text-card-foreground">Application Details</h1>
        <p className="mt-1 text-sm text-muted-foreground">Review the tenant&apos;s information and supporting documents.</p>
      </div>
      {errorMessage ? <div role="alert" className="rounded-xl border border-danger/20 bg-danger/5 p-4 text-sm text-danger">{errorMessage}</div> : null}
      {revalidating ? <span role="status" className="sr-only">Updating application details</span> : null}

      <div className="grid grid-cols-1 items-stretch gap-4 xl:grid-cols-2">
        <ApplicationDetailSection title="Property" subtitle="Tenant application for this property." icon={IconHome}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative h-36 w-full shrink-0 overflow-hidden rounded-xl bg-muted sm:h-28 sm:w-40">
              <Image src={app.apartment_thumbnail_url || "/default/default-thumbnail.jpeg"} alt={app.apartment_name} fill unoptimized className="object-cover" />
            </div>
            <div className="min-w-0">
              <p className="text-lg font-nunito font-bold text-card-foreground wrap-break-word">{app.apartment_name}</p>
              <p className="mt-2 flex items-start gap-2 text-sm leading-6 text-muted-foreground"><MapPin size={16} className="mt-1 shrink-0" aria-hidden="true" />{app.apartment_address || "Address not provided"}</p>
              <p className="mt-2 text-base font-nunito font-bold text-primary">{formatPesoDisplay(app.monthly_rent)}<span className="text-sm font-normal text-muted-foreground"> / month</span></p>
            </div>
          </div>
        </ApplicationDetailSection>
        <ApplicationDetailSection title="Applicant" subtitle="Tenant contact information and application status." icon={IconUser}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex min-w-0 flex-1 items-start gap-3">
              <UserAvatar src={app.tenant_avatar_url} initials={getInitials(app.tenant_name)} alt={app.tenant_name} size="lg" className="shrink-0" />
              <div className="min-w-0">
                <p className="text-lg font-nunito font-bold text-card-foreground wrap-break-word">{app.tenant_name}</p>
                <div className="mt-2 flex flex-col gap-2 text-sm text-muted-foreground">
                  <p className="flex items-start gap-2 wrap-anywhere"><Mail size={16} className="mt-0.5 shrink-0" aria-hidden="true" />{app.tenant_email || "Email not provided"}</p>
                  <p className="flex items-start gap-2"><MapPin size={16} className="mt-0.5 shrink-0" aria-hidden="true" />{app.tenant_city || "Location not provided"}</p>
                  <p className="flex items-start gap-2"><Phone size={16} className="mt-0.5 shrink-0" aria-hidden="true" />{app.tenant_mobile_number || "Phone not provided"}</p>
                </div>
              </div>
            </div>
            <StatusChip size="sm" tone={statusChipColor(displayStatus)} className="shrink-0">{applicationStatusLabel(displayStatus)}</StatusChip>
          </div>
        </ApplicationDetailSection>
      </div>

      {displayStatus === "Rejected" && app.rejected_reason ? (
        <div className="rounded-xl border border-danger/20 bg-danger/5 p-4">
          <h2 className="text-sm font-nunito font-bold text-danger">Rejection reason</h2>
          <p className="mt-1 text-sm leading-6 whitespace-pre-line text-card-foreground wrap-anywhere">{app.rejected_reason}</p>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ApplicationDetailSection title="Application Details" subtitle="Submitted dates, rent and household size." icon={IconClipboardList}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <DetailField label="Date Submitted" value={formatDate(app.created_at, "medium")} />
            <DetailField label="Move-in Date" value={formatDate(app.move_in_date, "medium")} />
            <DetailField label="Monthly Rent" value={formatPesoDisplay(app.monthly_rent)} />
            <DetailField label="No. of Occupants" value={String(app.no_occupants)} />
          </div>
        </ApplicationDetailSection>
        <ApplicationDetailSection title="Employment" subtitle="Employment and income information provided by the tenant." icon={IconBriefcase}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <DetailField label="Occupation" value={app.occupation} />
            <DetailField label="Employer" value={app.employer_name} />
            <DetailField label="Employment Type" value={app.employment_type} />
            <DetailField label="Monthly Income" value={formatPesoDisplay(app.monthly_income)} />
          </div>
        </ApplicationDetailSection>
        <ApplicationDetailSection title="Preferences" subtitle="Household preferences and parking needs." icon={IconAdjustments}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <DetailField label="Has Pets" value={app.has_pets ? "Yes" : "No"} />
            <DetailField label="Has Smoker" value={app.has_smoker ? "Yes" : "No"} />
            <DetailField label="Needs Parking" value={app.need_parking ? "Yes" : "No"} />
          </div>
        </ApplicationDetailSection>
        <ApplicationDetailSection title="Previous Landlord" subtitle="Previous rental contact information, when provided." icon={IconAddressBook}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <DetailField label="Name" value={app.prev_landlord_name} />
            <DetailField label="Contact" value={app.prev_landlord_contact} />
          </div>
        </ApplicationDetailSection>
      </div>

      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-2">
        <ApplicationDetailSection title="Documents" subtitle="Private supporting documents attached to this application." icon={FileText}>
          {documentsError ? <p role="alert" className="text-sm text-danger">{documentsError}</p> : null}
          <div className="flex flex-col gap-3" aria-busy={documentsLoading}>
            {docEntries.map((entry) => <DocumentRow key={entry.label} label={entry.label} path={entry.path} signedUrl={signedByLabel.get(entry.label) ?? null} verified={!!entry.path && verifiedPaths.has(entry.path)} emptyLabel={entry.emptyLabel} loading={documentsLoading} />)}
          </div>
        </ApplicationDetailSection>
        <ApplicationDetailSection title="Message" subtitle="A note from the applicant." icon={IconMessage}>
          <p className="rounded-xl bg-muted/40 p-4 text-sm leading-7 whitespace-pre-line text-card-foreground wrap-anywhere">{app.message?.trim() || "No message provided."}</p>
        </ApplicationDetailSection>
      </div>

      {isPending ? (
        <Card className="landlord-application-detail-card border border-border">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-base font-nunito font-bold text-card-foreground">Review Application</h2>
              <p className="mt-1 text-sm text-muted-foreground">Review the tenant&apos;s details and documents before making a decision.</p>
              {isUnitOccupied ? <p role="status" className="mt-2 text-sm font-medium text-card-foreground">This unit is already occupied and cannot accept another tenant.</p> : null}
            </div>
            <div className="grid grid-cols-2 gap-3 lg:w-80 lg:shrink-0">
              <Button variant="danger-soft" isDisabled={actionLoading} onPress={() => {
                setRejectReason(""); setRejectError(""); clearError(); openRejectDialog(); rejectModal.setOpen(true);
              }}><X size={16} aria-hidden="true" />Reject</Button>
              <Button isDisabled={actionLoading || isUnitOccupied} onPress={() => void approve(app.id)}><Check size={16} aria-hidden="true" />{actionLoading ? "Working…" : "Approve"}</Button>
            </div>
          </div>
        </Card>
      ) : null}

      <Modal isOpen={rejectModal.isOpen && isRejectDialogOpen} onOpenChange={(open) => { rejectModal.setOpen(open); if (!open) closeRejectDialog(); }}>
        <Modal.Backdrop>
          <Modal.Container size="sm">
            <Modal.Dialog>
              <Modal.Header><Modal.Heading>Reject Application</Modal.Heading></Modal.Header>
              <Modal.Body>
                <p className="text-sm text-muted-foreground">Please provide a reason for rejecting {app.tenant_name}&apos;s application. The tenant will see this reason.</p>
                <TextField isRequired isInvalid={!!rejectError} value={rejectReason} onChange={(value: string) => { setRejectReason(value); if (value.trim()) setRejectError(""); }}>
                  <Label>Rejection reason</Label>
                  <TextArea placeholder="e.g. Incomplete proof of income document." rows={4} />
                  <FieldError>{rejectError}</FieldError>
                </TextField>
                {errorMessage ? <p role="alert" className="mt-2 text-sm text-danger">{errorMessage}</p> : null}
              </Modal.Body>
              <Modal.Footer>
                <Button variant="outline" size="sm" onPress={() => { rejectModal.setOpen(false); closeRejectDialog(); }}>Cancel</Button>
                <Button size="sm" variant="danger" isDisabled={actionLoading} onPress={handleRejectConfirm}>{actionLoading ? "Rejecting…" : "Confirm Reject"}</Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </div>
  );
}
