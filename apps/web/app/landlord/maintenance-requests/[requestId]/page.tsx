"use client";

import { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Avatar, Button, Card, Chip, Separator, Spinner, toast, useOverlayState } from "@heroui/react";
import { ArrowLeft, Hammer, MapPin, Phone } from "lucide-react";
import { formatDate, getInitials } from "@repo/utils";

import {
  getNextStatus,
  useLandlordMaintenanceRequests,
} from "@/hooks/use-landlord-maintenance-requests";
import {
  MAINTENANCE_URGENCY_STYLE,
  maintenanceStatusChipColor,
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

export default function LandlordMaintenanceDetailPage() {
  const router = useRouter();
  const params = useParams<{ requestId: string }>();
  const id = params.requestId;

  const { requests, loading, error, refresh, advanceStatus, resolveRequest, actionLoading } =
    useLandlordMaintenanceRequests();
  const resolveModal = useOverlayState();

  const request = useMemo(() => requests.find((r) => r.id === id) ?? null, [requests, id]);

  if (loading) {
    return (
      <div className="w-full px-3 py-12 flex justify-center">
        <Spinner color="accent" />
      </div>
    );
  }

  if (error || !request) {
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
            {error ?? "This maintenance request does not exist or you don't have access to it."}
          </p>
          {error && (
            <Button size="sm" variant="outline" className="mt-4" onPress={() => void refresh()}>
              Retry
            </Button>
          )}
        </Card>
      </div>
    );
  }

  const urgency = MAINTENANCE_URGENCY_STYLE[request.urgency];
  const isTerminal = request.status === "Resolved" || request.status === "Cancelled";
  const nextStatus = getNextStatus(request.status);
  const buttonLabel = isTerminal ? request.status : `Mark as ${nextStatus}`;

  const handleAdvance = async () => {
    if (request.status === "Pending") {
      const result = await advanceStatus(request.id);
      if (result.success) {
        toast.success("Request marked as In Progress");
      } else {
        toast.danger("Could not update request status.");
      }
      return;
    }
    if (request.status === "In Progress") {
      resolveModal.setOpen(true);
    }
  };

  const handleResolveConfirm = async (notes: string) => {
    const result = await resolveRequest(request.id, notes);
    if (result.success) {
      resolveModal.setOpen(false);
      toast.success("Request marked as Resolved");
    } else {
      toast.danger(result.error ?? "Could not resolve this request.");
    }
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
              {request.issue_title}
            </p>
          </div>
          <div className="flex gap-1.5 shrink-0">
            <Chip size="sm" variant="soft" style={{ backgroundColor: urgency.bg, color: urgency.text }}>
              {urgency.label}
            </Chip>
            <Chip size="sm" variant="soft" color={maintenanceStatusChipColor(request.status)}>
              {request.status}
            </Chip>
          </div>
        </div>

        <Separator className="bg-border" />

        <div>
          <SectionTitle>Property & Tenant</SectionTitle>
          <div className="mt-2 flex items-start gap-3">
            <Avatar size="lg" className="shrink-0">
              <span className="text-sm font-nunito font-semibold">
                {getInitials(request.tenant_name)}
              </span>
            </Avatar>
            <div className="min-w-0 flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
              <DetailField label="Apartment" value={request.apartment_name} />
              <DetailField label="Tenant" value={request.tenant_name} />
            </div>
          </div>
          <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="flex flex-col gap-0.5">
              <p className="text-sm font-nunito text-muted-foreground">Address</p>
              <p className="text-[15px] font-nunito font-semibold text-card-foreground leading-snug flex items-start gap-1">
                <MapPin size={14} className="shrink-0 mt-0.5" />
                {request.apartment_address}
              </p>
            </div>
            <div className="flex flex-col gap-0.5">
              <p className="text-sm font-nunito text-muted-foreground">Contact Number</p>
              <p className="text-[15px] font-nunito font-semibold text-card-foreground leading-snug flex items-center gap-1">
                <Phone size={14} className="shrink-0" />
                {request.contact_number}
              </p>
            </div>
            <DetailField label="Date Reported" value={formatDate(request.reported_at, "medium")} />
            <DetailField label="Urgency" value={urgency.label} />
          </div>
        </div>

        <Separator className="bg-border" />

        <div>
          <SectionTitle>Issue Description</SectionTitle>
          <div className="mt-2 rounded-2xl bg-muted px-4 py-3">
            <p className="text-[15px] font-nunito text-card-foreground leading-relaxed whitespace-pre-line">
              {request.description}
            </p>
          </div>
        </div>

        <div>
          <SectionTitle>Issue Photos</SectionTitle>
          <div className="mt-2">
            <PhotoGrid photos={request.photos} />
          </div>
        </div>

        {request.status === "Resolved" && request.resolution_notes && (
          <div>
            <SectionTitle>Resolution Notes</SectionTitle>
            <div className="mt-2 rounded-2xl bg-muted px-4 py-3">
              <p className="text-[15px] font-nunito text-card-foreground leading-relaxed whitespace-pre-line">
                {request.resolution_notes}
              </p>
            </div>
          </div>
        )}

        <Button
          size="md"
          className="mt-2"
          isDisabled={isTerminal || actionLoading}
          onPress={handleAdvance}
        >
          {actionLoading ? "Working..." : buttonLabel}
        </Button>
      </Card>

      <ResolveMaintenanceModal
        isOpen={resolveModal.isOpen}
        onOpenChange={resolveModal.setOpen}
        tenantName={request.tenant_name}
        onConfirm={handleResolveConfirm}
        isSubmitting={actionLoading}
      />
    </div>
  );
}
