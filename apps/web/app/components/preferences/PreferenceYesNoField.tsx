"use client";

import { useId } from "react";
import type { ReactNode } from "react";

import { useTranslation } from "@/app/components/i18n/LocaleProvider";

import PreferenceOptionCard from "./PreferenceOptionCard";

interface PreferenceYesNoFieldProps {
  label: string;
  /** null while the question is unanswered, so neither option is preselected. */
  value: boolean | null;
  onChange: (value: boolean) => void;
  icon?: ReactNode;
  /** Shows the required marker; the caller owns validation. */
  required?: boolean;
  /** Validation message shown under the options. */
  error?: string;
}

/**
 * Yes/No choice drawn as option cards, so it never reads as the Back/Continue
 * action buttons. Shared by the personalization wizard and the rental application.
 */
export default function PreferenceYesNoField({
  label,
  value,
  onChange,
  icon,
  required = false,
  error,
}: PreferenceYesNoFieldProps) {
  const { t } = useTranslation();
  const labelId = useId();
  const errorId = useId();

  return (
    <div className="flex flex-col gap-2">
      <p id={labelId} className="flex items-center gap-2 text-sm font-semibold text-foreground">
        {icon && (
          <span className="shrink-0 text-primary" aria-hidden="true">
            {icon}
          </span>
        )}
        <span>
          {label}
          {required ? (
            <>
              {" "}
              <span className="text-danger" aria-hidden="true">*</span>
            </>
          ) : null}
        </span>
      </p>
      <div
        className="grid grid-cols-2 gap-2.5"
        role="group"
        aria-labelledby={labelId}
        aria-describedby={error ? errorId : undefined}
      >
        {[
          { option: true, text: t("common.yes") },
          { option: false, text: t("common.no") },
        ].map(({ option, text }) => (
          <PreferenceOptionCard
            key={text}
            compact
            label={text}
            selected={value === option}
            onPress={() => onChange(option)}
          />
        ))}
      </div>
      {error ? (
        <p id={errorId} role="alert" className="text-xs text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
