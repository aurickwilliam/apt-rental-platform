import { Suspense } from "react";
import { Skeleton } from "@heroui/react";
import { IconBroadcast } from "@tabler/icons-react";
import CopyButton from "./CopyButton";
import LinkStatus from "./LinkStatus";

export interface LiveRelease {
  latestVersion: string;
  minVersion: string;
  apkUrl: string;
  publishedAt: string | null;
  publishedBy: string | null;
}

const publishedFormatter = new Intl.DateTimeFormat("en-PH", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Manila",
});

export const CARD_CLASSES = "rounded-3xl border border-border bg-card p-4 shadow-none sm:p-5";
export const CARD_HEADING_CLASSES = "flex items-center gap-2 font-nunito text-lg font-bold text-primary";

export default function LiveReleaseCard({ release }: { release: LiveRelease | null }) {
  return (
    <section aria-labelledby="live-release-heading" className={CARD_CLASSES}>
      <h2 id="live-release-heading" className={CARD_HEADING_CLASSES}>
        <IconBroadcast size={20} aria-hidden="true" />
        Live release
      </h2>
      {release ? (
        <div className="mt-3 space-y-3">
          <div>
            <p className="font-nunito text-3xl font-bold text-foreground">{release.latestVersion}</p>
            <p className="text-sm text-muted-foreground">
              Apps below {release.minVersion} are blocked until they update.
            </p>
          </div>
          {release.publishedAt ? (
            <p className="text-xs text-muted-foreground">
              Published {publishedFormatter.format(new Date(release.publishedAt))}
              {release.publishedBy ? ` by ${release.publishedBy}` : ""}
            </p>
          ) : null}
          <div className="flex items-center gap-2">
            <p className="min-w-0 flex-1 truncate rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground" title={release.apkUrl}>
              {release.apkUrl}
            </p>
            <CopyButton value={release.apkUrl} label="Copy download link" />
          </div>
          <Suspense fallback={<Skeleton className="h-6 w-40 rounded-full bg-skeleton!" />}>
            <LinkStatus url={release.apkUrl} />
          </Suspense>
        </div>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">
          Nothing is live yet, so no one sees an update prompt. Publish a release to start.
        </p>
      )}
    </section>
  );
}
