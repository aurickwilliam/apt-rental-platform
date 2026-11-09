"use client";

import { Button, buttonVariants } from "@heroui/react";
import { IconBrandAndroid, IconDeviceMobile } from "@tabler/icons-react";

interface PhoneVerificationMethodsProps {
  isWorking: boolean;
  onContinue: () => void;
  /** Already validated against the existing configured HTTPS APK destination. */
  androidApkUrl: string | null;
}

export default function PhoneVerificationMethods({ isWorking, onContinue, androidApkUrl }: PhoneVerificationMethodsProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-4 rounded-xl border border-primary/30 bg-card p-5 sm:p-6">
        <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <IconDeviceMobile size={18} className="shrink-0 text-primary" aria-hidden="true" />
          Verify with this phone
        </span>
        <p className="text-[13px] leading-6 text-muted-foreground">
          Use your phone&apos;s camera to capture your ID and selfie. No app installation required.
        </p>
        <Button type="button" variant="primary" isPending={isWorking} isDisabled={isWorking} onPress={onContinue} className="min-h-10 w-full text-sm font-semibold">
          Continue verification
        </Button>
      </div>
      {androidApkUrl ? (
        <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5 sm:p-6">
          <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <IconBrandAndroid size={18} className="shrink-0 text-primary" aria-hidden="true" />
            Verify with Android app
          </span>
          <p className="text-[13px] leading-6 text-muted-foreground">Verify using the Android application instead.</p>
          <a href={androidApkUrl} className={buttonVariants({ variant: "outline", className: "min-h-10 w-full text-sm font-semibold" })}>
            Get Android app
          </a>
        </div>
      ) : null}
    </div>
  );
}
