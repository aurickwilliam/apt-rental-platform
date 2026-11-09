"use client";

import { Button, Card } from "@heroui/react";
import { IconCalendarEvent, IconStack, IconFlag, IconClock, IconProgress, IconTrash } from "@tabler/icons-react";
import StatusChip from "@/app/components/display/StatusChip";
import type { StatusTone } from "@/lib/status-tone";
import type { MaintenanceRequest } from "@/service/maintenanceService";

interface ActiveMaintenanceRequestCardProps {
  request: MaintenanceRequest;
  category: string;
  imageUrls: string[];
  urgencyTone: StatusTone;
  statusTone: StatusTone;
  cancellable: boolean;
  cancelling: boolean;
  onCancel: () => void;
}

export default function ActiveMaintenanceRequestCard({ request, category, imageUrls, urgencyTone, statusTone, cancellable, cancelling, onCancel }: ActiveMaintenanceRequestCardProps) {
  const StatusIcon = request.status === "In Progress" ? IconProgress : IconClock;
  return (
    <Card className="rounded-xl border border-border" style={{ background: "color-mix(in srgb, var(--primary) 3%, var(--card))", borderColor: "color-mix(in srgb, var(--primary) 25%, var(--border))", boxShadow: "none" }}>
      <Card.Content style={{ padding: 4 }}>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="flex min-w-0 flex-1 basis-48 items-start gap-3">
            <span className="mt-0.5 h-6 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
            <h3 className="min-w-0 break-words font-nunito text-xl font-bold text-card-foreground">{request.title}</h3>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusChip size="md" tone={urgencyTone} className="font-nunito font-semibold"><span className="flex items-center gap-1.5 capitalize"><IconFlag size={18} aria-hidden="true" />{request.urgency}</span></StatusChip>
            <StatusChip size="md" tone={statusTone} className="font-nunito font-semibold"><span className="flex items-center gap-1.5"><StatusIcon size={18} aria-hidden="true" />{request.status}</span></StatusChip>
          </div>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 font-inter text-sm text-muted-foreground">
          <span className="flex min-w-0 items-center gap-2"><IconStack size={18} className="shrink-0" aria-hidden="true" />{category}</span>
          <span className="hidden h-4 border-l border-border sm:block" aria-hidden="true" />
          <span className="flex items-center gap-2"><IconCalendarEvent size={18} className="shrink-0" aria-hidden="true" /><time dateTime={request.created_at}>{new Date(request.created_at).toLocaleString()}</time></span>
        </div>
        <div className={`mt-4 grid gap-4 ${imageUrls.length === 1 ? "sm:grid-cols-[8rem_minmax(0,1fr)]" : ""}`}>
          {imageUrls.length > 0 ? (
            <div className="flex min-w-0 flex-wrap gap-2">
              {imageUrls.map((url, index) => (
                <a key={`${request.id}-${index}`} href={url} target="_blank" rel="noreferrer" className="block size-24 shrink-0 overflow-hidden rounded-lg border border-border sm:size-32">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`Issue photo ${index + 1}`} className="h-full w-full object-cover" />
                </a>
              ))}
            </div>
          ) : null}
          <div className="min-w-0">
            <p className="mb-1 font-nunito text-sm font-semibold text-muted-foreground">Description</p>
            <Card className="rounded-xl border border-border" style={{ padding: 12, background: "color-mix(in srgb, var(--muted) 45%, var(--card))", boxShadow: "none" }}>
              <p className="min-h-10 whitespace-pre-line break-words font-inter text-sm text-card-foreground">{request.message}</p>
            </Card>
            {cancellable ? <div className="mt-3 flex justify-end"><Button variant="outline" size="sm" className="shrink-0 rounded-xl! font-nunito font-semibold" isDisabled={cancelling} onPress={onCancel}><IconTrash size={18} aria-hidden="true" />{cancelling ? "Cancelling..." : "Cancel request"}</Button></div> : null}
          </div>
        </div>
      </Card.Content>
    </Card>
  );
}
