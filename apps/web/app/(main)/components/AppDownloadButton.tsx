import StatusChip from "@/app/components/display/StatusChip";

import { IconBrandAndroid } from "@tabler/icons-react";

import LandingCta from "./LandingCta";

interface AppDownloadButtonProps {
  /** False until an APK link is published; the button is then replaced by a note. */
  isAvailable: boolean;
  variant?: "outline" | "primary";
  /** Render nothing, instead of the note, while no APK is published. */
  hideWhenUnavailable?: boolean;
}

/** Points at the `/download` permalink, which streams the published APK as a download. */
export default function AppDownloadButton({ isAvailable, variant = "primary", hideWhenUnavailable = false }: AppDownloadButtonProps) {
  if (!isAvailable) {
    if (hideWhenUnavailable) return null;

    return (
      <StatusChip tone="neutral" size="lg">
        Android coming soon
      </StatusChip>
    );
  }

  return (
    <LandingCta href="/download" variant={variant} isExternalRedirect>
      <IconBrandAndroid size={18} aria-hidden="true" />
      Download for Android
    </LandingCta>
  );
}
