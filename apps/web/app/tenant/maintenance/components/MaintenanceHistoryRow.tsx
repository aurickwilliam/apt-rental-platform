"use client";

import { Button, Disclosure } from "@heroui/react";
import { IconChevronRight, IconChevronUp, IconStack, IconCalendarEvent, IconBolt, IconLeaf, IconCircleCheck, IconCircleX } from "@tabler/icons-react";
import StatusChip from "@/app/components/display/StatusChip";
import type { StatusTone } from "@/lib/status-tone";
import type { MaintenanceRequest } from "@/service/maintenanceService";

interface MaintenanceHistoryRowProps {
  request: MaintenanceRequest;
  category: string;
  imageUrls: string[];
  urgencyTone: StatusTone;
  statusTone: StatusTone;
  expanded: boolean;
  onExpandedChange: (open: boolean) => void;
}

export default function MaintenanceHistoryRow({ request, category, imageUrls, urgencyTone, statusTone, expanded, onExpandedChange }: MaintenanceHistoryRowProps) {
  const UrgencyIcon = request.urgency === "low" ? IconLeaf : IconBolt;
  const StatusIcon = request.status === "Resolved" ? IconCircleCheck : IconCircleX;
  return (
    <Disclosure className="rounded-xl border border-border p-4 shadow-sm" style={{ background: "color-mix(in srgb, var(--primary) 3%, var(--card))" }} isExpanded={expanded} onExpandedChange={onExpandedChange}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0 flex-1 basis-72">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 h-6 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
            <p className="min-w-0 break-words font-nunito text-lg font-bold text-card-foreground">{request.title}</p>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 pl-5 font-inter text-sm text-muted-foreground">
            <span className="flex min-w-0 items-center gap-2"><IconStack size={18} className="shrink-0" aria-hidden="true" />{category}</span>
            <span className="hidden h-4 border-l border-border sm:block" aria-hidden="true" />
            <span className="flex items-center gap-2"><IconCalendarEvent size={18} className="shrink-0" aria-hidden="true" /><time dateTime={request.created_at}>{new Date(request.created_at).toLocaleString()}</time></span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <StatusChip size="md" tone={urgencyTone} className="font-nunito font-semibold"><span className="flex items-center gap-1.5 capitalize"><UrgencyIcon size={18} aria-hidden="true" />{request.urgency}</span></StatusChip>
          <StatusChip size="md" tone={statusTone} className="font-nunito font-semibold"><span className="flex items-center gap-1.5"><StatusIcon size={18} aria-hidden="true" />{request.status}</span></StatusChip>
          <span className="hidden h-8 border-l border-border sm:block" aria-hidden="true" />
          <Disclosure.Heading>
            <Button slot="trigger" variant="secondary" aria-label={`${expanded ? "Hide" : "View"} details for ${request.title}`} className="rounded-xl! font-nunito font-bold">
              <span className="flex items-center gap-2">{expanded ? "Hide details" : "View details"}{expanded ? <IconChevronUp size={18} aria-hidden="true" /> : <IconChevronRight size={18} aria-hidden="true" />}</span>
            </Button>
          </Disclosure.Heading>
        </div>
      </div>
      <Disclosure.Content>
        {expanded ? <div>
          <p className="mt-2 whitespace-pre-line font-inter text-sm text-muted-foreground">{request.message}</p>
          {imageUrls.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {imageUrls.map((url, index) => (
                <a key={`${request.id}-${index}`} href={url} target="_blank" rel="noreferrer" className="block size-20 overflow-hidden rounded-lg border border-border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`Issue photo ${index + 1}`} className="h-full w-full object-cover" />
                </a>
              ))}
            </div>
          ) : null}
          {request.resolved_at ? (
            <div className="mt-3 rounded-lg bg-muted p-3">
              <p className="font-inter text-xs text-muted-foreground">Resolved {new Date(request.resolved_at).toLocaleString()}</p>
              {request.resolution_notes ? <p className="mt-1 font-inter text-sm text-card-foreground">{request.resolution_notes}</p> : null}
            </div>
          ) : null}
        </div> : null}
      </Disclosure.Content>
    </Disclosure>
  );
}
