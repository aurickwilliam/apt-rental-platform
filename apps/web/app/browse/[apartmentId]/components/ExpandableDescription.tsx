"use client";

import { useState, type ReactNode } from "react";
import { Button } from "@heroui/react";

import { useTranslation } from "@/app/components/i18n/LocaleProvider";

interface Props {
  text: string;
  maxLength?: number;
  headingIcon?: ReactNode;
}

export default function ExpandableDescription({ text, maxLength = 300, headingIcon }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { t } = useTranslation();

  if (!text) return (
    <div>
      <h3 className="flex items-center gap-2 font-nunito text-lg font-semibold mb-2">{headingIcon}{t("apartment.description.title")}</h3>
      <p className="text-foreground/80 italic">{t("apartment.description.empty")}</p>
    </div>
  );

  const shouldTruncate = text.length > maxLength;
  const displayText = shouldTruncate && !isExpanded ? `${text.slice(0, maxLength)}...` : text;

  return (
    <div>
      <h3 className="flex items-center gap-2 font-nunito text-lg font-semibold mb-2">{headingIcon}{t("apartment.description.title")}</h3>
      <p className="whitespace-pre-line text-foreground/80 leading-relaxed text-sm sm:text-base break-words">{displayText}</p>
      {shouldTruncate && (
        <Button
          onPress={() => setIsExpanded(!isExpanded)}
          variant="ghost"
          className="mt-2 text-brand font-medium text-sm transform -translate-x-4"
        >
          {isExpanded ? t("apartment.description.viewLess") : t("apartment.description.viewMore")}
        </Button>
      )}
    </div>
  );
}
