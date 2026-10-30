"use client";

import { Checkbox } from "@heroui/react";
import { useId } from "react";
import Link from "next/link";
import { REGISTRATION_POLICIES, type AcceptanceErrors, type RegistrationAcceptance } from "@/lib/registration-policies";

interface RegistrationPolicyAcceptanceProps {
  value: RegistrationAcceptance;
  onChange: (value: RegistrationAcceptance) => void;
  errors?: AcceptanceErrors;
  isDisabled?: boolean;
}

export default function RegistrationPolicyAcceptance({ value, onChange, errors = {}, isDisabled = false }: RegistrationPolicyAcceptanceProps) {
  const id = useId();
  return (
    <div className="registration-policy-checks w-full space-y-2">
      <div>
        {(["privacy", "terms"] as const).map(policy => {
          const field = policy === "privacy" ? "privacyAccepted" : "termsAccepted";
          const errorId = `${id}-${policy}-error`;
          const labelId = `${id}-${policy}-label`;
          const info = REGISTRATION_POLICIES[policy];
          return (
            <div key={policy} className="space-y-1">
              <div className="flex items-start gap-2">
                <Checkbox
                  aria-labelledby={labelId}
                  aria-describedby={errors[field] ? errorId : undefined}
                  isSelected={value[field]}
                  onChange={selected => onChange({ ...value, [field]: selected })}
                  isDisabled={isDisabled}
                  isInvalid={!!errors[field]}
                  isRequired
                  validationBehavior="aria"
                >
                  <Checkbox.Content className="min-h-11 min-w-11 items-center justify-center">
                    <Checkbox.Control><Checkbox.Indicator /></Checkbox.Control>
                  </Checkbox.Content>
                </Checkbox>
                {/* Outside the pressable label: React Aria consumes a nested
                    link's click, which would prevent opening the policy. */}
                <span id={labelId} className="py-3 text-sm font-normal leading-5 text-foreground">
                  I have read and agree to the{" "}
                  <Link href={info.href} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-primary">
                    {info.label}<span className="sr-only"> (opens in a new tab)</span>
                  </Link>.
                </span>
              </div>
              {errors[field] ? <p id={errorId} role="alert" className="text-sm text-danger">{errors[field]}</p> : null}
            </div>
          );
        })}
      </div>
      <input type="hidden" name="privacyAccepted" value={String(value.privacyAccepted)} />
      <input type="hidden" name="termsAccepted" value={String(value.termsAccepted)} />
      <input type="hidden" name="privacyVersion" value={value.privacyVersion} />
      <input type="hidden" name="termsVersion" value={value.termsVersion} />
      {errors.version ? <p role="alert" className="text-sm text-danger">{errors.version}</p> : null}
      <div className="space-y-1 text-xs leading-5 text-muted-foreground">
        <p>False information or fraudulent listings may lead to account suspension or termination.</p>
        <p>Personal data is handled under our Privacy Policy and Philippine data protection laws.</p>
      </div>
    </div>
  );
}
