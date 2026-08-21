"use client";

import { Star } from "lucide-react";

const STAR_SIZE = 40;

interface StarRatingInputProps {
  value: number;
  onChange: (value: number) => void;
}

export default function StarRatingInput({ value, onChange }: StarRatingInputProps) {
  return (
    <div className="flex items-center gap-2">
      {[1, 2, 3, 4, 5].map((i) => {
        const filled = value >= i;
        const half = !filled && value >= i - 0.5;

        return (
          <button
            key={i}
            type="button"
            aria-label={`Rate ${i} star${i !== 1 ? "s" : ""}`}
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = e.clientX - rect.left;
              const isHalf = x < rect.width / 2;
              onChange(isHalf ? i - 0.5 : i);
            }}
            className="relative inline-flex cursor-pointer p-0"
          >
            <Star size={STAR_SIZE} className="text-grey-300" fill="currentColor" strokeWidth={1.25} />

            {(filled || half) && (
              <span
                className={`absolute inset-0 overflow-hidden ${half ? "w-1/2" : "w-full"}`}
              >
                <Star size={STAR_SIZE} className="text-secondary" fill="currentColor" strokeWidth={1.25} />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}