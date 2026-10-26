import { IconCircleCheck, IconCircleX, IconMinus } from "@tabler/icons-react";

import type { TranslationKey } from "@repo/i18n";
import type { usePasswordValidation } from "@repo/hooks";

import { useTranslation } from "@/app/components/i18n/LocaleProvider";

type PasswordRequirements = ReturnType<typeof usePasswordValidation>["passwordRequirements"];

// Same requirements and wording as mobile (components/inputs/NewPasswordFields).
const REQUIREMENT_KEYS: {
  key: keyof PasswordRequirements;
  labelKey: TranslationKey;
}[] = [
  { key: "minLength", labelKey: "auth.passwordRule.minLength" },
  { key: "hasLowercase", labelKey: "auth.passwordRule.lowercase" },
  { key: "hasUppercase", labelKey: "auth.passwordRule.uppercase" },
  { key: "hasNumber", labelKey: "auth.passwordRule.number" },
  { key: "hasSpecialChar", labelKey: "auth.passwordRule.special" },
  { key: "passwordsMatch", labelKey: "auth.passwordRule.match" },
];

interface PasswordRequirementListProps {
  requirements: PasswordRequirements;
  hasInput: boolean;
}

export default function PasswordRequirementList({ requirements, hasInput }: PasswordRequirementListProps) {
  const { t } = useTranslation();

  return (
    <ul className="flex flex-col gap-3" aria-label={t("auth.passwordRule.aria")}>
      {REQUIREMENT_KEYS.map(({ key, labelKey }) => {
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
              {t(labelKey)}
              <span className="sr-only">
                {isMet ? t("auth.passwordRule.met") : t("auth.passwordRule.notMet")}
              </span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}
