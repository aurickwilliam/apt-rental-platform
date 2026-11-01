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
import dynamic from "next/dynamic";
import MaintenanceHistoryButton from "./MaintenanceHistoryButton";
import { isApartmentUnavailable } from "@/lib/apartment-availability";
import { useTranslation } from "@/app/components/i18n/LocaleProvider";
import type { TranslationKey } from "@repo/i18n";
import type {
  ApplyStartApartment,
  ApplyStartViewer,
} from "../apply/components/ApplyStartModal";

// Split from the initial bundle: the apply flow only loads when opened.
const ApplyStartModal = dynamic(
  () => import("../apply/components/ApplyStartModal"),
  { ssr: false },
);

interface PriceCardProps {
  isPreview?: boolean;
  className?: string;
  price: number;
  apartmentStatus?: string | null;
  securityDeposit: number | undefined;
  advancePayment: number | undefined;
  apartmentId?: string;
  basePath?: string;
  /** Signed-in tenant; null sends Apply Now to the apply route instead. */
  applyViewer?: ApplyStartViewer | null;
  applyApartment?: ApplyStartApartment;
  /** Viewer who cannot apply (a landlord browsing from their portal): Apply Now stays visible but disabled. */
  isApplyDisabled?: boolean;
}

export default function PriceCard({
  isPreview = false,
  className = "",
  price,
  apartmentStatus,
  securityDeposit = 0,
  advancePayment = 0,
  apartmentId,
  basePath = "/browse",
  applyViewer = null,
  applyApartment,
  isApplyDisabled = false,
}: PriceCardProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const [isApplyOpen, setIsApplyOpen] = useState(false);
  const breakdownModal = useOverlayState();
  const isUnavailable = isApartmentUnavailable(apartmentStatus);

  const handleApply = () => {
    if (isPreview || isUnavailable || isApplyDisabled) return;
    if (applyViewer && applyApartment) setIsApplyOpen(true);
    else if (apartmentId) router.push(`${basePath}/${apartmentId}/apply`);
  };

  const formattedPrice = formatPesoDisplay(price);

  const totalMoveInCost = price + securityDeposit + advancePayment;

  // Deposit months under the 1–2 month rule; legacy peso amounts that do
  // not divide evenly show without a month count.
  const securityDepositMonths =
    price > 0 && securityDeposit > 0 && securityDeposit % price === 0
      ? securityDeposit / price
      : null;

  const costBreakdown: { labelKey: TranslationKey; value: string; sub?: string }[] = [
    { labelKey: "apartment.price.monthlyRent", value: formattedPrice },
    {
      labelKey: "apartment.price.securityDeposit",
      value: `${formatPesoDisplay(securityDeposit)}`,
      sub:
        securityDepositMonths !== null
          ? securityDepositMonths === 1
            ? t("apartment.price.months", { count: securityDepositMonths })
            : t("apartment.price.monthsPlural", { count: securityDepositMonths })
          : undefined,
    },
    { labelKey: "apartment.price.advancePayment", value: `${formatPesoDisplay(advancePayment)}` },
  ]

  return (
    <>
      {/* Desktop: full card with visible cost breakdown */}
      <div className={isPreview ? "block" : "hidden lg:block"}>
        <Card className={`border border-border shadow-none w-full ${className}`}>
          <Card.Header>
            <Card.Title className="listing-rent-heading text-2xl sm:text-3xl font-medium text-primary">
              {formattedPrice}<span className="text-base sm:text-xl">{t("apartment.price.perMonth")}</span>
            </Card.Title>
          </Card.Header>

          <Card.Content>
            <div className="listing-cost-breakdown flex flex-col gap-3 bg-muted p-4 rounded-lg">
              {costBreakdown.map(({ labelKey, value, sub }) => (
                <div key={labelKey} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {t(labelKey)}
                    {sub ? (
                      <span className="ml-1 text-xs font-normal">{sub}</span>
                    ) : null}
                  </span>
                  <span className="font-medium text-foreground text-right">{value}</span>
                </div>
              ))}

              <Separator />

              <div className="flex justify-between text-sm">
                <span className="font-medium text-foreground">{t("apartment.price.totalMoveIn")}</span>
                <span className="font-medium text-foreground">{formatPesoDisplay(totalMoveInCost)}</span>
              </div>
            </div>
          </Card.Content>

          <Card.Footer className="flex flex-col gap-2">
            <Button fullWidth className="cursor-pointer" onPress={handleApply} isDisabled={isPreview || isUnavailable || isApplyDisabled}>
              {isUnavailable ? t("apartment.price.unavailable") : t("apartment.price.apply")}
            </Button>
            {isApplyDisabled && !isUnavailable ? (
              <p className="text-center text-xs text-muted-foreground">{t("apartment.price.tenantsOnly")}</p>
            ) : null}

            {!isPreview && apartmentId ? <MaintenanceHistoryButton apartmentId={apartmentId} /> : null}

            {/* Report Button */}
            <Button
              variant="tertiary"
              className="bg-red-400/10 text-red-600 border-red-300 hover:bg-red-400/20"
              fullWidth
              isDisabled={isPreview}
            >
              <IconFlag size={16} />
              {t("apartment.price.report")}
            </Button>
          </Card.Footer>
        </Card>
      </div>

      {/* Mobile: inline actions stay in page flow */}
      {!isPreview && <>
      <div className="lg:hidden flex flex-col gap-2">
        {apartmentId ? <MaintenanceHistoryButton apartmentId={apartmentId} /> : null}

        {/* Report Button */}
        <Button
          variant="tertiary"
          className="bg-red-400/10 text-red-600 border-red-300 hover:bg-red-400/20"
          fullWidth
        >
          <IconFlag size={16} />
          {t("apartment.price.report")}
        </Button>
      </div>

      {/* Mobile: fixed bottom bar, app-style price + apply */}
      <div className="lg:hidden fixed inset-x-0 bottom-0 z-30 md:left-64">
        <div className="border-t border-border bg-background/95 backdrop-blur px-4 pt-3 pb-[calc(0.75rem_+_env(safe-area-inset-bottom))]">
          <div className="flex items-center gap-3">
            <div className="shrink-0 min-w-0">
              <p className="text-xl font-medium text-primary">
                {formattedPrice}<span className="text-sm">{t("apartment.price.perMonth")}</span>
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="-ml-2 h-auto px-2 py-1 text-xs text-muted-foreground underline"
                onPress={breakdownModal.open}
              >
                {t("apartment.price.breakdownLink")}
              </Button>
            </div>
            <Button className="flex-1 cursor-pointer" onPress={handleApply} isDisabled={isUnavailable || isApplyDisabled}>
              {isUnavailable ? t("apartment.price.unavailable") : t("apartment.price.apply")}
            </Button>
          </div>
        </div>
      </div>

      </>}
      <Modal isOpen={breakdownModal.isOpen} onOpenChange={breakdownModal.setOpen}>
        <Modal.Backdrop>
          <Modal.Container size="sm">
            <Modal.Dialog>
              <Modal.CloseTrigger className="text-black" />
              <Modal.Header>
                <Modal.Heading className="text-foreground">{t("apartment.price.breakdownTitle")}</Modal.Heading>
              </Modal.Header>
              <Modal.Body className="flex flex-col gap-3">
                <p className="text-sm text-foreground/70">
                  {t("apartment.price.breakdownBody")}
                </p>
                {costBreakdown.map(({ labelKey, value, sub }) => (
                  <div key={labelKey} className="flex justify-between text-sm">
                    <span className="text-foreground">
                      {t(labelKey)}
                      {sub ? (
                        <span className="ml-1 text-xs font-normal text-muted-foreground">{sub}</span>
                      ) : null}
                    </span>
                    <span className="font-medium text-foreground">{value}</span>
                  </div>
                ))}

                <Separator />

                <div className="flex justify-between text-sm">
                  <span className="font-medium text-foreground">{t("apartment.price.totalMoveIn")}</span>
                  <span className="font-medium text-foreground">{formatPesoDisplay(totalMoveInCost)}</span>
                </div>
              </Modal.Body>
              <Modal.Footer className="flex justify-end gap-2">
                <Button
                  variant="tertiary"
                  onPress={breakdownModal.close}
                >
                  {t("apartment.price.close")}
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
      {!isPreview && applyViewer && applyApartment ? (
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
