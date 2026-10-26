import { IconDownload, IconEye } from "@tabler/icons-react";
import { CARD_CLASSES, CARD_HEADING_CLASSES } from "./LiveReleaseCard";

export interface PreviewRelease {
  latestVersion: string;
  minVersion: string;
  releaseNotes: string | null;
}

const PREVIEW_FRAME = "rounded-2xl border border-border bg-background p-3";
const MINI_BUTTON = "flex h-8 flex-1 items-center justify-center gap-1 rounded-full text-xs font-semibold";

// Static miniatures of the two mobile screens (AppUpdateDialog, AppUpdateRequiredScreen), filled with the live values.
export default function UserPreviewCard({ release }: { release: PreviewRelease | null }) {
  const hasOptionalWindow = release ? release.minVersion !== release.latestVersion : false;
  return (
    <section aria-labelledby="user-preview-heading" className={CARD_CLASSES}>
      <h2 id="user-preview-heading" className={CARD_HEADING_CLASSES}>
        <IconEye size={20} aria-hidden="true" />
        What users see
      </h2>
      {release ? (
        <div className="mt-3 space-y-4">
          <figure className="space-y-2">
            <figcaption className="text-xs text-muted-foreground">
              {hasOptionalWindow
                ? `Apps from ${release.minVersion} up to ${release.latestVersion}: a dialog they can dismiss.`
                : "Never shown: the required version equals the latest, so every older app is blocked."}
            </figcaption>
            <div className={`${PREVIEW_FRAME} space-y-2 ${hasOptionalWindow ? "" : "opacity-50"}`} aria-hidden="true">
              <p className="font-nunito text-sm font-bold text-foreground">A new version is available</p>
              <p className="text-xs text-muted-foreground">APT {release.latestVersion} is ready to install.</p>
              {release.releaseNotes ? (
                <p className="line-clamp-3 whitespace-pre-line text-xs text-foreground">{release.releaseNotes}</p>
              ) : null}
              <div className="flex gap-2 pt-1">
                <span className={`${MINI_BUTTON} bg-primary text-primary-foreground`}>
                  <IconDownload size={12} /> Update
                </span>
                <span className={`${MINI_BUTTON} bg-muted text-foreground`}>Maybe later</span>
              </div>
            </div>
          </figure>

          <figure className="space-y-2">
            <figcaption className="text-xs text-muted-foreground">
              Apps below {release.minVersion}: a full screen they cannot close.
            </figcaption>
            <div className={`${PREVIEW_FRAME} flex flex-col items-center gap-2 py-5 text-center`} aria-hidden="true">
              <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <IconDownload size={22} />
              </span>
              <p className="font-nunito text-sm font-bold text-foreground">Update required</p>
              <p className="text-xs text-muted-foreground">
                This version of APT is no longer supported. Install version {release.latestVersion} to keep using the app.
              </p>
              <span className={`${MINI_BUTTON} w-full flex-none bg-primary text-primary-foreground`}>
                <IconDownload size={12} /> Update
              </span>
            </div>
          </figure>
        </div>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">Publish a release to preview what users will see.</p>
      )}
    </section>
  );
}
