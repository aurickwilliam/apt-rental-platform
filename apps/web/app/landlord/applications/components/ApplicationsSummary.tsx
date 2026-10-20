import { IconFileText, IconCircleCheck, IconX, IconClock } from "@tabler/icons-react";

interface ApplicationsSummaryProps {
  summary: { total: number; approved: number; rejected: number; pending: number } | null;
}

export default function ApplicationsSummary({ summary }: ApplicationsSummaryProps) {
  const stats = [
    { label: "Total Applications", value: summary?.total, icon: IconFileText, tone: "total" },
    { label: "Approved", value: summary?.approved, icon: IconCircleCheck, tone: "approved" },
    { label: "Rejected", value: summary?.rejected, icon: IconX, tone: "rejected" },
    { label: "Pending", value: summary?.pending, icon: IconClock, tone: "pending" },
  ];
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map(({ label, value, icon: Icon, tone }) => (
        <div key={label} className={`application-summary-card application-summary-${tone}`}>
          <span className="application-summary-icon"><Icon size={26} aria-hidden="true" /></span>
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-1 text-3xl font-nunito font-bold text-card-foreground">{value ?? "—"}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
