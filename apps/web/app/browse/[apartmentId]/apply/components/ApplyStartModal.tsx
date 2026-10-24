"use client";

import { useState } from "react";
import NextImage from "next/image";
import { useRouter } from "next/navigation";
import { Button, Link, Modal, Separator, Skeleton } from "@heroui/react";

import { formatPesoDisplay } from "@repo/utils";

import { useApplicationReadiness } from "@/hooks/use-application-readiness";

import ApplicationGuidelinesModal from "./ApplicationGuidelinesModal";
import ApplicationIssues from "./ApplicationIssues";
import PassportNotice from "./PassportNotice";

export interface ApplyStartViewer {
  /** Internal `public.users.id`. */
  userId: string;
  accountStatus: string | null;
  hasActiveApplication: boolean;
}

export interface ApplyStartApartment {
  id: string;
  name: string | null;
  /** "Barangay, City". */
  location: string | null;
  coverUrl: string;
  landlordId: string | null;
  monthlyRent: number;
  securityDeposit: number;
  advanceRent: number;
  maxOccupants: number | null;
}

interface ApplyStartModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  apartment: ApplyStartApartment;
  viewer: ApplyStartViewer;
  /** Route prefix of the apartment page, e.g. `/tenant/browse`. */
  basePath: string;
}

/**
 * First step of applying, opened from the apartment page's Apply Now: the
 * move-in cost and whether the tenant can apply (verified, complete Passport,
 * not their own listing, no pending application). Continue opens the form.
 */
export default function ApplyStartModal({ isOpen, onOpenChange, apartment, viewer, basePath }: ApplyStartModalProps) {
  const [isGuidelinesOpen, setIsGuidelinesOpen] = useState(false);
  const handleClose = () => onOpenChange(false);

  return (
    <>
      {isOpen ? (
        <Modal isOpen onOpenChange={onOpenChange}>
          <Modal.Backdrop>
            <Modal.Container placement="center" scroll="outside" size="lg">
              <Modal.Dialog className="w-full max-w-2xl! overflow-hidden rounded-3xl bg-card">
                <Modal.CloseTrigger
                  className="z-10 cursor-pointer bg-white/90! text-card-foreground shadow-sm"
                  onPress={handleClose}
                />
                {/* Bleeds past the dialog's p-6 to its top, left and right edges. */}
                <div className="relative -mx-6 -mt-6 mb-4 h-56 shrink-0 bg-muted">
                  <NextImage
                    src={apartment.coverUrl}
                    alt={apartment.name ?? "Apartment"}
                    fill
                    sizes="672px"
                    unoptimized
                    className="object-cover"
                  />
                </div>
                <Modal.Header className="flex flex-col items-start gap-1">
                  <Modal.Heading className="font-nunito text-xl font-bold text-card-foreground">
                    {apartment.name ?? "Apartment"}
                  </Modal.Heading>
                  {apartment.location ? <p className="text-sm text-muted-foreground">{apartment.location}</p> : null}
                </Modal.Header>
                {/* Mounted only while open: loading the Passport may link the verified ID (a write). */}
                <ApplyStartContent
                  apartment={apartment}
                  viewer={viewer}
                  basePath={basePath}
                  onCancel={handleClose}
                  onOpenGuidelines={() => setIsGuidelinesOpen(true)}
                />
              </Modal.Dialog>
            </Modal.Container>
          </Modal.Backdrop>
        </Modal>
      ) : null}

      <ApplicationGuidelinesModal isOpen={isGuidelinesOpen} onOpenChange={setIsGuidelinesOpen} />
    </>
  );
}

interface ApplyStartContentProps {
  apartment: ApplyStartApartment;
  viewer: ApplyStartViewer;
  basePath: string;
  onCancel: () => void;
  onOpenGuidelines: () => void;
}

function ApplyStartContent({ apartment, viewer, basePath, onCancel, onOpenGuidelines }: ApplyStartContentProps) {
  const router = useRouter();
  const readiness = useApplicationReadiness({
    userId: viewer.userId,
    accountStatus: viewer.accountStatus,
    landlordId: apartment.landlordId,
    hasActiveApplication: viewer.hasActiveApplication,
  });

  const totalMoveIn = apartment.monthlyRent + apartment.securityDeposit + apartment.advanceRent;
  // "Submitted automatically" only makes sense once the Passport holds what's needed.
  const showPassportNotice = !readiness.loading && !readiness.error && !readiness.isPassportIncomplete;
  const costs = [
    { label: "Monthly Rent", value: apartment.monthlyRent },
    { label: "Security Deposit", value: apartment.securityDeposit },
    { label: "Advance Rent", value: apartment.advanceRent },
  ];

  return (
    <>
      <Modal.Body className="space-y-4">
        <div className="flex flex-col gap-3 rounded-xl border border-border bg-muted p-4">
          {costs.map(({ label, value }) => (
            <div key={label} className="flex justify-between text-sm">
              <span className="text-muted-foreground">{label}</span>
              <span className="font-medium text-card-foreground">{formatPesoDisplay(value)}</span>
            </div>
          ))}
          <Separator />
          <div className="flex justify-between text-sm">
            <span className="font-semibold text-card-foreground">Total Move-in Cost</span>
            <span className="font-bold text-primary">{formatPesoDisplay(totalMoveIn)}</span>
          </div>
          {apartment.maxOccupants !== null ? (
            <p className="text-xs text-muted-foreground">
              This unit allows a maximum of {apartment.maxOccupants} occupant(s).
            </p>
          ) : null}
        </div>

        {showPassportNotice ? <PassportNotice /> : null}

        {readiness.loading ? (
          <div className="space-y-2" aria-busy="true" aria-label="Checking your APT Passport">
            <Skeleton className="h-4 w-2/3 rounded-lg bg-skeleton!" />
            <Skeleton className="h-4 w-1/2 rounded-lg bg-skeleton!" />
          </div>
        ) : readiness.error ? (
          <div className="space-y-2 rounded-2xl border border-danger/20 bg-danger/10 p-3" role="alert">
            <p className="text-sm text-card-foreground">Couldn&apos;t check your APT Passport: {readiness.error}</p>
            <Button size="sm" variant="danger-soft" className="cursor-pointer" onPress={readiness.refresh}>
              Try again
            </Button>
          </div>
        ) : (
          <ApplicationIssues issues={readiness.issues} />
        )}
      </Modal.Body>

      <Modal.Footer className="flex flex-col gap-3">
        <div className="grid w-full grid-cols-2 gap-2">
          <Button variant="danger-soft" fullWidth className="cursor-pointer" onPress={onCancel}>
            Cancel
          </Button>
          <Button
            fullWidth
            className="cursor-pointer"
            isDisabled={readiness.loading || !!readiness.error || !readiness.isReady}
            onPress={() => router.push(`${basePath}/${apartment.id}/apply`)}
          >
            Continue Application
          </Button>
        </div>
        <Link className="cursor-pointer text-sm font-medium text-primary!" onPress={onOpenGuidelines}>
          View application guidelines
        </Link>
      </Modal.Footer>
    </>
  );
}
