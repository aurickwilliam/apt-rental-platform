import Link from "next/link";
import { Chip } from "@heroui/react";
import { formatReportPerson, getReportReasonLabel } from "@/lib/user-reports";
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
            <Chip size="sm" variant="soft" color={reportStatusColor(report.status)} className="shrink-0 capitalize">
              {report.status}
            </Chip>
          </div>
          <div className="text-sm">
            <p className="font-semibold">{getReportReasonLabel(report.reason)}</p>
            {report.details ? <p className="wrap-break-word text-muted-foreground">{report.details}</p> : null}
            {report.apartment ? (
              <p className="text-xs text-muted-foreground">About {report.apartment.name}</p>
            ) : null}
          </div>
          {report.status === "open" ? (
            <ReportActions reportId={report.id} />
          ) : report.resolution_note ? (
            <p className="text-xs text-muted-foreground">Note: {report.resolution_note}</p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
