"use client";

import OperationForm from "../../OperationForm";
import { actOnUserReport, resolveUserReport } from "../../actions/operations";
import type { AdminUserReport } from "../lib/report-types";

/**
 * Actions for an open report. Warn, hide and suspend close the report in the
 * same audited step; Resolve and Dismiss only close it. Hide is offered for
 * listing reports (until the listing is already hidden), suspend until the
 * account is suspended.
 */
export default function ReportActions({ report }: { report: AdminUserReport }) {
  const canHideListing = Boolean(report.apartment) && !report.apartment?.is_hidden_by_admin;
  const canSuspend = Boolean(report.reported) && !report.reported?.is_suspended;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {report.reported ? (
        <OperationForm id={report.id} decision="warn" label="Warn" onSubmit={actOnUserReport} />
      ) : null}
      {canHideListing ? (
        <OperationForm id={report.id} decision="hide_listing" label="Hide listing" onSubmit={actOnUserReport} />
      ) : null}
      {canSuspend ? (
        <OperationForm id={report.id} decision="suspend_user" label="Suspend account" onSubmit={actOnUserReport} />
      ) : null}
      <OperationForm id={report.id} decision="resolve" onSubmit={resolveUserReport} />
      <OperationForm id={report.id} decision="dismiss" onSubmit={resolveUserReport} />
    </div>
  );
}
