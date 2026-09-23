"use client";

import { Card, Button, Separator, Chip, Modal, useOverlayState } from "@heroui/react";
import { Calendar, Clock, Users, Hourglass, CheckCircle2, XCircle, CalendarX } from "lucide-react";
import { toast } from "@heroui/react";
import type { VisitRequest } from "@/service/visitRequestsService";

type Props = {
  visit: VisitRequest;
  onCancel: () => void;
  onAccept?: () => void;
  onDecline?: () => void;
  onRequestAgain?: () => void;
  actionLoading?: boolean;
};

function formatLongDate(d: string) {
  try {
    return new Intl.DateTimeFormat("en-US", { dateStyle: "long" }).format(new Date(d));
  } catch {
    return d;
  }
}

function formatTimeDisplay(time: string) {
  const parts = time.split(":");
  const hour = parseInt(parts[0] ?? "0", 10);
  const minute = parts[1] ?? "00";
  if (Number.isNaN(hour)) return time;
  const period = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${hour12}:${minute} ${period}`;
}

const STATUS_CHIP: Record<VisitRequest["status"], { label: string; color: "warning" | "success" | "danger" | "default" }> = {
  pending: { label: "Pending", color: "warning" },
  approved: { label: "Confirmed", color: "success" },
  rejected: { label: "Rejected", color: "danger" },
  cancelled: { label: "Cancelled", color: "default" },
  rescheduled: { label: "Rescheduled", color: "warning" },
};

export default function VisitRequestDetailsCard({
  visit,
  onCancel,
  onAccept,
  onDecline,
  onRequestAgain,
  actionLoading,
}: Props) {
  const confirm = useOverlayState();

  const chip = STATUS_CHIP[visit.status] ?? STATUS_CHIP.pending;
  const effectiveDate = visit.confirmed_visit_date ?? visit.visit_date;
  const effectiveTime = visit.confirmed_time ?? visit.time;
  const canCancel =
    visit.status === "pending" || visit.status === "rescheduled" || visit.status === "approved";
  const isDeclinedReschedule =
    visit.status === "cancelled" && !!visit.confirmed_visit_date && !!visit.confirmed_time;

  const handleConfirm = () => {
    onCancel();
    toast.success("Visit request cancelled");
    confirm.setOpen(false);
  };

  return (
    <>
      <Card className="border border-border bg-card text-card-foreground p-5 rounded-2xl">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-card-foreground">Visit Request Details</h3>
          <Chip variant="soft" color={chip.color} size="sm">
            {chip.label}
          </Chip>
        </div>

        {visit.status === "pending" && (
          <div className="mt-3 flex items-center gap-2 rounded-2xl px-3 py-2.5" style={{ backgroundColor: "#FFF8E1" }}>
            <Hourglass size={16} style={{ color: "#FACC15" }} className="shrink-0" />
            <span className="flex-1 text-sm font-medium font-inter" style={{ color: "#FACC15" }}>
              Waiting for the landlord to respond
            </span>
          </div>
        )}
        {visit.status === "approved" && (
          <div className="mt-3 flex items-center gap-2 rounded-2xl px-3 py-2.5 bg-green-50 dark:bg-green-900/20">
            <CheckCircle2 size={16} className="shrink-0 text-green-600" />
            <span className="flex-1 text-sm font-medium text-green-600">Visit confirmed</span>
          </div>
        )}
        {visit.status === "rescheduled" && (
          <div className="mt-3 rounded-2xl px-3 py-2.5 bg-blue-50 dark:bg-blue-900/20">
            <p className="text-xs text-muted-foreground">
              Originally requested {formatLongDate(visit.visit_date)} · {formatTimeDisplay(visit.time)}
            </p>
            <p className="text-sm font-medium text-card-foreground mt-1">
              Landlord proposed a new time — accept or decline below.
            </p>
          </div>
        )}
        {visit.status === "cancelled" && (
          <div className="mt-3 flex items-center gap-2 rounded-2xl px-3 py-2.5 bg-muted">
            <CalendarX size={16} className="shrink-0 text-muted-foreground" />
            <span className="flex-1 text-sm font-medium text-muted-foreground">
              {isDeclinedReschedule ? "You declined the reschedule" : "You cancelled this visit"}
            </span>
          </div>
        )}
        {visit.status === "rejected" && visit.rejected_reason && (
          <div className="mt-3 rounded-2xl px-3 py-2.5 bg-red-50 dark:bg-red-900/20">
            <p className="text-xs font-semibold text-red-600">Rejection Reason</p>
            <p className="text-sm text-card-foreground mt-1">{visit.rejected_reason}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Date</p>
              <p className="text-sm font-medium text-card-foreground">{formatLongDate(effectiveDate)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Time</p>
              <p className="text-sm font-medium text-card-foreground">{formatTimeDisplay(effectiveTime)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Users size={16} className="text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Visitors</p>
              <p className="text-sm font-medium text-card-foreground">
                {visit.no_visitors} {visit.no_visitors === 1 ? "person" : "people"}
              </p>
            </div>
          </div>
        </div>

        {visit.notes && (
          <>
            <Separator className="my-4" />
            <div>
              <p className="text-xs text-muted-foreground">Additional Notes</p>
              <p className="text-sm text-card-foreground mt-1">{visit.notes}</p>
            </div>
          </>
        )}

        {(visit.status === "rescheduled" || visit.status === "rejected" || visit.status === "cancelled") && (
          <>
            <Separator className="my-4" />
            <div className="flex gap-2">
              {visit.status === "rescheduled" && (
                <>
                  <Button
                    variant="danger"
                    size="sm"
                    className="flex-1"
                    isDisabled={actionLoading}
                    onPress={onDecline}
                  >
                    <XCircle size={16} /> Decline
                  </Button>
                  <Button size="sm" className="flex-1" isDisabled={actionLoading} onPress={onAccept}>
                    <CheckCircle2 size={16} /> Accept
                  </Button>
                </>
              )}
              {(visit.status === "rejected" || visit.status === "cancelled") && onRequestAgain && (
                <Button size="sm" className="flex-1" onPress={onRequestAgain}>
                  Request Again
                </Button>
              )}
            </div>
          </>
        )}

        <Separator className="my-4" />

        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">Submitted {formatLongDate(visit.created_at)}</p>
          {canCancel && (
            <Button
              variant="ghost"
              size="sm"
              className="text-danger"
              isDisabled={actionLoading}
              onPress={() => confirm.setOpen(true)}
            >
              Cancel Request
            </Button>
          )}
        </div>
      </Card>

      <Modal isOpen={confirm.isOpen} onOpenChange={confirm.setOpen}>
        <Modal.Backdrop>
          <Modal.Container size="sm">
            <Modal.Dialog>
              <Modal.Header>
                <Modal.Heading>Cancel Visit Request</Modal.Heading>
              </Modal.Header>
              <Modal.Body>
                <p className="text-sm text-muted-foreground">
                  {visit.status === "approved"
                    ? "This visit was already confirmed with the landlord. Are you sure you want to cancel it? This cannot be undone."
                    : "Are you sure you want to cancel this visit request? This cannot be undone."}
                </p>
              </Modal.Body>
              <Modal.Footer className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onPress={() => confirm.setOpen(false)}>
                  Keep
                </Button>
                <Button variant="danger" size="sm" onPress={handleConfirm}>
                  Yes, Cancel
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </>
  );
}
