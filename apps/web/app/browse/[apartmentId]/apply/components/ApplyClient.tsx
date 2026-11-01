"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Modal, useOverlayState } from "@heroui/react";
import { IconArrowLeft } from "@tabler/icons-react";

import type { TranslationKey } from "@repo/i18n";

import { useTranslation } from "@/app/components/i18n/LocaleProvider";
import { useApplicationReadiness } from "@/hooks/use-application-readiness";
import { useSubmitApplication } from "@/hooks/use-submit-application";

import type { ApplicantPersonalInfo } from "@/lib/application-profile";

import type { ApplyViewer } from "../lib/load-apply-page";
import { validatePreferences, validateTenantInfo } from "../lib/validate-application";
import {
  EMPTY_APPLICATION_FORM,
  type ApplicationErrors,
  type ApplicationForm,
  type ApplyApartmentContext,
} from "../types";
import ApplicationHeader from "./ApplicationHeader";
import ApplicationIssues from "./ApplicationIssues";
import PreferencesStep from "./steps/PreferencesStep";
import ReviewStep from "./steps/ReviewStep";
import SubmittedStep from "./steps/SubmittedStep";
import TenantInfoStep from "./steps/TenantInfoStep";

type Step = "tenant" | "preferences" | "review" | "submitted";

// The three form steps; mobile's `ApplicationHeader` counts the same.
const WIZARD: Partial<
  Record<Step, { index: number; currentTitleKey: TranslationKey; nextTitleKey: TranslationKey }>
> = {
  tenant: {
    index: 1,
    currentTitleKey: "apply.step.tenant",
    nextTitleKey: "apply.step.preferences",
  },
  preferences: {
    index: 2,
    currentTitleKey: "apply.step.preferences",
    nextTitleKey: "apply.step.review",
  },
  review: {
    index: 3,
    currentTitleKey: "apply.step.review",
    nextTitleKey: "apply.step.submit",
  },
};
const WIZARD_STEP_COUNT = 3;
const PREVIOUS_STEP: Partial<Record<Step, Step>> = { preferences: "tenant", review: "preferences" };

interface ApplyClientProps {
  apartment: ApplyApartmentContext;
  viewer: ApplyViewer;
  hasActiveApplication: boolean;
  personalInfo: ApplicantPersonalInfo;
}

/**
 * Apply flow: tenant info → preferences → review → submitted. The summary
 * (move-in cost + readiness) is the apartment page's Apply Now modal
 * (`ApplyStartModal`). There is no upload step: the APT Passport is attached
 * by reference.
 */
export default function ApplyClient({ apartment, viewer, hasActiveApplication, personalInfo }: ApplyClientProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const discardModal = useOverlayState();
  const [step, setStep] = useState<Step>("tenant");
  const [form, setForm] = useState<ApplicationForm>(() => ({ ...EMPTY_APPLICATION_FORM, ...personalInfo }));
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
    else discardModal.open();
  };

  const handleSubmit = async () => {
    const result = await submit(apartment.id, form);
    if (!result.success) return;
    goTo("submitted");
  };

  const totalMoveIn = (apartment.monthlyRent ?? 0) + (apartment.securityDeposit ?? 0) + (apartment.advanceRent ?? 0);
  const wizard = WIZARD[step];

  return (
    <div className="mx-auto w-full max-w-7xl p-4 pb-12 md:p-6">
      <div className="mb-4 flex items-center gap-2">
        {step !== "submitted" ? (
          <Button variant="outline" size="sm" isDisabled={isSubmitting} onPress={goBack}>
            <IconArrowLeft size={16} />
            {t("apply.back")}
          </Button>
        ) : null}
        <div className="ml-auto hidden text-xs text-muted-foreground md:block">
          {t("apply.applyingTo")}{" "}
          <span className="font-semibold text-primary">{apartment.name ?? t("apply.listingFallback")}</span>
        </div>
      </div>

      {wizard ? (
        <div className="mb-6">
          <ApplicationHeader
            currentTitle={t(wizard.currentTitleKey)}
            nextTitle={t(wizard.nextTitleKey)}
            step={wizard.index}
            totalSteps={WIZARD_STEP_COUNT}
          />
        </div>
      ) : null}

      {/* Normally caught by the Apply Now modal; covers direct links to this page. */}
      {(step === "tenant" || step === "preferences") && !readiness.loading && readiness.upfrontIssues.length > 0 ? (
        <div className="mb-6">
          <ApplicationIssues issues={readiness.upfrontIssues} />
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
          onBack={goBack}
          onNext={() => advanceIfValid(validatePreferences(form, apartment.maxOccupants, t), "review")}
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
