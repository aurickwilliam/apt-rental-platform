import { Table } from "@heroui/react";
import StatusChip from "@/app/components/display/StatusChip";
import { USER_REPORT_TARGET_LABELS } from "@repo/utils";
import { REPORT_ACTION_LABELS, formatReportPerson, getReportReasonLabel } from "@/lib/user-reports";
import { reportDateFormatter, reportStatusColor, type AdminUserReport } from "../lib/report-types";

interface ReportsTableProps {
  reports: AdminUserReport[];
  onOpen: (report: AdminUserReport) => void;
}

// Four columns so the table never scrolls sideways; a row opens the full report and its actions.
export default function ReportsTable({ reports, onOpen }: ReportsTableProps) {
  return (
    <div className="hidden md:block">
      <Table>
        <Table.ScrollContainer>
          <Table.Content
            aria-label="User reports"
            onRowAction={(key) => {
              const report = reports.find((row) => row.id === String(key));
              if (report) onOpen(report);
            }}
          >
            <Table.Header className="text-foreground! [&_th]:text-foreground!">
              <Table.Column id="report" isRowHeader>Report</Table.Column>
              <Table.Column id="reported">Reported</Table.Column>
              <Table.Column id="reporter">Reported by</Table.Column>
              <Table.Column id="status">Status</Table.Column>
            </Table.Header>
            <Table.Body>
              {reports.map((report) => (
                <Table.Row
                  key={report.id}
                  id={report.id}
                  textValue={`${USER_REPORT_TARGET_LABELS[report.target_type] ?? "Report"} report: ${getReportReasonLabel(report.reason)}`}
                  className="cursor-pointer hover:bg-primary/10 data-[focus-visible=true]:outline-2 data-[focus-visible=true]:outline-primary"
                >
                  <Table.Cell className="min-w-56 max-w-80 text-sm">
                    <StatusChip size="sm" tone="neutral">
                      {USER_REPORT_TARGET_LABELS[report.target_type] ?? "Report"}
                    </StatusChip>
                    <p className="mt-1.5 font-semibold">{getReportReasonLabel(report.reason)}</p>
                    {report.details ? (
                      <p className="line-clamp-2 wrap-break-word text-xs text-muted-foreground">{report.details}</p>
                    ) : null}
                  </Table.Cell>
                  <Table.Cell className="min-w-44 text-sm">
                    <p className="font-semibold">
                      {formatReportPerson(report.reported)}
                      {report.reported?.is_suspended ? <span className="text-xs font-normal text-danger"> · Suspended</span> : null}
                    </p>
                    {report.apartment ? (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Listing: {report.apartment.name}
                        {report.apartment.is_hidden_by_admin ? <span className="text-danger"> · Hidden</span> : null}
                      </p>
                    ) : null}
                  </Table.Cell>
                  <Table.Cell className="min-w-36 text-sm">{formatReportPerson(report.reporter)}</Table.Cell>
                  <Table.Cell className="min-w-40 text-sm">
                    <StatusChip size="sm" tone={reportStatusColor(report.status)} className="capitalize">
                      {report.status}
                    </StatusChip>
                    <p className="mt-1 whitespace-nowrap text-xs text-muted-foreground">
                      {reportDateFormatter.format(new Date(report.created_at))}
                    </p>
                    {REPORT_ACTION_LABELS[report.action_taken] ? (
                      <p className="mt-0.5 text-xs font-semibold text-foreground">{REPORT_ACTION_LABELS[report.action_taken]}</p>
                    ) : null}
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
