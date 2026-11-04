import StatusChip from "@/app/components/display/StatusChip";
import { USER_REPORT_TARGET_LABELS } from "@repo/utils";
import { REPORT_ACTION_LABELS, formatReportPerson, getReportReasonLabel } from "@/lib/user-reports";
import { reportDateFormatter, reportStatusColor, type AdminUserReport } from "../lib/report-types";

interface ReportCardListProps {
  reports: AdminUserReport[];
  onOpen: (report: AdminUserReport) => void;
}

export default function ReportCardList({ reports, onOpen }: ReportCardListProps) {
  return (
    <ul className="space-y-2 md:hidden">
      {reports.map((report) => (
        <li key={report.id}>
          <button
            type="button"
            onClick={() => onOpen(report)}
            className="w-full cursor-pointer space-y-2 rounded-xl border border-border bg-card p-3 text-left transition-colors hover:bg-primary/5 focus-visible:outline-2 focus-visible:outline-primary"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <StatusChip size="sm" tone="neutral">
                  {USER_REPORT_TARGET_LABELS[report.target_type] ?? "Report"}
                </StatusChip>
                <p className="mt-1.5 truncate font-nunito font-bold">{formatReportPerson(report.reported)}</p>
                <p className="truncate text-xs text-muted-foreground">
                  By {formatReportPerson(report.reporter)} · {reportDateFormatter.format(new Date(report.created_at))}
                </p>
              </div>
              <StatusChip size="sm" tone={reportStatusColor(report.status)} className="shrink-0 capitalize">
                {report.status}
              </StatusChip>
            </div>
            <div className="text-sm">
              <p className="font-semibold">{getReportReasonLabel(report.reason)}</p>
              {report.details ? (
                <p className="line-clamp-2 wrap-break-word text-xs text-muted-foreground">{report.details}</p>
              ) : null}
              {report.apartment ? (
                <p className="text-xs text-muted-foreground">
                  Listing: {report.apartment.name}
                  {report.apartment.is_hidden_by_admin ? " (hidden)" : ""}
                </p>
              ) : null}
              {REPORT_ACTION_LABELS[report.action_taken] ? (
                <p className="text-xs font-semibold">{REPORT_ACTION_LABELS[report.action_taken]}</p>
              ) : null}
            </div>
          </button>
        </li>
      ))}
    </ul>
  );
}
