import StatusChip from "@/app/components/display/StatusChip";
import { checkDownloadLink, formatBytes } from "@/lib/app-release-link";

// Streamed behind Suspense so the page never waits on GitHub.
export default async function LinkStatus({ url }: { url: string }) {
  const check = await checkDownloadLink(url);
  if (check.state === "ok") {
    return (
      <StatusChip tone="success">
        Link works{check.bytes ? ` · ${formatBytes(check.bytes)}` : ""}
      </StatusChip>
    );
  }
  if (check.state === "missing") {
    return <StatusChip tone="danger">{`Link returns ${check.status}: upload the APK to GitHub`}</StatusChip>;
  }
  return <StatusChip tone="warning">Link could not be checked</StatusChip>;
}
