"use client";

import {
  Card,
  Button,
  Modal,
  Separator,
  useOverlayState,
} from "@heroui/react";

import { IconFlag } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { formatPesoDisplay } from "@repo/utils";
import MaintenanceHistoryButton from "./MaintenanceHistoryButton";
import ApplyStartModal, {
  type ApplyStartApartment,
  type ApplyStartViewer,
} from "../apply/components/ApplyStartModal";

interface PriceCardProps {
  price: number;
  securityDeposit: number | undefined;
  advancePayment: number | undefined;
  apartmentId?: string;
  basePath?: string;
  /** Signed-in tenant; null sends Apply Now to the apply route instead. */
  applyViewer?: ApplyStartViewer | null;
  applyApartment?: ApplyStartApartment;
}

export default function PriceCard({
  price,
  securityDeposit = 0,
  advancePayment = 0,
  apartmentId,
  basePath = "/browse",
  applyViewer = null,
  applyApartment,
}: PriceCardProps) {
  const router = useRouter();
  const [isApplyOpen, setIsApplyOpen] = useState(false);
  const breakdownModal = useOverlayState();

  const handleApply = () => {
    if (applyViewer && applyApartment) setIsApplyOpen(true);
    else if (apartmentId) router.push(`${basePath}/${apartmentId}/apply`);
  };

  const formattedPrice = formatPesoDisplay(price);

  const totalMoveInCost = price + securityDeposit + advancePayment;

  const costBreakdown = [
    { label: "Monthly Rent", value: formattedPrice },
    { label: "Security Deposit", value: `${formatPesoDisplay(securityDeposit)}` },
    { label: "Advance Payment", value: `${formatPesoDisplay(advancePayment)}` },
  ]

  return (
    <>
      {/* Desktop: full card with visible cost breakdown */}
      <div className="hidden lg:block">
        <Card className="border border-grey-300 shadow-none w-full">
          <Card.Header>
            <Card.Title className="text-2xl sm:text-3xl font-medium text-primary">
              {formattedPrice}<span className="text-base sm:text-xl">/month</span>
            </Card.Title>
          </Card.Header>

          <Card.Content>
            <div className="flex flex-col gap-3 bg-darker-white p-4 rounded-lg">
              {costBreakdown.map(({ label, value }) => (
                <div key={label} className="flex justify-between text-sm">
                  <span className="text-grey-500">{label}</span>
                  <span className="font-medium">{value}</span>
                </div>
              ))}

              <Separator />

              <div className="flex justify-between text-sm">
                <span className="font-medium">Total Move-in Cost:</span>
                <span className="font-medium">{formatPesoDisplay(totalMoveInCost)}</span>
              </div>
            </div>
          </Card.Content>

          <Card.Footer className="flex flex-col gap-2">
            <Button fullWidth className="cursor-pointer" onPress={handleApply}>
              Apply Now
            </Button>

            {apartmentId ? <MaintenanceHistoryButton apartmentId={apartmentId} /> : null}

            {/* Report Button */}
            <Button
              variant="tertiary"
              className="bg-red-400/10 text-red-600 border-red-300 hover:bg-red-400/20"
              fullWidth
            >
              <IconFlag size={16} />
              Report
            </Button>
          </Card.Footer>
        </Card>
      </div>

      {/* Mobile: inline actions stay in page flow */}
      <div className="lg:hidden flex flex-col gap-2">
        {apartmentId ? <MaintenanceHistoryButton apartmentId={apartmentId} /> : null}

        {/* Report Button */}
        <Button
          variant="tertiary"
          className="bg-red-400/10 text-red-600 border-red-300 hover:bg-red-400/20"
          fullWidth
        >
          <IconFlag size={16} />
          Report
        </Button>
      </div>

      {/* Mobile: fixed bottom bar, app-style price + apply */}
      <div className="lg:hidden fixed inset-x-0 bottom-0 z-30 md:left-64">
        <div className="border-t border-grey-300 bg-background/95 backdrop-blur px-4 pt-3 pb-[calc(0.75rem_+_env(safe-area-inset-bottom))]">
          <div className="flex items-center gap-3">
            <div className="shrink-0 min-w-0">
              <p className="text-xl font-medium text-primary">
                {formattedPrice}<span className="text-sm">/month</span>
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="-ml-2 h-auto px-2 py-1 text-xs text-grey-500 underline"
                onPress={breakdownModal.open}
              >
                Move-in cost breakdown
              </Button>
            </div>
            <Button className="flex-1 cursor-pointer" onPress={handleApply}>
              Apply Now
            </Button>
          </div>
        </div>
      </div>

      <Modal isOpen={breakdownModal.isOpen} onOpenChange={breakdownModal.setOpen}>
        <Modal.Backdrop>
          <Modal.Container size="sm">
            <Modal.Dialog>
              <Modal.CloseTrigger className="text-black" />
              <Modal.Header>
                <Modal.Heading className="text-foreground">Move-in Cost Breakdown</Modal.Heading>
              </Modal.Header>
              <Modal.Body className="flex flex-col gap-3">
                <p className="text-sm text-foreground/70">
                  Estimated initial payment required to move in.
                </p>
                {costBreakdown.map(({ label, value }) => (
                  <div key={label} className="flex justify-between text-sm">
                    <span className="text-foreground">{label}</span>
                    <span className="font-medium text-foreground">{value}</span>
                  </div>
                ))}

                <Separator />

                <div className="flex justify-between text-sm">
                  <span className="font-medium text-foreground">Total Move-in Cost:</span>
                  <span className="font-medium text-foreground">{formatPesoDisplay(totalMoveInCost)}</span>
                </div>
              </Modal.Body>
              <Modal.Footer className="flex justify-end gap-2">
                <Button
                  variant="tertiary"
                  onPress={breakdownModal.close}
                >
                  Close
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
      {applyViewer && applyApartment ? (
        <ApplyStartModal
          isOpen={isApplyOpen}
          onOpenChange={setIsApplyOpen}
          apartment={applyApartment}
          viewer={applyViewer}
          basePath={basePath}
        />
      ) : null}
    </>
  );
}
