import { Card, Skeleton } from "@heroui/react";
import { IconMessage, IconStar } from "@tabler/icons-react";

const RATING_ROW_COUNT = 5;
const REVIEW_COUNT = 4;

function Sk({ className }: { className: string }) {
  return <Skeleton className={`bg-grey-300! ${className}`} />;
}

export default function ReviewsSkeleton() {
  return (
    <div className="w-full min-w-0 p-4 md:p-6 flex flex-col gap-4 bg-card min-h-0" aria-busy="true" aria-label="Loading property reviews">
      <div>
        <Sk className="h-8 w-36 rounded-lg" />
        <h1 className="mt-2 text-2xl font-bold font-nunito text-card-foreground">Property Reviews</h1>
        <div aria-hidden="true"><Sk className="mt-1 h-5 w-72 max-w-full rounded-lg" /></div>
      </div>
      <div className="grid min-w-0 items-start gap-4 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)]" aria-hidden="true">
        <Card className="landlord-reviews-panel border border-border">
          <div className="flex items-center gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary"><IconStar size={24} /></span>
            <div>
              <h2 className="text-base font-nunito font-bold text-card-foreground">Rating Summary</h2>
              <p className="text-xs text-muted-foreground">An overview of tenant ratings.</p>
            </div>
          </div>
          <div className="flex flex-col items-center gap-3 py-3">
            <Sk className="h-16 w-24 rounded-lg" />
            <Sk className="h-6 w-40 rounded-lg" />
            <Sk className="h-10 w-44 rounded-lg" />
          </div>
          <div className="space-y-3">
            {Array.from({ length: RATING_ROW_COUNT }, (_, index) => (
              <div key={index} className="flex items-center gap-2">
                <Sk className="h-5 w-8 rounded-lg" />
                <Sk className="h-2 flex-1 rounded-full" />
                <Sk className="h-5 w-16 rounded-lg" />
              </div>
            ))}
          </div>
        </Card>
        <div className="flex min-w-0 flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary"><IconMessage size={24} /></span>
              <div>
                <h2 className="text-base font-nunito font-bold text-card-foreground">Tenant Reviews</h2>
                <Sk className="h-4 w-20 rounded-lg" />
              </div>
            </div>
            <Sk className="h-8 w-36 rounded-full" />
          </div>
          <div className="grid min-w-0 grid-cols-1 items-start gap-4 2xl:grid-cols-2">
            {Array.from({ length: REVIEW_COUNT }, (_, index) => (
              <Card key={index} className="landlord-reviews-panel border border-border">
                <div className="flex flex-wrap items-center gap-3">
                  <Sk className="size-10 shrink-0 rounded-full" />
                  <div className="min-w-0 flex-1 space-y-1">
                    <Sk className="h-5 w-32 max-w-full rounded-lg" />
                    <Sk className="h-4 w-24 max-w-full rounded-lg" />
                  </div>
                  <Sk className="h-5 w-28 rounded-lg" />
                </div>
                <div className="space-y-2">
                  <Sk className="h-4 w-full rounded-lg" />
                  <Sk className="h-4 w-5/6 rounded-lg" />
                  <Sk className="h-4 w-2/3 rounded-lg" />
                </div>
                <Sk className="h-4 w-40 rounded-lg" />
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
