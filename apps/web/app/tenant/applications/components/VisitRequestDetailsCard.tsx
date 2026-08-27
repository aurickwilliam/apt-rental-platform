"use client";

import { Card, Button, Separator, Chip, Modal, useOverlayState } from "@heroui/react";
import { Calendar, Clock, Users, Hourglass } from "lucide-react";
import { toast } from "@heroui/react";
import type { StoredVisit } from "@/app/tenant/applications/lib/visit-store";

type Props = { visit: StoredVisit; onCancel: () => void };

function formatLongDate(d: string) {
  try {
    return new Intl.DateTimeFormat("en-US", { dateStyle: "long" }).format(new Date(d));
  } catch {
    return d;
  }
}

export default function VisitRequestDetailsCard({ visit, onCancel }: Props) {
  const confirm = useOverlayState();

  const handleConfirm = () => {
    onCancel();
    toast.success("Visit request deleted");
    confirm.setOpen(false);
  };

  return (
    <>
      <Card className="border border-border bg-card text-card-foreground p-5 rounded-2xl">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-card-foreground">Visit Request Details</h3>
          <Chip variant="soft" color="warning" size="sm">
            Pending
          </Chip>
        </div>
        <div className="mt-3 flex items-center gap-2 rounded-2xl px-3 py-2.5" style={{ backgroundColor: "#FFF8E1" }}>
          <Hourglass size={16} style={{ color: "#FACC15" }} className="shrink-0" />
          <span className="flex-1 text-sm font-medium font-inter" style={{ color: "#FACC15" }}>
            Waiting for the landlord to respond
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Date</p>
              <p className="text-sm font-medium text-card-foreground">{formatLongDate(visit.visitDate)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Time</p>
              <p className="text-sm font-medium text-card-foreground">
                {visit.visitTime}:00 {visit.period}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Users size={16} className="text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Visitors</p>
              <p className="text-sm font-medium text-card-foreground">
                {visit.noVisitors} {visit.noVisitors === "1" ? "person" : "people"}
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

        <Separator className="my-4" />

        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">Submitted {formatLongDate(visit.createdAt)}</p>
          <Button variant="ghost" size="sm" className="text-danger" onPress={() => confirm.setOpen(true)}>
            Cancel Request
          </Button>
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
                <p className="text-sm text-muted-foreground">Are you sure you want to delete this visit request? This cannot be undone.</p>
              </Modal.Body>
              <Modal.Footer className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onPress={() => confirm.setOpen(false)}>
                  Keep
                </Button>
                <Button variant="danger" size="sm" onPress={handleConfirm}>
                  Delete
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </>
  );
}
