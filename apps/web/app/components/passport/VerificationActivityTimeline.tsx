import { IconCheck, IconClock, IconX } from "@tabler/icons-react";

import { LOCALE_TAGS, translate, type LanguageCode, type TranslationKey } from "@repo/i18n";

import { getServerLocale } from "@/lib/i18n/locale";

export interface VerificationActivityRow {
  status: string;
  submitted_at: string;
  reviewed_at: string | null;
  rejection_reason: string | null;
}

function formatDate(iso: string | null, language: LanguageCode): string | null {
  if (!iso) return null;
  const time = new Date(iso).getTime();
  if (Number.isNaN(time)) return null;
  // Verification timestamps stay pinned to Manila regardless of the server's
  // own time zone, matching the account's local day.
  return new Intl.DateTimeFormat(LOCALE_TAGS[language], {
    dateStyle: "medium",
    timeZone: "Asia/Manila",
  }).format(new Date(time));
}

type Tone = "primary" | "success" | "danger" | "muted";

const TONE_ICON = {
  primary: IconClock,
  success: IconCheck,
  danger: IconX,
  muted: IconCheck,
} as const;

const TONE_STYLES: Record<Tone, string> = {
  primary: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  danger: "bg-danger/10 text-danger",
  muted: "bg-muted text-muted-foreground",
};

interface TimelineEvent {
  key: string;
  title: string;
  tone: Tone;
  date: string | null;
  caption?: string;
  detail?: string | null;
  dimmed?: boolean;
}

/**
 * Compact newest-first activity for the latest verification submission.
 * Every date comes from a persisted row field; states without a recorded
 * timestamp (e.g. awaiting review) render dateless by design.
 */
export default async function VerificationActivityTimeline({
  row,
}: {
  row: VerificationActivityRow;
}) {
  const language = await getServerLocale();
  const t = (key: TranslationKey) => translate(language, key);

  const submittedDate = formatDate(row.submitted_at, language);
  const reviewedDate = formatDate(row.reviewed_at, language);

  const head: TimelineEvent =
    row.status === "approved"
      ? {
          key: "decision",
          title: t("passport.timeline.verified"),
          tone: "success",
          date: reviewedDate,
        }
      : row.status === "rejected"
        ? {
            key: "decision",
            title: t("passport.timeline.rejected"),
            tone: "danger",
            date: reviewedDate,
            detail: row.rejection_reason,
          }
        : {
            key: "current",
            title: t("passport.timeline.awaiting"),
            tone: "primary",
            date: null,
            caption: t("passport.timeline.awaitingCaption"),
          };

  const isApproved = row.status === "approved";

  const events: TimelineEvent[] = [
    {
      key: "submitted",
      title: t("passport.timeline.submitted"),
      // Once approved, the submission recedes: a quiet completed step
      // beneath the emphasized outcome. Pending rows keep the stronger
      // completed marker so progress stays legible mid-flow; the pending
      // date stands alone while rejected rows keep the Completed suffix.
      tone: isApproved ? "muted" : "success",
      date: submittedDate
        ? row.status === "pending"
          ? submittedDate
          : translate(language, "passport.timeline.completed", { date: submittedDate })
        : null,
      dimmed: isApproved,
    },
    head,
  ];

  return (
    <div>
      <h3 className="font-nunito text-sm font-semibold text-foreground">
        {t("passport.timeline.title")}
      </h3>
      <ul className={`mt-3 flex list-none flex-col p-0 ${isApproved ? "gap-2" : "gap-4"}`}>
        {events.map((event, index) => {
          const StatusIcon = TONE_ICON[event.tone];
          return (
            <li key={event.key} className="relative flex gap-3">
              <span className="flex flex-col items-center" aria-hidden="true">
                {event.dimmed ? (
                  <StatusIcon size={14} className="mt-0.5 shrink-0 text-success" />
                ) : (
                  <span
                    className={`flex size-5 shrink-0 items-center justify-center rounded-full ${TONE_STYLES[event.tone]}`}
                  >
                    <StatusIcon size={13} />
                  </span>
                )}
                {index < events.length - 1 && <span className="w-px flex-1 bg-border" />}
              </span>
              <span className="flex min-w-0 flex-col gap-0.5 pb-0.5">
                <span
                  className={`text-[13px] ${
                    event.dimmed
                      ? "font-medium text-muted-foreground"
                      : "font-semibold text-foreground"
                  }`}
                >
                  {event.title}
                </span>
                {event.date && (
                  <span className="text-xs text-muted-foreground">{event.date}</span>
                )}
                {event.caption && (
                  <span className="text-xs text-muted-foreground">{event.caption}</span>
                )}
                {event.detail && (
                  <span className="text-[13px] leading-5 break-words text-muted-foreground">
                    {event.detail}
                  </span>
                )}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
