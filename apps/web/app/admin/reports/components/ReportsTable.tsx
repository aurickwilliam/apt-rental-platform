import Link from "next/link";
import { Table } from "@heroui/react";
import StatusChip from "@/app/components/display/StatusChip";
import { formatReportPerson, getReportReasonLabel } from "@/lib/user-reports";
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
              <Table.Column isRowHeader>Reported user</Table.Column>
              <Table.Column>Reason</Table.Column>
              <Table.Column>Reported by</Table.Column>
              <Table.Column>Status</Table.Column>
              <Table.Column>When</Table.Column>
              <Table.Column>Review</Table.Column>
            </Table.Header>
            <Table.Body>
              {reports.map((report) => (
                <Table.Row key={report.id} id={report.id}>
                  <Table.Cell className="text-sm">
                    {report.reported ? (
                      <Link href={`/admin/users/${report.reported.id}`} className={LINK_CLASSES}>
                        {formatReportPerson(report.reported)}
                      </Link>
                    ) : (
                      formatReportPerson(null)
                    )}
                    {report.reported?.is_suspended ? (
                      <p className="text-xs text-danger">Suspended</p>
                    ) : null}
                    {report.apartment ? (
                      <p className="text-xs text-muted-foreground">About {report.apartment.name}</p>
                    ) : null}
                  </Table.Cell>
                  <Table.Cell className="max-w-72 text-sm">
                    <p className="font-semibold">{getReportReasonLabel(report.reason)}</p>
                    {report.details ? (
                      <p className="wrap-break-word text-muted-foreground">{report.details}</p>
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
                  <Table.Cell className="text-sm">
                    {report.status === "open" ? (
                      <ReportActions reportId={report.id} />
                    ) : (
                      <span className="text-muted-foreground">{report.resolution_note ?? "—"}</span>
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
