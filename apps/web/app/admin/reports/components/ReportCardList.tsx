import Link from "next/link";
import StatusChip from "@/app/components/display/StatusChip";
import { USER_REPORT_TARGET_LABELS } from "@repo/utils";
import { REPORT_ACTION_LABELS, formatReportPerson, getReportReasonLabel } from "@/lib/user-reports";
import {
  reportDateFormatter,
  reportStatusColor,
  type AdminUserReport,
} from "../lib/report-types";
import ReportActions from "./ReportActions";

export default function ReportCardList({ reports }: { reports: AdminUserReport[] }) {
  return (
    <ul className="space-y-2 md:hidden">
      {reports.map((report) => (
        <li key={report.id} className="space-y-3 rounded-xl border border-border bg-card p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              {report.reported ? (
                <Link
                  href={`/admin/users/${report.reported.id}`}
                  className="truncate font-nunito font-bold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  {formatReportPerson(report.reported)}
                </Link>
              ) : (
                <p className="font-nunito font-bold">{formatReportPerson(null)}</p>
              )}
              <p className="truncate text-xs text-muted-foreground">
                By {formatReportPerson(report.reporter)} ·{" "}
                {reportDateFormatter.format(new Date(report.created_at))}
              </p>
            </div>
            <StatusChip size="sm" tone={reportStatusColor(report.status)} className="shrink-0 capitalize">
              {report.status}
            </StatusChip>
          </div>
          <div className="text-sm">
            <p className="font-semibold">{getReportReasonLabel(report.reason)}</p>
            {report.details ? <p className="wrap-break-word text-muted-foreground">{report.details}</p> : null}
            <p className="text-xs text-muted-foreground">
              {USER_REPORT_TARGET_LABELS[report.target_type] ?? "Report"}
              {report.apartment ? (
                <>
                  {" · "}
                  <Link href={`/admin/apartments/${report.apartment.id}`} className="font-semibold text-primary hover:underline">
                    {report.apartment.name}
                  </Link>
                  {report.apartment.is_hidden_by_admin ? " (hidden)" : ""}
                </>
              ) : null}
            </p>
          </div>
          {report.status === "open" ? (
            <ReportActions report={report} />
          ) : report.resolution_note ? (
            <p className="text-xs text-muted-foreground">
              {REPORT_ACTION_LABELS[report.action_taken] ? `${REPORT_ACTION_LABELS[report.action_taken]}. ` : ""}
              Note: {report.resolution_note}
            </p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
