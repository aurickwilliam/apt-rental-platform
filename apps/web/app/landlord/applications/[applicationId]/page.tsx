"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Avatar,
  Button,
  Card,
  Chip,
  FieldError,
  Label,
  Modal,
  Separator,
  Spinner,
  TextArea,
  TextField,
  useOverlayState,
} from "@heroui/react";
import { ArrowLeft, Mail, MapPin, Phone, FileText, Eye, Check, X } from "lucide-react";
import { formatDate, formatPesoDisplay, getInitials } from "@repo/utils";

import { useLandlordApplications } from "@/hooks/use-landlord-applications";
import { useLandlordApplicationActions } from "@/hooks/use-landlord-application-actions";
import { useApplicationDocumentUrls } from "@/hooks/use-application-document-urls";
import { statusChipColor } from "../lib/application-status";

function DetailField({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-sm font-nunito text-muted-foreground">{label}</p>
      <p className="text-[15px] font-nunito font-semibold text-card-foreground truncate leading-snug">{value ?? "—"}</p>
    </div>
  );
}

function SectionTitle({ children }: { children: string }) {
  return <p className="text-sm font-nunito font-bold text-primary uppercase tracking-wide">{children}</p>;
}

function DocumentRow({ label, path, signedUrl }: { label: string; path: string | null; signedUrl: string | null }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-muted px-3 py-2.5">
      <div className="flex items-center gap-2 min-w-0">
        <div className="shrink-0 rounded-lg bg-muted p-2">
          <FileText size={16} className="text-muted-foreground" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-nunito font-medium text-card-foreground">{label}</p>
          <p className="text-xs font-nunito text-muted-foreground truncate">{path ? "Tap View to open" : "Not submitted"}</p>
        </div>
      </div>
      {signedUrl ? (
        <Button size="sm" variant="ghost" onPress={() => window.open(signedUrl, "_blank")} className="shrink-0">
          <Eye size={14} />
          View
        </Button>
      ) : (
        <span className="text-xs font-nunito text-muted-foreground">—</span>
      )}
    </div>
  );
}

