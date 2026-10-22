import { ProgressBar } from "@heroui/react";
import {
  collectionProgress,
  formatPesoDisplay,
  type ThisMonthSummary,
} from "@repo/utils";

type Props = {
  thisMonth: ThisMonthSummary;
  /** Month the figures cover, e.g. "October 2026". */
  monthLabel: string;
};

export default function CollectionCard({ thisMonth, monthLabel }: Props) {
  const { collected, expected, percent } = collectionProgress(thisMonth);
  const hasExpectedRent = expected > 0;

  return (
    <div className="flex h-full flex-col justify-between gap-6 rounded-xl bg-primary p-5 text-white">
      <div>
        <p className="text-sm text-white/70">Collected in {monthLabel}</p>
        <p className="mt-1 text-4xl font-semibold font-nunito">
          {formatPesoDisplay(collected)}
        </p>
      </div>

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
          <p className="text-sm text-white/80">
            {percent}% of {formatPesoDisplay(expected)} expected
          </p>
        </div>
      ) : (
        <p className="text-sm text-white/80">No rent is due this month.</p>
      )}
    </div>
  );
}
