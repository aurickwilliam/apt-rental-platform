"use client";

import { IconStarFilled } from "@tabler/icons-react";
import { Button } from "@heroui/react";

import { useTranslation } from "@/app/components/i18n/LocaleProvider";

const STAR_SIZE = 40;

interface StarRatingInputProps {
  value: number;
  onChange: (value: number) => void;
}

export default function StarRatingInput({ value, onChange }: StarRatingInputProps) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-2">
      {[1, 2, 3, 4, 5].map((i) => {
        const filled = value >= i;
        const half = !filled && value >= i - 0.5;

        return (
          <Button
            variant="ghost"
            key={i}
            aria-label={i === 1 ? t("reviews.form.starAria", { count: i }) : t("reviews.form.starAriaPlural", { count: i })}
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = e.clientX - rect.left;
              const isHalf = x < rect.width / 2;
              onChange(isHalf ? i - 0.5 : i);
            }}
            className="button--bare relative inline-flex cursor-pointer p-0"
          >
            <IconStarFilled size={STAR_SIZE} className="text-grey-300" />

            {(filled || half) && (
              <span
                className={`absolute inset-0 overflow-hidden ${half ? "w-1/2" : "w-full"}`}
              >
                <IconStarFilled size={STAR_SIZE} className="text-rating" />
              </span>
            )}
          </Button>
        );
      })}
    </div>
  );
}
