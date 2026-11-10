"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Modal, useOverlayState } from "@heroui/react";

import { describeApplicationPreferences } from "@repo/utils";
import type { TranslationKey } from "@repo/i18n";

import FormStepper from "@/app/components/layout/FormStepper";
import { useTranslation } from "@/app/components/i18n/LocaleProvider";
import { useApplicationReadiness } from "@/hooks/use-application-readiness";
import { useSubmitApplication } from "@/hooks/use-submit-application";

import type { ApplicantPersonalInfo } from "@/lib/application-profile";
import { applicationFormDefaultsFromPreferences, buildApplicationSnapshotFromForm } from "@/lib/application-form-preferences";
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
const WIZARD_STEP_KEYS = {
  tenant: { labelKey: "apply.step.tenant", shortKey: "apply.step.tenant.short" },
  preferences: { labelKey: "apply.step.preferences", shortKey: "apply.step.preferences.short" },
  review: { labelKey: "apply.step.review", shortKey: "apply.step.review.short" },
} as const satisfies Record<
  Exclude<Step, "submitted">,
  { labelKey: TranslationKey; shortKey: TranslationKey }
>;
const WIZARD_STEPS = (["tenant", "preferences", "review"] as const).map((key) => ({
  key,
  ...WIZARD_STEP_KEYS[key],
}));
const PREVIOUS_STEP: Partial<Record<Step, Step>> = { preferences: "tenant", review: "preferences" };

/** 1-based position in the stepper; 0 once submitted, which has no stepper. */
function wizardNumber(step: Step): number {
  return WIZARD_STEPS.findIndex(({ key }) => key === step) + 1;
}

interface ApplyClientProps {
  apartment: ApplyApartmentContext;
  viewer: ApplyViewer;
  hasActiveApplication: boolean;
  hasActiveTenancy: boolean;
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
  hasActiveTenancy,
  personalInfo,
  savedPreferences,
  stepperStickyClassName,
}: ApplyClientProps) {
  const router = useRouter();
  const discardModal = useOverlayState();
  const [step, setStep] = useState<Step>("tenant");
  const [furthestStep, setFurthestStep] = useState(1);
  // The pets, parking, smoking and disability questions (and their details)
  // start from the saved preferences; the tenant can change any answer for this
  // application.
  const prefilled = useMemo(() => applicationFormDefaultsFromPreferences(savedPreferences), [savedPreferences]);
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
    hasActiveTenancy,
    // Proof of income only counts once the employment type is known.
    employmentType: form.employmentType || null,
  });
  const { language, t } = useTranslation();
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
      const tenantErrors = validateTenantInfo(form, t);
      if (Object.keys(tenantErrors).length > 0) {
        goTo("tenant");
        setErrors(tenantErrors);
        return;
      }
      if (target === "review") {
        const preferenceErrors = validatePreferences(form, apartment.maxOccupants, t);
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

  // What the landlord will see of the declared details, for the review step.
  const preferenceLines = useMemo(() => {
    return describeApplicationPreferences(buildApplicationSnapshotFromForm(form), language);
  }, [form, language]);

  const totalMoveIn = (apartment.monthlyRent ?? 0) + (apartment.securityDeposit ?? 0) + (apartment.advanceRent ?? 0);
  const currentNumber = wizardNumber(step);
  const translatedSteps = WIZARD_STEPS.map((s) => ({
    key: s.key,
    label: t(s.labelKey),
    short: t(s.shortKey),
  }));
  const currentTitle = translatedSteps[currentNumber - 1]?.label;

  return (
    <div className="min-h-screen bg-background">
      {currentTitle ? (
        <FormStepper
          steps={translatedSteps}
          currentStep={currentNumber}
          furthestStep={furthestStep}
          isDisabled={isSubmitting}
          onStepSelect={handleStepSelect}
          ariaLabel={t("apply.progress", { current: currentNumber, total: 3 })}
          stickyClassName={stepperStickyClassName}
        />
      ) : null}

      <div className="mx-auto w-full max-w-3xl px-6 pt-8 pb-12">
        {currentTitle ? (
          <div className="mb-6">
            <h1 className="mb-1 font-nunito text-2xl font-bold text-primary">{currentTitle}</h1>
            <p className="text-sm text-muted-foreground">
              {t("apply.applyingTo")} <span className="font-semibold text-primary">{apartment.name ?? t("apply.listingFallback")}</span>
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
            onNext={() => advanceIfValid(validateTenantInfo(form, t), "preferences")}
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
            onNext={() => advanceIfValid(validatePreferences(form, apartment.maxOccupants, t), "review")}
          />
        )}

        {step === "review" && (
          <ReviewStep
            apartment={apartment}
            accountStatus={viewer.accountStatus}
            form={form}
            preferenceLines={preferenceLines}
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
                <Modal.Heading>{t("apply.discard.title")}</Modal.Heading>
              </Modal.Header>
              <Modal.Body>
                <p className="text-sm text-muted-foreground">
                  {t("apply.discard.body")}
                </p>
              </Modal.Body>
              <Modal.Footer className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" fullWidth className="cursor-pointer" onPress={discardModal.close}>
                  {t("apply.discard.keepEditing")}
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
                  {t("apply.discard.confirm")}
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </div>
  );
}
