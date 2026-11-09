"use client";

import { Button } from "@heroui/react";
import { IconCircleCheck } from "@tabler/icons-react";
import CameraCapture from "./CameraCapture";
import MobileVerificationNavigation from "./MobileVerificationNavigation";

interface MobileVerificationPhotoStepProps {
  capture: { url: string } | null;
  label: string;
  facing: "environment" | "user";
  guide: string;
  onCapture: (file: File) => void;
  onRetake: () => void;
  onBack: () => void;
  onContinue: () => void;
}

export default function MobileVerificationPhotoStep({ capture, label, facing, guide, onCapture, onRetake, onBack, onContinue }: MobileVerificationPhotoStepProps) {
  if (!capture) return <CameraCapture facing={facing} guide={guide} onCapture={onCapture} onCancel={onBack} mobileNavigation />;
  return (
    <>
      <p className="mobile-verification-description">Check that this photo is clear before continuing.</p>
      {/* Captured object URL only; no file-picker input on the mobile route. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={capture.url} alt={`${label} preview`} className="mobile-verification-photo" />
      <div className="mobile-verification-photo-status">
        <span><IconCircleCheck size={18} aria-hidden="true" />Photo captured</span>
        <Button type="button" variant="outline" size="sm" onPress={onRetake} aria-label={`Retake ${label}`}>Retake</Button>
      </div>
      <MobileVerificationNavigation onBack={onBack} onContinue={onContinue} />
    </>
  );
}
