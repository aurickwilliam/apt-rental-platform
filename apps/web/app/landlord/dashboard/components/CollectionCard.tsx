import { ProgressBar } from "@heroui/react";
import { IconCircleCheck, IconWallet } from "@tabler/icons-react";
import { collectionProgress, formatPesoDisplay, type ThisMonthSummary } from "@repo/utils";

const PESO_AMOUNT = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
});

type Props = {
  thisMonth: ThisMonthSummary;
  /** Month the figures cover, e.g. "October 2026". */
  monthLabel: string;
  /** Layout classes from the parent grid (e.g. column span). */
  className?: string;
};

export default function CollectionCard({ thisMonth, monthLabel, className = "" }: Props) {
  const { collected, expected, percent } = collectionProgress(thisMonth);
  const hasExpectedRent = expected > 0;

  return (
    <div
      className={`flex flex-col justify-between gap-6 rounded-xl bg-primary p-5 text-white ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-medium font-nunito">Monthly Collections</h2>
          <p className="text-base text-white/70">{monthLabel}</p>
        </div>
        <IconWallet size={26} className="shrink-0 text-white/80" aria-hidden="true" />
      </div>

      <div className="space-y-3">
        <p className="text-5xl font-semibold font-nunito">{PESO_AMOUNT.format(collected)}</p>

        {hasExpectedRent ? (
          <div className="space-y-2">
            <ProgressBar
              aria-label="Rent collected this month"
              value={percent}
              className="dashboard-meter"
            >
              <ProgressBar.Track>
                <ProgressBar.Fill />
              </ProgressBar.Track>
            </ProgressBar>
            <p className="text-base text-white/80">
              {percent}% of {formatPesoDisplay(expected)} expected
            </p>
          </div>
        ) : (
          <p className="flex items-center gap-2 text-base text-white/90">
            <IconCircleCheck size={20} aria-hidden="true" />
            No rent due this month
          </p>
        )}
      </div>
    </div>
  );
}
