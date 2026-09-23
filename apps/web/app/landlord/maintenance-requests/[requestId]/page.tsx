"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Avatar, Button, Card, Chip, Separator, toast, useOverlayState } from "@heroui/react";
import { ArrowLeft, Hammer, MapPin, Phone } from "lucide-react";
import { formatDate, getInitials } from "@repo/utils";

import { MOCK_MAINTENANCE_REQUESTS } from "../data/mock-maintenance-requests";
import {
  MAINTENANCE_URGENCY_STYLE,
  maintenanceStatusChipColor,
  type LandlordMaintenanceStatus,
} from "../lib/maintenance-status";
import PhotoGrid from "../components/PhotoGrid";
import ResolveMaintenanceModal from "../components/ResolveMaintenanceModal";

function DetailField({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-sm font-nunito text-muted-foreground">{label}</p>
      <p className="text-[15px] font-nunito font-semibold text-card-foreground leading-snug">
        {value ?? "—"}
      </p>
    </div>
  );
}

function SectionTitle({ children }: { children: string }) {
  return (
    <p className="text-sm font-nunito font-bold text-primary uppercase tracking-wide">{children}</p>
  );
}

function getNextStatus(current: LandlordMaintenanceStatus): LandlordMaintenanceStatus {
  if (current === "Pending") return "In Progress";
  return current;
}

export default function LandlordMaintenanceDetailPage() {
  const router = useRouter();
  const params = useParams<{ requestId: string }>();
  const id = params.requestId;

  // UI-first: mock lookup + local status. Backend wiring will fetch + update.
  const mock = useMemo(() => MOCK_MAINTENANCE_REQUESTS.find((r) => r.id === id) ?? null, [id]);
  const [status, setStatus] = useState<LandlordMaintenanceStatus | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState<string | null>(null);
  const resolveModal = useOverlayState();

  if (!mock) {
    return (
      <div className="w-full px-3 py-3">
        <Button
          variant="ghost"
          size="sm"
          onPress={() => router.push("/landlord/maintenance-requests")}
          className="mb-4 font-nunito"
        >
          <ArrowLeft size={16} />
          Back to maintenance requests
        </Button>
        <Card className="shadow-none bg-card p-8 text-center rounded-none border-0">
          <p className="font-nunito font-semibold text-card-foreground">Request not found</p>
          <p className="text-sm font-nunito text-muted-foreground mt-1">
            This maintenance request does not exist or you don&apos;t have access to it.
          </p>
        </Card>
      </div>
    );
  }

  const displayStatus = status ?? mock.status;
  const displayNotes = resolutionNotes ?? mock.resolution_notes;
  const urgency = MAINTENANCE_URGENCY_STYLE[mock.urgency];
  const isTerminal = displayStatus === "Resolved" || displayStatus === "Cancelled";
  const nextStatus = getNextStatus(displayStatus);
  const buttonLabel = isTerminal ? displayStatus : `Mark as ${nextStatus}`;

  const handleAdvance = () => {
    if (displayStatus === "Pending") {
      // Mock-only: backend wiring will call the status update service.
      setStatus("In Progress");
      toast.success("Request marked as In Progress (mock)");
      return;
    }
    if (displayStatus === "In Progress") {
      resolveModal.setOpen(true);
    }
  };

  const handleResolveConfirm = (notes: string) => {
    // Mock-only: backend wiring will persist status + resolution notes.
    setStatus("Resolved");
    setResolutionNotes(notes);
    resolveModal.setOpen(false);
    toast.success("Request marked as Resolved (mock)");
  };

  return (
    <div className="w-full px-3 py-3 flex flex-col gap-3 bg-card">
      <div className="flex items-center gap-2 shrink-0">
        <Button variant="ghost" size="sm" onPress={() => router.back()} className="gap-1.5 font-nunito">
          <ArrowLeft size={16} />
          Back
        </Button>
        <h1 className="text-xl font-nunito font-semibold text-card-foreground">
          Maintenance Request
        </h1>
      </div>

      <Card className="shadow-none bg-card rounded-2xl border border-border p-4 md:p-5 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <Hammer size={18} className="text-primary" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-nunito font-semibold text-muted-foreground uppercase tracking-wide">
              Maintenance Information
            </p>
            <p className="text-lg font-nunito font-semibold text-card-foreground truncate">
              {mock.issue_title}
            </p>
          </div>
          <div className="flex gap-1.5 shrink-0">
            <Chip size="sm" variant="soft" style={{ backgroundColor: urgency.bg, color: urgency.text }}>
              {urgency.label}
            </Chip>
            <Chip size="sm" variant="soft" color={maintenanceStatusChipColor(displayStatus)}>
              {displayStatus}
            </Chip>
          </div>
        </div>

        <Separator className="bg-border" />

        <div>
          <SectionTitle>Property & Tenant</SectionTitle>
          <div className="mt-2 flex items-start gap-3">
            <Avatar size="lg" className="shrink-0">
              <span className="text-sm font-nunito font-semibold">
                {getInitials(mock.tenant_name)}
              </span>
            </Avatar>
            <div className="min-w-0 flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
              <DetailField label="Apartment" value={mock.apartment_name} />
              <DetailField label="Tenant" value={mock.tenant_name} />
            </div>
          </div>
          <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="flex flex-col gap-0.5">
              <p className="text-sm font-nunito text-muted-foreground">Address</p>
              <p className="text-[15px] font-nunito font-semibold text-card-foreground leading-snug flex items-start gap-1">
                <MapPin size={14} className="shrink-0 mt-0.5" />
                {mock.apartment_address}
              </p>
            </div>
            <div className="flex flex-col gap-0.5">
              <p className="text-sm font-nunito text-muted-foreground">Contact Number</p>
              <p className="text-[15px] font-nunito font-semibold text-card-foreground leading-snug flex items-center gap-1">
                <Phone size={14} className="shrink-0" />
                {mock.contact_number}
              </p>
            </div>
            <DetailField label="Date Reported" value={formatDate(mock.reported_at, "medium")} />
            <DetailField label="Urgency" value={urgency.label} />
          </div>
        </div>

        <Separator className="bg-border" />

        <div>
          <SectionTitle>Issue Description</SectionTitle>
          <div className="mt-2 rounded-2xl bg-muted px-4 py-3">
            <p className="text-[15px] font-nunito text-card-foreground leading-relaxed whitespace-pre-line">
              {mock.description}
            </p>
          </div>
        </div>

        <div>
          <SectionTitle>Issue Photos</SectionTitle>
          <div className="mt-2">
            <PhotoGrid photos={mock.photos} />
          </div>
        </div>

        {displayStatus === "Resolved" && displayNotes && (
          <div>
            <SectionTitle>Resolution Notes</SectionTitle>
            <div className="mt-2 rounded-2xl bg-muted px-4 py-3">
              <p className="text-[15px] font-nunito text-card-foreground leading-relaxed whitespace-pre-line">
                {displayNotes}
              </p>
            </div>
          </div>
        )}

        <Button size="md" className="mt-2" isDisabled={isTerminal} onPress={handleAdvance}>
          {buttonLabel}
        </Button>
      </Card>

      <ResolveMaintenanceModal
        isOpen={resolveModal.isOpen}
        onOpenChange={resolveModal.setOpen}
        tenantName={mock.tenant_name}
        onConfirm={handleResolveConfirm}
      />
    </div>
  );
}
