"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Modal, useOverlayState } from "@heroui/react";

import {
  applicationAnswersFromPreferences,
  buildApplicationPreferenceSnapshot,
  describeApplicationPreferences,
} from "@repo/utils";

import FormStepper from "@/app/components/layout/FormStepper";
import { useApplicationReadiness } from "@/hooks/use-application-readiness";
import { useSubmitApplication } from "@/hooks/use-submit-application";

import type { ApplicantPersonalInfo } from "@/lib/application-profile";
import type { TenantPreferences } from "@/lib/tenant-preferences";

import type { ApplyViewer } from "../lib/load-apply-page";
import { validatePreferences, validateTenantInfo } from "../lib/validate-application";
import {
  EMPTY_APPLICATION_FORM,
  type ApplicationErrors,
  type ApplicationForm,
  type ApplyApartmentContext,
} from "../types";
import ApplicationIssues from "./ApplicationIssues";
import PreferencesStep from "./steps/PreferencesStep";
import ReviewStep from "./steps/ReviewStep";
import SubmittedStep from "./steps/SubmittedStep";
import TenantInfoStep from "./steps/TenantInfoStep";

type Step = "tenant" | "preferences" | "review" | "submitted";

// The three form steps, in order; mobile's `ApplicationHeader` counts the same.
const WIZARD_STEPS = [
  { key: "tenant", label: "Tenant Information", short: "Tenant Info" },
  { key: "preferences", label: "Rental Preferences", short: "Preferences" },
  { key: "review", label: "Review Application", short: "Review" },
] as const satisfies readonly { key: Step; label: string; short: string }[];
const PREVIOUS_STEP: Partial<Record<Step, Step>> = { preferences: "tenant", review: "preferences" };

/** 1-based position in the stepper; 0 once submitted, which has no stepper. */
function wizardNumber(step: Step): number {
  return WIZARD_STEPS.findIndex(({ key }) => key === step) + 1;
}

interface ApplyClientProps {
  apartment: ApplyApartmentContext;
  viewer: ApplyViewer;
  hasActiveApplication: boolean;
  personalInfo: ApplicantPersonalInfo;
  savedPreferences: TenantPreferences | null;
  /** Sticky offset for the stepper; the public route sits under the navbar. */
  stepperStickyClassName?: string;
}

/**
 * Apply flow: tenant info → preferences → review → submitted. The summary
 * (move-in cost + readiness) is the apartment page's Apply Now modal
 * (`ApplyStartModal`). There is no upload step: the APT Passport is attached
 * by reference.
 */
export default function ApplyClient({
  apartment,
  viewer,
  hasActiveApplication,
  personalInfo,
  savedPreferences,
  stepperStickyClassName,
}: ApplyClientProps) {
  const router = useRouter();
  const discardModal = useOverlayState();
  const [step, setStep] = useState<Step>("tenant");
  const [furthestStep, setFurthestStep] = useState(1);
  // The pets, smoking and parking questions start from the saved preferences;
  // the tenant can change any answer for this application.
  const prefilled = useMemo(() => applicationAnswersFromPreferences(savedPreferences), [savedPreferences]);
  const [form, setForm] = useState<ApplicationForm>(() => ({
    ...EMPTY_APPLICATION_FORM,
    ...personalInfo,
    ...prefilled,
  }));
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
    setFurthestStep((current) => Math.max(current, wizardNumber(next)));
    window.scrollTo({ top: 0 });
  };
  const advanceIfValid = (nextErrors: ApplicationErrors, next: Step) => {
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length === 0) goTo(next);
  };
  const goBack = () => {
    const previous = PREVIOUS_STEP[step];
    if (previous) goTo(previous);
    else discardModal.open();
  };

  // Going back keeps the draft. Going forward re-checks every step before the
  // target and stops at the first one that needs attention.
  const handleStepSelect = (number: number) => {
    const target = WIZARD_STEPS[number - 1].key;
    if (number > wizardNumber(step)) {
      const tenantErrors = validateTenantInfo(form);
      if (Object.keys(tenantErrors).length > 0) {
        goTo("tenant");
        setErrors(tenantErrors);
        return;
      }
      if (target === "review") {
        const preferenceErrors = validatePreferences(form, apartment.maxOccupants);
        if (Object.keys(preferenceErrors).length > 0) {
          goTo("preferences");
          setErrors(preferenceErrors);
          return;
        }
      }
    }
    if (target !== step) goTo(target);
  };

  const handleSubmit = async () => {
    const result = await submit(apartment.id, form);
    if (!result.success) return;
    goTo("submitted");
  };

  // What the landlord will see of the saved preferences, for the review step.
  const sharedPreferences = useMemo(() => {
    const snapshot = buildApplicationPreferenceSnapshot(savedPreferences, {
      hasPets: form.hasPets === "yes",
      isSmoker: form.isSmoker === "yes",
      needParking: form.needParking === "yes",
    });
    return snapshot ? describeApplicationPreferences(snapshot) : null;
  }, [savedPreferences, form.hasPets, form.isSmoker, form.needParking]);

  const totalMoveIn = (apartment.monthlyRent ?? 0) + (apartment.securityDeposit ?? 0) + (apartment.advanceRent ?? 0);
  const currentNumber = wizardNumber(step);
  const currentTitle = WIZARD_STEPS[currentNumber - 1]?.label;

  return (
    <div className="min-h-screen bg-background">
      {currentTitle ? (
        <FormStepper
          steps={WIZARD_STEPS}
          currentStep={currentNumber}
          furthestStep={furthestStep}
          isDisabled={isSubmitting}
          onStepSelect={handleStepSelect}
          ariaLabel="Application progress"
          stickyClassName={stepperStickyClassName}
        />
      ) : null}

      <div className="mx-auto w-full max-w-3xl px-6 pt-8 pb-12">
        {currentTitle ? (
          <div className="mb-6">
            <h1 className="mb-1 font-nunito text-2xl font-bold text-primary">{currentTitle}</h1>
            <p className="text-sm text-muted-foreground">
              Applying to <span className="font-semibold text-primary">{apartment.name ?? "Listing"}</span>
            </p>
          </div>
        ) : null}

        {/* Normally caught by the Apply Now modal; covers direct links to this page. */}
        {(step === "tenant" || step === "preferences") && !readiness.loading && readiness.upfrontIssues.length > 0 ? (
          <div className="mb-6">
            <ApplicationIssues issues={readiness.upfrontIssues} accountStatus={viewer.accountStatus} />
          </div>
        ) : null}

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
            isPrefilled={prefilled !== null}
            onBack={goBack}
            onNext={() => advanceIfValid(validatePreferences(form, apartment.maxOccupants), "review")}
          />
        )}

        {step === "review" && (
          <ReviewStep
            apartment={apartment}
            accountStatus={viewer.accountStatus}
            form={form}
            sharedPreferences={sharedPreferences}
            totalMoveIn={totalMoveIn}
            readiness={readiness}
            isSubmitting={isSubmitting}
            submitError={submitError}
            onBack={goBack}
            onSubmit={() => void handleSubmit()}
          />
        )}

        {step === "submitted" && <SubmittedStep apartmentName={apartment.name} />}
      </div>

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
              <Modal.Footer className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" fullWidth className="cursor-pointer" onPress={discardModal.close}>
                  Keep Editing
                </Button>
                <Button
                  variant="danger-soft"
                  size="sm"
                  fullWidth
                  className="cursor-pointer"
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
