"use client";

import type { AdminUserReport } from "../lib/report-types";
import ReportReviewModal from "./ReportReviewModal";

/** Review button for an open report; the modal holds the details and every action. */
export default function ReportActions({ report }: { report: AdminUserReport }) {
  return <ReportReviewModal report={report} />;
}
