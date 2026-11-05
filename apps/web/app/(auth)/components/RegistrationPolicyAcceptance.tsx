"use client";

import { Button, Checkbox } from "@heroui/react";
import { IconAlertTriangle, IconInfoCircle } from "@tabler/icons-react";
import { useCallback, useId, useState } from "react";
import { REGISTRATION_POLICIES, type AcceptanceErrors, type RegistrationAcceptance, type RegistrationPolicy } from "@/lib/registration-policies";
import RegistrationPoliciesModal, { preloadRegistrationPolicyContent } from "./RegistrationPoliciesModal";

interface RegistrationPolicyAcceptanceProps {
  value: RegistrationAcceptance;
  onChange: (value: RegistrationAcceptance) => void;
  errors?: AcceptanceErrors;
  isDisabled?: boolean;
}

export default function RegistrationPolicyAcceptance({ value, onChange, errors = {}, isDisabled = false }: RegistrationPolicyAcceptanceProps) {
  const id = useId();
  const hintId = `${id}-reading-hint`;
  const [openPolicy, setOpenPolicy] = useState<RegistrationPolicy | null>(null);
  const [attemptedPolicy, setAttemptedPolicy] = useState<RegistrationPolicy | null>(null);
  const [readVersions, setReadVersions] = useState<Partial<Record<RegistrationPolicy, string>>>({});
  const onRead = useCallback((policy: RegistrationPolicy) => {
    setReadVersions(previous => previous[policy] === REGISTRATION_POLICIES[policy].version
      ? previous : { ...previous, [policy]: REGISTRATION_POLICIES[policy].version });
  }, []);
  const reviewed = {
    privacy: readVersions.privacy === value.privacyVersion && value.privacyVersion === REGISTRATION_POLICIES.privacy.version,
    terms: readVersions.terms === value.termsVersion && value.termsVersion === REGISTRATION_POLICIES.terms.version,
  };
  const warningPolicy = attemptedPolicy && !reviewed[attemptedPolicy] ? attemptedPolicy : null;
  const warningId = `${id}-reading-warning`;
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
                <div className="registration-policy-control-slot">
                  <Checkbox
                    id={`${id}-${policy}-checkbox`}
                    aria-labelledby={labelId}
                    aria-describedby={[!reviewed[policy] ? hintId : null, warningPolicy === policy ? warningId : null, errors[field] ? errorId : null].filter(Boolean).join(" ") || undefined}
                    isSelected={value[field]}
                    onChange={selected => { if (!isDisabled && (!selected || reviewed[policy])) onChange({ ...value, [field]: selected }); }}
                    isDisabled={isDisabled || !reviewed[policy]}
                    isInvalid={!!errors[field]}
                    isRequired
                    validationBehavior="aria"
                  >
                    <Checkbox.Content className="min-h-10 items-center justify-start">
                      <Checkbox.Control><Checkbox.Indicator /></Checkbox.Control>
                    </Checkbox.Content>
                  </Checkbox>
                  {!reviewed[policy] ? <Button type="button" variant="ghost" className="registration-policy-locked-trigger"
                    aria-label={`Review required before accepting the ${info.label}`} aria-describedby={warningPolicy === policy ? `${hintId} ${warningId}` : hintId}
                    isDisabled={isDisabled} onPress={() => { if (!isDisabled) setAttemptedPolicy(policy); }} /> : null}
                </div>
                {/* Reading and accepting are separate actions; keep the
                    dialog button outside the checkbox's pressable label. */}
                <span id={labelId} className="py-2 text-sm font-normal leading-5 text-foreground">
                  <label htmlFor={`${id}-${policy}-checkbox`} className="cursor-pointer"
                    onClick={() => { if (!isDisabled && !reviewed[policy]) setAttemptedPolicy(policy); }}>I have read and agree to the</label>{" "}
                  <Button id={`${id}-${policy}-open`} type="button" variant="ghost" className="registration-policy-link" aria-haspopup="dialog"
                    onHoverStart={preloadRegistrationPolicyContent} onFocus={preloadRegistrationPolicyContent}
                    onPress={() => setOpenPolicy(policy)}>
                    {info.label}
                  </Button>.
                </span>
              </div>
              {warningPolicy === policy ? <p id={warningId} role="alert" className="flex items-start gap-1.5 text-xs leading-5 text-foreground">
                <IconAlertTriangle size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-[#92400E] dark:text-[#FDE047]" />
                <span>Please open the {info.label} and scroll to the end before accepting it.</span>
              </p> : null}
              {errors[field] ? <p id={errorId} role="alert" className="text-sm text-danger">{errors[field]}</p> : null}
            </div>
          );
        })}
      </div>
      {!reviewed.privacy || !reviewed.terms ? <p id={hintId} role="note" className="flex items-start gap-1.5 text-xs leading-5 text-foreground">
        <IconInfoCircle size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-brand" />
        <span>Open each policy and scroll to the end to enable its checkbox.</span>
      </p> : null}
      <input type="hidden" name="privacyAccepted" value={String(value.privacyAccepted)} />
      <input type="hidden" name="termsAccepted" value={String(value.termsAccepted)} />
      <input type="hidden" name="privacyVersion" value={value.privacyVersion} />
      <input type="hidden" name="termsVersion" value={value.termsVersion} />
      {errors.version ? <p role="alert" className="text-sm text-danger">{errors.version}</p> : null}
      <div className="space-y-1 text-xs leading-5 text-muted-foreground">
        <p>False information or fraudulent listings may lead to account suspension or termination.</p>
        <p>Personal data is handled under our Privacy Policy and Philippine data protection laws.</p>
      </div>
      <RegistrationPoliciesModal policy={openPolicy} onPolicyChange={setOpenPolicy} onClose={() => setOpenPolicy(null)} onRead={onRead} reviewed={reviewed} />
    </div>
  );
}
