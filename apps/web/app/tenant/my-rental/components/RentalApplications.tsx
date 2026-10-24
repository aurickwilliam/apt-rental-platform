"use client";

import { use } from "react";
import { Button, Modal, useOverlayState } from "@heroui/react";
import { IconHistory as History, IconHome as House, IconX as X } from "@tabler/icons-react";
import { useTenantApplications } from "@/hooks/use-tenant-applications";
import type { InitialRentalContext } from "@/service/tenancy-context";
import ApplicationsList from "./ApplicationsList";
import TenancyEmptyState from "./TenancyEmptyState";

interface RentalApplicationsProps {
  tenantId?: string;
  initial?: InitialRentalContext["applications"];
  activeLease?: boolean;
}

/** Only this region suspends for the request-owned applications promise. */
export default function RentalApplications({ tenantId, initial, activeLease = false }: RentalApplicationsProps) {
  const seed = initial ? use(initial) : undefined;
  const { applications, loading, error } = useTenantApplications(tenantId, undefined, false, seed);
  const historyDialog = useOverlayState();
  const hasApplications = !loading && applications.length > 0;

  if (!activeLease) {
    return loading || hasApplications || error ? <ApplicationsList applications={applications} loading={loading} error={error} /> : (
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <House size={20} className="text-primary" />
          <h2 className="text-lg font-semibold text-card-foreground">My Rental</h2>
        </div>
        <TenancyEmptyState />
      </div>
    );
  }

  if (!hasApplications) return null;
  return (
    <>
      <Button variant="outline" size="sm" onPress={() => historyDialog.setOpen(true)}>
        <History size={16} /> Application History
      </Button>
      <Modal isOpen={historyDialog.isOpen} onOpenChange={historyDialog.setOpen}>
        <Modal.Backdrop>
          <Modal.Container size="lg" scroll="inside">
            <Modal.Dialog>
              <Modal.Header className="flex flex-row items-center justify-between">
                <Modal.Heading>Application History</Modal.Heading>
                <Button isIconOnly variant="ghost" size="sm" onPress={() => historyDialog.setOpen(false)} aria-label="Close application history" className="text-muted-foreground">
                  <X size={18} />
                </Button>
              </Modal.Header>
              <Modal.Body>
                <ApplicationsList showHeader={false} applications={applications} loading={loading} error={error} />
              </Modal.Body>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </>
  );
}
