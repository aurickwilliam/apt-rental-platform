import Link from "next/link";
import { Table } from "@heroui/react";
import StatusChip from "@/app/components/display/StatusChip";
import { USER_REPORT_TARGET_LABELS } from "@repo/utils";
import { REPORT_ACTION_LABELS, formatReportPerson, getReportReasonLabel } from "@/lib/user-reports";
import {
  reportDateFormatter,
  reportStatusColor,
  type AdminUserReport,
} from "../lib/report-types";
import ReportActions from "./ReportActions";

const LINK_CLASSES =
  "font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";

export default function ReportsTable({ reports }: { reports: AdminUserReport[] }) {
  return (
    <div className="hidden md:block">
      <Table>
        <Table.ScrollContainer>
          <Table.Content aria-label="User reports">
            <Table.Header className="text-foreground! [&_th]:text-foreground!">
              <Table.Column isRowHeader>Reported</Table.Column>
              <Table.Column>Reason</Table.Column>
              <Table.Column>Reported by</Table.Column>
              <Table.Column>Status</Table.Column>
              <Table.Column>When</Table.Column>
              <Table.Column>Action</Table.Column>
            </Table.Header>
            <Table.Body>
              {reports.map((report) => (
                <Table.Row key={report.id} id={report.id}>
                  <Table.Cell className="min-w-48 text-sm">
                    <StatusChip size="sm" tone="neutral">
                      {USER_REPORT_TARGET_LABELS[report.target_type] ?? "Report"}
                    </StatusChip>
                    <p className="mt-1.5">
                      {report.reported ? (
                        <Link href={`/admin/users/${report.reported.id}`} className={LINK_CLASSES}>
                          {formatReportPerson(report.reported)}
                        </Link>
                      ) : (
                        formatReportPerson(null)
                      )}
                      {report.reported?.is_suspended ? <span className="text-xs text-danger"> · Suspended</span> : null}
                    </p>
                    {report.apartment ? (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Listing:{" "}
                        <Link href={`/admin/apartments/${report.apartment.id}`} className={LINK_CLASSES}>
                          {report.apartment.name}
                        </Link>
                        {report.apartment.is_hidden_by_admin ? <span className="text-danger"> · Hidden</span> : null}
                      </p>
                    ) : null}
                  </Table.Cell>
                  <Table.Cell className="min-w-56 max-w-80 text-sm">
                    <p className="font-semibold">{getReportReasonLabel(report.reason)}</p>
                    {report.details ? (
                      <p className="line-clamp-2 wrap-break-word text-muted-foreground">{report.details}</p>
                    ) : null}
                  </Table.Cell>
                  <Table.Cell className="text-sm">
                    {report.reporter ? (
                      <Link href={`/admin/users/${report.reporter.id}`} className={LINK_CLASSES}>
                        {formatReportPerson(report.reporter)}
                      </Link>
                    ) : (
                      formatReportPerson(null)
                    )}
                  </Table.Cell>
                  <Table.Cell>
                    <StatusChip size="sm" tone={reportStatusColor(report.status)} className="capitalize">
                      {report.status}
                    </StatusChip>
                  </Table.Cell>
                  <Table.Cell className="whitespace-nowrap text-sm text-muted-foreground">
                    {reportDateFormatter.format(new Date(report.created_at))}
                  </Table.Cell>
                  <Table.Cell className="min-w-40 text-sm">
                    {report.status === "open" ? (
                      <ReportActions report={report} />
                    ) : (
                      <div className="text-muted-foreground">
                        {REPORT_ACTION_LABELS[report.action_taken] ? (
                          <p className="font-semibold text-foreground">{REPORT_ACTION_LABELS[report.action_taken]}</p>
                        ) : null}
                        <p className="line-clamp-2 wrap-break-word">{report.resolution_note ?? "—"}</p>
                      </div>
                    )}
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Content>
        </Table.ScrollContainer>
      </Table>
    </div>
  );
}
