import { Table } from "@heroui/react";
import StatusChip from "@/app/components/display/StatusChip";

export interface ReleaseHistoryEntry {
  id: string;
  latestVersion: string;
  minVersion: string;
  apkUrl: string;
  releaseNotes: string | null;
  publishedAt: string;
  publishedBy: string;
}

interface ReleaseHistoryProps {
  entries: ReleaseHistoryEntry[];
  error: boolean;
}

const publishedFormatter = new Intl.DateTimeFormat("en-PH", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Manila",
});

const LINK_CLASSES =
  "font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";

function DownloadLink({ url }: { url: string }) {
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className={LINK_CLASSES}>
      Download link
    </a>
  );
}

function Notes({ value }: { value: string | null }) {
  return value ? (
    <p className="wrap-break-word whitespace-pre-line text-muted-foreground">{value}</p>
  ) : (
    <span className="text-muted-foreground">No notes</span>
  );
}

// The newest entry is always the release apps are reading right now.
export default function ReleaseHistory({ entries, error }: ReleaseHistoryProps) {
  if (error) {
    return (
      <p role="alert" className="text-sm text-danger">
        The release history could not be loaded. Refresh to try again.
      </p>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
        No releases have been published yet. Use Publish release to add the first one.
      </div>
    );
  }

  return (
    <>
      <div className="hidden md:block">
        <Table>
          <Table.ScrollContainer>
            <Table.Content aria-label="Published app releases">
              <Table.Header className="text-foreground! [&_th]:text-foreground!">
                <Table.Column isRowHeader>Version</Table.Column>
                <Table.Column>Required</Table.Column>
                <Table.Column>Published</Table.Column>
                <Table.Column>By</Table.Column>
                <Table.Column>Notes</Table.Column>
                <Table.Column>APK</Table.Column>
              </Table.Header>
              <Table.Body>
                {entries.map((entry, index) => (
                  <Table.Row key={entry.id} id={entry.id}>
                    <Table.Cell className="whitespace-nowrap text-sm font-semibold">
                      <span className="flex items-center gap-2">
                        {entry.latestVersion}
                        {index === 0 ? <StatusChip size="sm" tone="success">Current</StatusChip> : null}
                      </span>
                    </Table.Cell>
                    <Table.Cell className="whitespace-nowrap text-sm">{entry.minVersion}</Table.Cell>
                    <Table.Cell className="whitespace-nowrap text-sm text-muted-foreground">
                      {publishedFormatter.format(new Date(entry.publishedAt))}
                    </Table.Cell>
                    <Table.Cell className="text-sm">{entry.publishedBy}</Table.Cell>
                    <Table.Cell className="max-w-md text-sm"><Notes value={entry.releaseNotes} /></Table.Cell>
                    <Table.Cell className="whitespace-nowrap text-sm"><DownloadLink url={entry.apkUrl} /></Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Content>
          </Table.ScrollContainer>
        </Table>
      </div>

      <ul className="space-y-2 md:hidden">
        {entries.map((entry, index) => (
          <li key={entry.id} className="space-y-2 rounded-xl border border-border bg-card p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-nunito font-bold">Version {entry.latestVersion}</p>
                <p className="text-xs text-muted-foreground">
                  {publishedFormatter.format(new Date(entry.publishedAt))} · {entry.publishedBy}
                </p>
              </div>
              {index === 0 ? <StatusChip size="sm" tone="success" className="shrink-0">Current</StatusChip> : null}
            </div>
            <p className="text-sm text-muted-foreground">Required version {entry.minVersion}</p>
            <div className="text-sm"><Notes value={entry.releaseNotes} /></div>
            <div className="text-sm"><DownloadLink url={entry.apkUrl} /></div>
          </li>
        ))}
      </ul>
    </>
  );
}