export default function LandlordApplicationDetailPage() {
  const router = useRouter();
  const params = useParams<{ applicationId: string }>();
  const id = params.applicationId;

  const { applications, loading, error, refresh } = useLandlordApplications();
  const {
    localStatus,
    actionLoading,
    isRejectDialogOpen,
    errorMessage,
    approve,
    reject,
    openRejectDialog,
    closeRejectDialog,
    clearError,
  } = useLandlordApplicationActions(refresh);
  const rejectModal = useOverlayState();
  const [rejectReason, setRejectReason] = useState("");
  const [rejectError, setRejectError] = useState("");

  const app = useMemo(() => applications.find((a) => a.id === id) ?? null, [applications, id]);

  const docEntries = useMemo(
    () =>
      app
        ? [
            { label: "Government ID", path: app.gov_id_url },
            { label: "Proof of Income", path: app.proof_of_income_url },
            { label: "Proof of Billing", path: app.proof_of_billing_url },
            { label: "NBI Clearance", path: app.nbi_clearance_url },
          ]
        : [],
    [app],
  );
  const { resolved: resolvedDocs } = useApplicationDocumentUrls(docEntries);
  const signedByLabel = useMemo(() => new Map(resolvedDocs.map((d) => [d.label, d.signedUrl])), [resolvedDocs]);

  if (loading) {
    return (
      <div className="w-full px-3 py-12 flex justify-center">
        <Spinner color="accent" />
      </div>
    );
  }

  if (error || !app) {
    return (
      <div className="w-full max-w-none mx-0 px-3 py-3">
        <Button variant="ghost" size="sm" onPress={() => router.push("/landlord/applications")} className="mb-4 font-nunito">
          <ArrowLeft size={16} />
          Back to applications
        </Button>
        <Card className="shadow-none bg-card p-8 text-center rounded-none border-0">
          <p className="font-nunito font-semibold text-card-foreground">Application not found</p>
          <p className="text-sm font-nunito text-muted-foreground mt-1">{error ?? "This application does not exist or you don't have access to it."}</p>
        </Card>
      </div>
    );
  }

  const displayStatus = localStatus ?? app.status;
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

  const actionButtons = isPending && (
    <div className="flex items-center gap-2 shrink-0 self-start">
      <Button
        size="sm"
        variant="tertiary"
        className="font-nunito h-8 border-0"
        style={{ backgroundColor: "#FEE2E2", color: "#E50914" }}
        isDisabled={actionLoading}
        onPress={() => {
          setRejectReason("");
          setRejectError("");
          clearError();
          openRejectDialog();
          rejectModal.setOpen(true);
        }}
      >
        <X size={14} />
        Reject
      </Button>
      <Button
        size="sm"
        className="font-nunito h-8"
        isDisabled={actionLoading || isUnitOccupied}
        onPress={() => void approve(app.id)}
      >
        <Check size={14} />
        {actionLoading ? "Working..." : "Approve"}
      </Button>
    </div>
  );

  return (
    <div className="w-full max-w-none mx-0 px-0 py-2 flex flex-col gap-2 bg-card h-[calc(100dvh-4.5rem)] min-h-0">
      <div className="flex items-center gap-2 shrink-0 px-3">
        <Button variant="ghost" size="sm" onPress={() => router.back()} className="gap-1.5 font-nunito">
          <ArrowLeft size={16} />
          Back
        </Button>
        <h1 className="text-xl font-nunito font-semibold text-card-foreground">Application Details</h1>
      </div>

      {errorMessage && (
        <div className="mx-3 shrink-0 rounded-xl bg-danger/5 px-3 py-2.5">
          <p className="text-sm font-nunito text-danger">{errorMessage}</p>
        </div>
      )}
      {isPending && isUnitOccupied && (
        <div className="mx-3 shrink-0 rounded-xl bg-muted px-3 py-2.5">
          <p className="text-sm font-nunito text-muted-foreground">This unit is already occupied and cannot accept another tenant.</p>
        </div>
      )}

      <Card className="shadow-none bg-card rounded-none border-0 flex-1 min-h-0 overflow-hidden flex flex-col p-0">
        {/* Mobile stacked — scrollable, borderless tiny gap */}
        <div className="md:hidden flex flex-col overflow-y-auto p-3 gap-2">
          <div className="rounded-2xl bg-card p-3 flex flex-row items-start justify-between gap-3">
            <div className="flex flex-col gap-1 flex-1 min-w-0">
              <p className="text-sm font-nunito font-semibold text-muted-foreground uppercase tracking-wide">Tenant Application For</p>
              <p className="text-xl font-nunito font-semibold text-secondary leading-tight">{app.apartment_name}</p>
              <p className="text-sm font-nunito text-muted-foreground flex items-center gap-1">
                <MapPin size={12} className="shrink-0" />
                {app.apartment_address}
              </p>
            </div>
            {actionButtons}
          </div>
          <div className="rounded-2xl bg-card p-3 flex items-start gap-3">
            <Avatar size="lg" className="shrink-0">
              {app.tenant_avatar_url ? <img src={app.tenant_avatar_url} alt={app.tenant_name} className="h-full w-full object-cover" /> : <span className="text-sm font-nunito font-semibold">{getInitials(app.tenant_name)}</span>}
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="font-nunito font-semibold text-card-foreground text-base">{app.tenant_name}</p>
              <p className="text-sm font-nunito text-muted-foreground flex items-center gap-1 truncate"><Mail size={12} className="shrink-0" />{app.tenant_email ?? "—"}</p>
              <p className="text-sm font-nunito text-muted-foreground flex items-center gap-1"><MapPin size={12} className="shrink-0" />{app.tenant_city || "—"}</p>
              <p className="text-sm font-nunito text-muted-foreground flex items-center gap-1"><Phone size={12} className="shrink-0" />{app.tenant_mobile_number ?? "—"}</p>
            </div>
            <Chip size="sm" variant="soft" color={statusChipColor(displayStatus)} className="capitalize shrink-0 font-nunito">{displayStatus}</Chip>
          </div>
          {displayStatus === "Rejected" && app.rejected_reason && <div className="rounded-xl bg-danger/5 px-3 py-2.5"><p className="text-sm font-nunito font-semibold text-danger">Rejection reason</p><p className="text-sm font-nunito text-card-foreground mt-0.5">{app.rejected_reason}</p></div>}
          <Separator className="bg-border" />
          <div className="rounded-2xl bg-card p-3 flex flex-col gap-2"><SectionTitle>Application Details</SectionTitle><div className="grid grid-cols-2 gap-2"><DetailField label="Date Submitted" value={formatDate(app.created_at, "medium")} /><DetailField label="Move-in Date" value={formatDate(app.move_in_date, "medium")} /><DetailField label="Monthly Rent" value={formatPesoDisplay(app.monthly_rent)} /><DetailField label="No. of Occupants" value={String(app.no_occupants)} /></div></div>
          <div className="rounded-2xl bg-card p-3 flex flex-col gap-2"><SectionTitle>Employment</SectionTitle><div className="grid grid-cols-2 gap-2"><DetailField label="Occupation" value={app.occupation} /><DetailField label="Employer" value={app.employer_name} /><DetailField label="Employment Type" value={app.employment_type} /><DetailField label="Monthly Income" value={formatPesoDisplay(app.monthly_income)} /></div></div>
          <Separator className="bg-border" />
          <div className="rounded-2xl bg-card p-3 flex flex-col gap-2"><SectionTitle>Preferences</SectionTitle><div className="grid grid-cols-2 gap-2"><DetailField label="Has Pets" value={app.has_pets ? "Yes" : "No"} /><DetailField label="Has Smoker" value={app.has_smoker ? "Yes" : "No"} /><DetailField label="Needs Parking" value={app.need_parking ? "Yes" : "No"} /></div></div>
          <div className="rounded-2xl bg-card p-3 flex flex-col gap-2"><SectionTitle>Previous Landlord</SectionTitle><div className="grid grid-cols-2 gap-2"><DetailField label="Name" value={app.prev_landlord_name ?? "Not provided"} /><DetailField label="Contact" value={app.prev_landlord_contact ?? "Not provided"} /></div></div>
          <Separator className="bg-border" />
          <div className="rounded-2xl bg-card p-3 flex flex-col gap-2"><SectionTitle>Documents</SectionTitle><div className="flex flex-col gap-1.5"><DocumentRow label="Government ID" path={app.gov_id_url} signedUrl={signedByLabel.get("Government ID") ?? null} /><DocumentRow label="Proof of Income" path={app.proof_of_income_url} signedUrl={signedByLabel.get("Proof of Income") ?? null} /><DocumentRow label="Proof of Billing" path={app.proof_of_billing_url} signedUrl={signedByLabel.get("Proof of Billing") ?? null} /><DocumentRow label="NBI Clearance" path={app.nbi_clearance_url} signedUrl={signedByLabel.get("NBI Clearance") ?? null} /></div></div>
          <div className="rounded-2xl bg-card p-3 flex flex-col gap-2"><SectionTitle>Message</SectionTitle><p className="text-[15px] font-nunito text-card-foreground leading-relaxed whitespace-pre-line">{app.message ?? "No message provided."}</p></div>
        </div>

        {/* Desktop — strictly no scroll, tiny gap, borderless, two separators, bigger Nunito, actions aligned with apartment name row */}
        <div className="hidden md:flex flex-1 min-h-0 flex-col gap-2 p-3 overflow-hidden">
          <div className="rounded-2xl bg-card px-4 py-3 flex flex-row items-start justify-between gap-3 shrink-0">
            <div className="flex flex-col gap-1 flex-1 min-w-0">
              <p className="text-sm font-nunito font-semibold text-muted-foreground uppercase tracking-wide">Tenant Application For</p>
              <p className="text-xl font-nunito font-semibold text-secondary leading-tight">{app.apartment_name}</p>
              <p className="text-sm font-nunito text-muted-foreground flex items-center gap-1">
                <MapPin size={12} className="shrink-0" />
                {app.apartment_address}
              </p>
            </div>
            {actionButtons}
          </div>

          <div className="rounded-2xl bg-card px-4 py-3 flex items-start gap-3 shrink-0">
            <Avatar size="lg" className="shrink-0">
              {app.tenant_avatar_url ? <img src={app.tenant_avatar_url} alt={app.tenant_name} className="h-full w-full object-cover" /> : <span className="text-sm font-nunito font-semibold">{getInitials(app.tenant_name)}</span>}
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="font-nunito font-semibold text-card-foreground text-base">{app.tenant_name}</p>
              <p className="text-sm font-nunito text-muted-foreground flex items-center gap-1 truncate"><Mail size={12} className="shrink-0" />{app.tenant_email ?? "—"}</p>
              <p className="text-sm font-nunito text-muted-foreground flex items-center gap-1"><MapPin size={12} className="shrink-0" />{app.tenant_city || "—"}</p>
              <p className="text-sm font-nunito text-muted-foreground flex items-center gap-1"><Phone size={12} className="shrink-0" />{app.tenant_mobile_number ?? "—"}</p>
            </div>
            <Chip size="sm" variant="soft" color={statusChipColor(displayStatus)} className="capitalize shrink-0 font-nunito">{displayStatus}</Chip>
          </div>

          {displayStatus === "Rejected" && app.rejected_reason && <div className="rounded-xl bg-danger/5 px-3 py-2 shrink-0"><p className="text-sm font-nunito font-semibold text-danger">Rejection reason</p><p className="text-sm font-nunito text-card-foreground mt-0.5 leading-tight">{app.rejected_reason}</p></div>}

          <Separator className="bg-border shrink-0" />

          <div className="grid grid-cols-2 gap-2 shrink-0">
            <div className="rounded-2xl bg-card p-3 flex flex-col gap-2">
              <SectionTitle>Application Details</SectionTitle>
              <div className="grid grid-cols-2 gap-2">
                <DetailField label="Date Submitted" value={formatDate(app.created_at, "medium")} />
                <DetailField label="Move-in Date" value={formatDate(app.move_in_date, "medium")} />
                <DetailField label="Monthly Rent" value={formatPesoDisplay(app.monthly_rent)} />
                <DetailField label="No. of Occupants" value={String(app.no_occupants)} />
              </div>
            </div>
            <div className="rounded-2xl bg-card p-3 flex flex-col gap-2">
              <SectionTitle>Employment</SectionTitle>
              <div className="grid grid-cols-2 gap-2">
                <DetailField label="Occupation" value={app.occupation} />
                <DetailField label="Employer" value={app.employer_name} />
                <DetailField label="Employment Type" value={app.employment_type} />
                <DetailField label="Monthly Income" value={formatPesoDisplay(app.monthly_income)} />
              </div>
            </div>
            <div className="rounded-2xl bg-card p-3 flex flex-col gap-2">
              <SectionTitle>Preferences</SectionTitle>
              <div className="grid grid-cols-2 gap-2">
                <DetailField label="Has Pets" value={app.has_pets ? "Yes" : "No"} />
                <DetailField label="Has Smoker" value={app.has_smoker ? "Yes" : "No"} />
                <div className="col-span-2"><DetailField label="Needs Parking" value={app.need_parking ? "Yes" : "No"} /></div>
              </div>
            </div>
            <div className="rounded-2xl bg-card p-3 flex flex-col gap-2">
              <SectionTitle>Previous Landlord</SectionTitle>
              <div className="grid grid-cols-2 gap-2">
                <DetailField label="Name" value={app.prev_landlord_name ?? "Not provided"} />
                <DetailField label="Contact" value={app.prev_landlord_contact ?? "Not provided"} />
              </div>
            </div>
          </div>

          <Separator className="bg-border shrink-0" />

          <div className="grid grid-cols-2 gap-2 flex-1 min-h-0 overflow-hidden">
            <div className="rounded-2xl bg-card p-3 flex flex-col gap-2 overflow-hidden">
              <SectionTitle>Documents</SectionTitle>
              <div className="flex flex-col gap-1.5 overflow-hidden flex-1 justify-between">
                <DocumentRow label="Government ID" path={app.gov_id_url} signedUrl={signedByLabel.get("Government ID") ?? null} />
                <DocumentRow label="Proof of Income" path={app.proof_of_income_url} signedUrl={signedByLabel.get("Proof of Income") ?? null} />
                <DocumentRow label="Proof of Billing" path={app.proof_of_billing_url} signedUrl={signedByLabel.get("Proof of Billing") ?? null} />
                <DocumentRow label="NBI Clearance" path={app.nbi_clearance_url} signedUrl={signedByLabel.get("NBI Clearance") ?? null} />
              </div>
            </div>
            <div className="rounded-2xl bg-card p-3 flex flex-col gap-2 overflow-hidden">
              <SectionTitle>Message</SectionTitle>
              <p className="text-[15px] font-nunito text-card-foreground leading-relaxed whitespace-pre-line flex-1 overflow-hidden">{app.message ?? "No message provided."}</p>
            </div>
          </div>
        </div>
      </Card>

      <Modal
        isOpen={rejectModal.isOpen && isRejectDialogOpen}
        onOpenChange={(open) => {
          rejectModal.setOpen(open);
          if (!open) closeRejectDialog();
        }}
      >
        <Modal.Backdrop>
          <Modal.Container size="sm">
            <Modal.Dialog>
              <Modal.Header>
                <Modal.Heading>Reject Application</Modal.Heading>
              </Modal.Header>
              <Modal.Body>
                <p className="text-sm font-nunito text-muted-foreground">
                  Please provide a reason for rejecting {app.tenant_name}&apos;s application. The tenant will see this reason.
                </p>
                <TextField
                  isRequired
                  isInvalid={!!rejectError}
                  value={rejectReason}
                  onChange={(v: string) => {
                    setRejectReason(v);
                    if (v.trim()) setRejectError("");
                  }}
                >
                  <Label>Rejection reason</Label>
                  <TextArea placeholder="e.g. Incomplete proof of income document." rows={4} />
                  <FieldError>{rejectError}</FieldError>
                </TextField>
                {errorMessage && <p className="text-sm font-nunito text-danger mt-2">{errorMessage}</p>}
              </Modal.Body>
              <Modal.Footer className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onPress={() => {
                    rejectModal.setOpen(false);
                    closeRejectDialog();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  isDisabled={actionLoading}
                  onPress={handleRejectConfirm}
                >
                  {actionLoading ? "Rejecting..." : "Confirm Reject"}
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </div>
  );
}
