import { IconCircleCheck, IconCircleX, IconMinus } from "@tabler/icons-react";

import type { usePasswordValidation } from "@repo/hooks";

type PasswordRequirements = ReturnType<typeof usePasswordValidation>["passwordRequirements"];

// Same requirements and wording as mobile (components/inputs/NewPasswordFields).
const REQUIREMENT_LABELS: { key: keyof PasswordRequirements; label: string }[] = [
  { key: "minLength", label: "At least 8 characters" },
  { key: "hasLowercase", label: "At least one lowercase letter (a–z)" },
  { key: "hasUppercase", label: "At least one uppercase letter (A–Z)" },
  { key: "hasNumber", label: "At least one number (0–9)" },
  { key: "hasSpecialChar", label: "At least one special character (e.g. ! @ # $ % ^ & *)" },
  { key: "passwordsMatch", label: "Passwords match" },
];

interface PasswordRequirementListProps {
  requirements: PasswordRequirements;
  hasInput: boolean;
}

export default function PasswordRequirementList({ requirements, hasInput }: PasswordRequirementListProps) {
  return (
    <ul className="flex flex-col gap-3" aria-label="Password requirements">
      {REQUIREMENT_LABELS.map(({ key, label }) => {
        const isMet = requirements[key];
        return (
          <li key={key} className="flex items-center gap-2">
            {!hasInput ? (
              <IconMinus size={20} className="shrink-0 text-gray-400" aria-hidden="true" />
            ) : isMet ? (
              <IconCircleCheck size={20} className="shrink-0 text-green-500" aria-hidden="true" />
            ) : (
              <IconCircleX size={20} className="shrink-0 text-red-500" aria-hidden="true" />
            )}
            <span className="text-sm text-gray-600 dark:text-muted-foreground">
              {label}
              <span className="sr-only">{isMet ? ": met" : ": not met"}</span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}
