"use client";

import OperationForm from "../../OperationForm";
import { resolveUserReport } from "../../actions/operations";

/** Resolve / Dismiss for an open report (each asks for a review note). */
export default function ReportActions({ reportId }: { reportId: string }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <OperationForm id={reportId} decision="resolve" onSubmit={resolveUserReport} />
      <OperationForm id={reportId} decision="dismiss" onSubmit={resolveUserReport} />
    </div>
  );
}
