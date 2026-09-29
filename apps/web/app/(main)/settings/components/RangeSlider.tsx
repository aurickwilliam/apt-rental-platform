"use client";

import { Slider } from "@heroui/react";

interface RangeSliderProps {
  value: [number, number];
  onChange: (value: number | number[]) => void;
  min: number;
  max: number;
  step: number;
  className?: string;
}

export function RangeSlider({
  value,
  onChange,
  min,
  max,
  step,
  className,
}: RangeSliderProps) {
  return (
    <Slider
      minValue={min}
      maxValue={max}
      step={step}
      value={value}
      onChange={onChange}
      className={className}
    >
      <Slider.Track>
        {({ state }) => (
          <>
            <Slider.Fill />
            {state.values.map((_, i) => (
              <Slider.Thumb key={i} index={i} />
            ))}
          </>
        )}
      </Slider.Track>
    </Slider>
  );
}