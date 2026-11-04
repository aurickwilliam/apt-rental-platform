"use client";

import { Button } from "@heroui/react";
import { IconCircleCheck } from "@tabler/icons-react";

export interface FormStepperStep {
  /** Full step name, for screen readers. */
  label: string;
  /** Short name shown under the circle from `sm` up. Must be unique. */
  short: string;
}

interface FormStepperProps {
  steps: readonly FormStepperStep[];
  /** 1-based number of the step on screen. */
  currentStep: number;
  /** 1-based number of the furthest step reached; later steps stay disabled. */
  furthestStep: number;
  /** Locks every step, for example while saving. */
  isDisabled?: boolean;
  onStepSelect: (step: number) => void;
  ariaLabel: string;
  /**
   * Sticky offset. The default clears the portal's mobile top bar; pages under
   * the public navbar pass that navbar's height instead.
   */
  stickyClassName?: string;
}

/**
 * Sticky circle-and-label progress for multi-step web forms (add listing,
 * rental application). The caller owns navigation and validation.
 */
export default function FormStepper({
  steps,
  currentStep,
  furthestStep,
  isDisabled = false,
  onStepSelect,
  ariaLabel,
  stickyClassName = "top-14 md:top-0",
}: FormStepperProps) {
  return (
    <nav aria-label={ariaLabel} className={`sticky z-30 border-b border-border bg-background px-6 py-4 ${stickyClassName}`}>
      <ol className="flex items-center justify-between">
        {steps.map((step, index) => {
          const number = index + 1;
          const isActive = currentStep === number;
          const isDone = currentStep > number;
          const isLocked = isDisabled || number > furthestStep;

          return (
            <li key={step.short} className="relative min-w-0 flex-1">
              <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-6 flex -translate-y-1/2 items-center">
                <div
                  className={`h-0.5 flex-1 transition-colors ${index === 0 ? "invisible" : isDone || isActive ? "bg-primary" : "bg-border"}`}
                />
                <div className="w-8 shrink-0" />
                <div
                  className={`h-0.5 flex-1 transition-colors ${index === steps.length - 1 ? "invisible" : isDone ? "bg-primary" : "bg-border"}`}
                />
              </div>

              <Button
                variant="ghost"
                className={`form-stepper-step ${isLocked ? "" : "cursor-pointer"}`}
                aria-label={`Step ${number}: ${step.label}`}
                aria-current={isActive ? "step" : undefined}
                isDisabled={isLocked}
                onPress={() => onStepSelect(number)}
              >
                <span
                  aria-hidden="true"
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-all ${
                    isDone
                      ? "bg-primary text-white"
                      : isActive
                        ? "bg-primary text-white ring-4 ring-primary/20"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {isDone ? <IconCircleCheck size={16} /> : number}
                </span>

                <span
                  className={`hidden text-center font-nunito text-xs transition-colors sm:block ${
                    isActive ? "font-medium text-primary" : isDone ? "text-primary/60" : "text-muted-foreground"
                  }`}
                >
                  {step.short}
                </span>
              </Button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
