"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Modal, useOverlayState } from "@heroui/react";
import { ArrowLeft } from "lucide-react";

import { useApplicationReadiness } from "@/hooks/use-application-readiness";
import { useSubmitApplication } from "@/hooks/use-submit-application";

import type { ApplyViewer } from "../lib/load-apply-page";
import { validatePreferences, validateTenantInfo } from "../lib/validate-application";
import {
  EMPTY_APPLICATION_FORM,
  type ApplicationErrors,
  type ApplicationForm,
  type ApplyApartmentContext,
} from "../types";
import ApplicationGuidelinesModal from "./ApplicationGuidelinesModal";
import ApplicationHeader from "./ApplicationHeader";
import ApartmentSummaryStep from "./steps/ApartmentSummaryStep";
import PreferencesStep from "./steps/PreferencesStep";
import ReviewStep from "./steps/ReviewStep";
import SubmittedStep from "./steps/SubmittedStep";
import TenantInfoStep from "./steps/TenantInfoStep";

type Step = "summary" | "tenant" | "preferences" | "review" | "submitted";

// The three form steps; mobile's `ApplicationHeader` counts the same.
const WIZARD: Partial<Record<Step, { index: number; currentTitle: string; nextTitle: string }>> = {
  tenant: { index: 1, currentTitle: "Tenant Information", nextTitle: "Rental Preferences" },
  preferences: { index: 2, currentTitle: "Rental Preferences", nextTitle: "Review Application" },
  review: { index: 3, currentTitle: "Review Application", nextTitle: "Submit Application" },
};
const WIZARD_STEP_COUNT = 3;
const PREVIOUS_STEP: Partial<Record<Step, Step>> = { tenant: "summary", preferences: "tenant", review: "preferences" };
const REDIRECT_AFTER_SUBMIT_MS = 900;

interface ApplyClientProps {
  apartment: ApplyApartmentContext;
  viewer: ApplyViewer;
  hasActiveApplication: boolean;
}

/**
 * Apply flow: summary → tenant info → preferences → review → submitted.
 * There is no upload step: the APT Passport is attached by reference.
 */
export default function ApplyClient({ apartment, viewer, hasActiveApplication }: ApplyClientProps) {
  const router = useRouter();
  const discardModal = useOverlayState();
  const [step, setStep] = useState<Step>("summary");
  const [isGuidelinesOpen, setIsGuidelinesOpen] = useState(true);
  const [form, setForm] = useState<ApplicationForm>(EMPTY_APPLICATION_FORM);
  const [errors, setErrors] = useState<ApplicationErrors>({});

  const readiness = useApplicationReadiness({
    userId: viewer.userId,
    accountStatus: viewer.accountStatus,
    landlordId: apartment.landlordId,
    hasActiveApplication,
    // Proof of income only counts once the employment type is known.
    employmentType: form.employmentType || null,
  });
  const { submit, isSubmitting, error: submitError } = useSubmitApplication();

  const updateForm = useCallback((patch: Partial<ApplicationForm>) => setForm((current) => ({ ...current, ...patch })), []);
  const clearError = useCallback(
    (key: string) =>
      setErrors((current) => {
        if (!current[key]) return current;
        const next = { ...current };
        delete next[key];
        return next;
      }),
    [],
  );

  const goTo = (next: Step) => {
    setErrors({});
    setStep(next);
    window.scrollTo({ top: 0 });
  };
  const advanceIfValid = (nextErrors: ApplicationErrors, next: Step) => {
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length === 0) goTo(next);
  };
  const goBack = () => {
    const previous = PREVIOUS_STEP[step];
    if (previous) goTo(previous);
    else router.back();
  };

  const handleSubmit = async () => {
    const result = await submit(apartment.id, form);
    if (!result.success) return;
    goTo("submitted");
    setTimeout(() => router.push("/tenant/my-rental"), REDIRECT_AFTER_SUBMIT_MS);
  };

  const totalMoveIn = (apartment.monthlyRent ?? 0) + (apartment.securityDeposit ?? 0) + (apartment.advanceRent ?? 0);
  const wizard = WIZARD[step];

  return (
    <div className="mx-auto w-full max-w-7xl p-4 pb-12 md:p-6">
      <div className="mb-4 flex items-center gap-2">
        {step !== "submitted" ? (
          <Button variant="outline" size="sm" isDisabled={isSubmitting} onPress={goBack}>
            <ArrowLeft size={16} />
            Back
          </Button>
        ) : null}
        <div className="ml-auto hidden text-xs text-muted-foreground md:block">
          Applying to <span className="font-semibold text-primary">{apartment.name ?? "Listing"}</span>
        </div>
      </div>

      {wizard ? (
        <div className="mb-6">
          <ApplicationHeader
            currentTitle={wizard.currentTitle}
            nextTitle={wizard.nextTitle}
            step={wizard.index}
            totalSteps={WIZARD_STEP_COUNT}
          />
        </div>
      ) : null}

      {step === "summary" && (
        <ApartmentSummaryStep
          apartment={apartment}
          totalMoveIn={totalMoveIn}
          readiness={readiness}
          onContinue={() => goTo("tenant")}
          onCancel={discardModal.open}
          onOpenGuidelines={() => setIsGuidelinesOpen(true)}
        />
      )}

      {step === "tenant" && (
        <TenantInfoStep
          form={form}
          errors={errors}
          onChange={updateForm}
          clearError={clearError}
          onBack={goBack}
          onNext={() => advanceIfValid(validateTenantInfo(form), "preferences")}
        />
      )}

      {step === "preferences" && (
        <PreferencesStep
          form={form}
          errors={errors}
          onChange={updateForm}
          clearError={clearError}
          maxOccupants={apartment.maxOccupants}
          onBack={goBack}
          onNext={() => advanceIfValid(validatePreferences(form, apartment.maxOccupants), "review")}
        />
      )}

      {step === "review" && (
        <ReviewStep
          apartment={apartment}
          form={form}
          totalMoveIn={totalMoveIn}
          readiness={readiness}
          isSubmitting={isSubmitting}
          submitError={submitError}
          onBack={goBack}
          onSubmit={() => void handleSubmit()}
        />
      )}

      {step === "submitted" && <SubmittedStep apartmentName={apartment.name} />}

      <ApplicationGuidelinesModal
        isOpen={isGuidelinesOpen && step === "summary"}
        onOpenChange={setIsGuidelinesOpen}
      />

      <Modal isOpen={discardModal.isOpen} onOpenChange={discardModal.setOpen}>
        <Modal.Backdrop>
          <Modal.Container size="sm">
            <Modal.Dialog>
              <Modal.Header>
                <Modal.Heading>Discard Application?</Modal.Heading>
              </Modal.Header>
              <Modal.Body>
                <p className="text-sm text-muted-foreground">
                  Your progress will be lost if you leave now. Are you sure you want to cancel?
                </p>
              </Modal.Body>
              <Modal.Footer className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onPress={discardModal.close}>
                  Keep Editing
                </Button>
                <Button
                  variant="danger-soft"
                  size="sm"
                  onPress={() => {
                    discardModal.close();
                    router.back();
                  }}
                >
                  Discard
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </div>
  );
}
