"use client";

import { useParams, useRouter } from "next/navigation";
import { Avatar, Button, Card, Chip, Separator } from "@heroui/react";
import { ArrowLeft, Mail, MapPin, Phone, FileText, Eye, Check, X } from "lucide-react";

import { MOCK_APPLICATIONS, formatPeso, formatDate, getInitials, statusChipColor } from "../lib/mockApplications";

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

function DocumentRow({ label, url }: { label: string; url: string | null }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-muted px-3 py-2.5">
      <div className="flex items-center gap-2 min-w-0">
        <div className="shrink-0 rounded-lg bg-muted p-2">
          <FileText size={16} className="text-muted-foreground" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-nunito font-medium text-card-foreground">{label}</p>
          <p className="text-xs font-nunito text-muted-foreground truncate">{url ? "Tap View to open" : "Not submitted"}</p>
        </div>
      </div>
      {url ? (
        <Button size="sm" variant="ghost" onPress={() => window.open(url, "_blank")} className="shrink-0">
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
  const app = MOCK_APPLICATIONS.find((a) => a.id === id) ?? null;

  if (!app) {
    return (
      <div className="w-full max-w-none mx-0 px-3 py-3">
        <Button variant="ghost" size="sm" onPress={() => router.push("/landlord/applications")} className="mb-4 font-nunito">
          <ArrowLeft size={16} />
          Back to applications
        </Button>
        <Card className="shadow-none bg-card p-8 text-center rounded-none border-0">
          <p className="font-nunito font-semibold text-card-foreground">Application not found</p>
          <p className="text-sm font-nunito text-muted-foreground mt-1">This application does not exist in mock data.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-none mx-0 px-0 py-2 flex flex-col gap-2 bg-card h-[calc(100dvh-4.5rem)] min-h-0">
      <div className="flex items-center gap-2 shrink-0 px-3">
        <Button variant="ghost" size="sm" onPress={() => router.back()} className="gap-1.5 font-nunito">
          <ArrowLeft size={16} />
          Back
        </Button>
        <h1 className="text-xl font-nunito font-semibold text-card-foreground">Application Details</h1>
      </div>

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
            {app.status === "Applied" && (
              <div className="flex items-center gap-2 shrink-0 self-start">
                <Button size="sm" variant="tertiary" className="font-nunito h-8 border-0" style={{ backgroundColor: "#FEE2E2", color: "#E50914" }} onPress={() => alert("Mock Reject — connect to Supabase later.")}>
                  <X size={14} />
                  Reject
                </Button>
                <Button size="sm" className="font-nunito h-8" onPress={() => alert("Mock Approve — connect to Supabase later.")}>
                  <Check size={14} />
                  Approve
                </Button>
              </div>
            )}
          </div>
          <div className="rounded-2xl bg-card p-3 flex items-start gap-3">
            <Avatar size="lg" className="shrink-0">
              {app.tenant_avatar_url ? <img src={app.tenant_avatar_url} alt={app.tenant_name} className="h-full w-full object-cover" /> : <span className="text-sm font-nunito font-semibold">{getInitials(app.tenant_name)}</span>}
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="font-nunito font-semibold text-card-foreground text-base">{app.tenant_name}</p>
              <p className="text-sm font-nunito text-muted-foreground flex items-center gap-1 truncate"><Mail size={12} className="shrink-0" />{app.tenant_email}</p>
              <p className="text-sm font-nunito text-muted-foreground flex items-center gap-1"><MapPin size={12} className="shrink-0" />{app.tenant_city}</p>
              <p className="text-sm font-nunito text-muted-foreground flex items-center gap-1"><Phone size={12} className="shrink-0" />{app.tenant_mobile_number}</p>
            </div>
            <Chip size="sm" variant="soft" color={statusChipColor(app.status)} className="capitalize shrink-0 font-nunito">{app.status}</Chip>
          </div>
          {app.status === "Rejected" && app.rejected_reason && <div className="rounded-xl bg-danger/5 px-3 py-2.5"><p className="text-sm font-nunito font-semibold text-danger">Rejection reason</p><p className="text-sm font-nunito text-card-foreground mt-0.5">{app.rejected_reason}</p></div>}
          <Separator className="bg-border" />
          <div className="rounded-2xl bg-card p-3 flex flex-col gap-2"><SectionTitle>Application Details</SectionTitle><div className="grid grid-cols-2 gap-2"><DetailField label="Date Submitted" value={formatDate(app.created_at)} /><DetailField label="Move-in Date" value={formatDate(app.move_in_date)} /><DetailField label="Monthly Rent" value={formatPeso(app.monthly_rent)} /><DetailField label="No. of Occupants" value={String(app.no_occupants)} /></div></div>
          <div className="rounded-2xl bg-card p-3 flex flex-col gap-2"><SectionTitle>Employment</SectionTitle><div className="grid grid-cols-2 gap-2"><DetailField label="Occupation" value={app.occupation} /><DetailField label="Employer" value={app.employer_name} /><DetailField label="Employment Type" value={app.employment_type} /><DetailField label="Monthly Income" value={formatPeso(app.monthly_income)} /></div></div>
          <Separator className="bg-border" />
          <div className="rounded-2xl bg-card p-3 flex flex-col gap-2"><SectionTitle>Preferences</SectionTitle><div className="grid grid-cols-2 gap-2"><DetailField label="Has Pets" value={app.has_pets ? "Yes" : "No"} /><DetailField label="Has Smoker" value={app.has_smoker ? "Yes" : "No"} /><DetailField label="Needs Parking" value={app.need_parking ? "Yes" : "No"} /></div></div>
          <div className="rounded-2xl bg-card p-3 flex flex-col gap-2"><SectionTitle>Previous Landlord</SectionTitle><div className="grid grid-cols-2 gap-2"><DetailField label="Name" value={app.prev_landlord_name ?? "Not provided"} /><DetailField label="Contact" value={app.prev_landlord_contact ?? "Not provided"} /></div></div>
          <Separator className="bg-border" />
          <div className="rounded-2xl bg-card p-3 flex flex-col gap-2"><SectionTitle>Documents</SectionTitle><div className="flex flex-col gap-1.5"><DocumentRow label="Government ID" url={app.gov_id_url} /><DocumentRow label="Proof of Income" url={app.proof_of_income_url} /><DocumentRow label="Proof of Billing" url={app.proof_of_billing_url} /><DocumentRow label="NBI Clearance" url={app.nbi_clearance_url} /></div></div>
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
            {app.status === "Applied" && (
              <div className="flex items-center gap-2 shrink-0 self-start">
                <Button size="sm" variant="tertiary" className="font-nunito h-8 border-0" style={{ backgroundColor: "#FEE2E2", color: "#E50914" }} onPress={() => alert("Mock Reject — connect to Supabase later.")}>
                  <X size={14} />
                  Reject
                </Button>
                <Button size="sm" className="font-nunito h-8" onPress={() => alert("Mock Approve — connect to Supabase later.")}>
                  <Check size={14} />
                  Approve
                </Button>
              </div>
            )}
          </div>

          <div className="rounded-2xl bg-card px-4 py-3 flex items-start gap-3 shrink-0">
            <Avatar size="lg" className="shrink-0">
              {app.tenant_avatar_url ? <img src={app.tenant_avatar_url} alt={app.tenant_name} className="h-full w-full object-cover" /> : <span className="text-sm font-nunito font-semibold">{getInitials(app.tenant_name)}</span>}
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="font-nunito font-semibold text-card-foreground text-base">{app.tenant_name}</p>
              <p className="text-sm font-nunito text-muted-foreground flex items-center gap-1 truncate"><Mail size={12} className="shrink-0" />{app.tenant_email}</p>
              <p className="text-sm font-nunito text-muted-foreground flex items-center gap-1"><MapPin size={12} className="shrink-0" />{app.tenant_city}</p>
              <p className="text-sm font-nunito text-muted-foreground flex items-center gap-1"><Phone size={12} className="shrink-0" />{app.tenant_mobile_number}</p>
            </div>
            <Chip size="sm" variant="soft" color={statusChipColor(app.status)} className="capitalize shrink-0 font-nunito">{app.status}</Chip>
          </div>

          {app.status === "Rejected" && app.rejected_reason && <div className="rounded-xl bg-danger/5 px-3 py-2 shrink-0"><p className="text-sm font-nunito font-semibold text-danger">Rejection reason</p><p className="text-sm font-nunito text-card-foreground mt-0.5 leading-tight">{app.rejected_reason}</p></div>}

          <Separator className="bg-border shrink-0" />

          <div className="grid grid-cols-2 gap-2 shrink-0">
            <div className="rounded-2xl bg-card p-3 flex flex-col gap-2">
              <SectionTitle>Application Details</SectionTitle>
              <div className="grid grid-cols-2 gap-2">
                <DetailField label="Date Submitted" value={formatDate(app.created_at)} />
                <DetailField label="Move-in Date" value={formatDate(app.move_in_date)} />
                <DetailField label="Monthly Rent" value={formatPeso(app.monthly_rent)} />
                <DetailField label="No. of Occupants" value={String(app.no_occupants)} />
              </div>
            </div>
            <div className="rounded-2xl bg-card p-3 flex flex-col gap-2">
              <SectionTitle>Employment</SectionTitle>
              <div className="grid grid-cols-2 gap-2">
                <DetailField label="Occupation" value={app.occupation} />
                <DetailField label="Employer" value={app.employer_name} />
                <DetailField label="Employment Type" value={app.employment_type} />
                <DetailField label="Monthly Income" value={formatPeso(app.monthly_income)} />
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
                <DocumentRow label="Government ID" url={app.gov_id_url} />
                <DocumentRow label="Proof of Income" url={app.proof_of_income_url} />
                <DocumentRow label="Proof of Billing" url={app.proof_of_billing_url} />
                <DocumentRow label="NBI Clearance" url={app.nbi_clearance_url} />
              </div>
            </div>
            <div className="rounded-2xl bg-card p-3 flex flex-col gap-2 overflow-hidden">
              <SectionTitle>Message</SectionTitle>
              <p className="text-[15px] font-nunito text-card-foreground leading-relaxed whitespace-pre-line flex-1 overflow-hidden">{app.message ?? "No message provided."}</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
