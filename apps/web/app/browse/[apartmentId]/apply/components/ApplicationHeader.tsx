"use client";

import CircleProgress from "./CircleProgress";
import { Card } from "@heroui/react";

interface ApplicationHeaderProps {
  currentTitle: string;
  nextTitle: string;
  step: number;
  totalSteps?: number;
}

export default function ApplicationHeader({
  currentTitle,
  nextTitle,
  step = 1,
  totalSteps = 4,
}: ApplicationHeaderProps) {
  return (
    <Card className="bg-[#F8F9FA] md:bg-surface border shadow-none p-5 flex flex-row items-center justify-between">
      <div className="flex-1 flex flex-col gap-1 min-w-0 pr-4">
        <h2 className="text-2xl font-nunito font-bold text-black leading-none">{currentTitle}</h2>
        <p className="text-base font-nunito font-semibold text-grey-700">Next: {nextTitle}</p>
      </div>
      <div className="hidden md:block">
        <CircleProgress currentStep={step} totalSteps={totalSteps} size={96} />
      </div>
      <div className="md:hidden">
        <CircleProgress currentStep={step} totalSteps={totalSteps} size={72} />
      </div>
    </Card>
  );
}
