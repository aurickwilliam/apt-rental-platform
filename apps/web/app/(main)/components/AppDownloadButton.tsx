import Link from "next/link";

import { buttonVariants } from "@heroui/react";

import { IconBrandAndroid } from "@tabler/icons-react";

interface AppDownloadButtonProps {
  /** False until an APK link is published; the button is then replaced by a note. */
  isAvailable: boolean;
  variant?: "outline" | "primary";
  /** Render nothing, instead of the note, while no APK is published. */
  hideWhenUnavailable?: boolean;
}

/** Points at the `/download` permalink, which redirects to the published APK. */
export default function AppDownloadButton({ isAvailable, variant = "primary", hideWhenUnavailable = false }: AppDownloadButtonProps) {
  if (!isAvailable) {
    if (hideWhenUnavailable) return null;

    return (
      <p className="inline-flex rounded-full border border-border bg-card px-4 py-2 text-xs font-medium text-foreground">
        Android coming soon
      </p>
    );
  }

  return (
    <Link href="/download" prefetch={false} className={buttonVariants({ variant, className: "landing-cta landing-responsive-cta" })}>
      <IconBrandAndroid size={18} aria-hidden="true" />
      Download for Android
    </Link>
  );
}
