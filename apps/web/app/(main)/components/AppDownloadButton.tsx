"use client";

import Link from "next/link";

import { Button } from "@heroui/react";

import StatusChip from "@/app/components/display/StatusChip";

import { IconBrandAndroid } from "@tabler/icons-react";

interface AppDownloadButtonProps {
  /**
   * When false the APK hasn't been published yet: the button stays visible but
   * disabled, with the neutral chip used elsewhere for unavailable actions.
   */
  isAvailable: boolean;
  /** Primary inside the app section; the hero uses outline. */
  variant?: "outline" | "primary";
}

/**
 * Points at the `/download` route so the published APK URL can change without
 * touching this component. Availability comes from `NEXT_PUBLIC_APT_APK_URL`
 * (read in the page); the moment it is set, the chip disappears and the link
 * starts working — no code change.
 */
export default function AppDownloadButton({
  isAvailable,
  variant = "outline",
}: AppDownloadButtonProps) {
  if (!isAvailable) {
    return (
      <div className="inline-flex flex-wrap items-center gap-2">
        <Button variant={variant} isDisabled>
          <IconBrandAndroid size={18} />
          Download for Android
        </Button>

        <StatusChip tone="neutral" size="sm" className="px-2 py-0.5">
          <span className="font-nunito text-[11px] font-semibold">
            Coming soon
          </span>
        </StatusChip>
      </div>
    );
  }

  return (
    <Link href="/download" prefetch={false} className="inline-flex">
      <Button variant={variant}>
        <IconBrandAndroid size={18} />
        Download for Android
      </Button>
    </Link>
  );
}
