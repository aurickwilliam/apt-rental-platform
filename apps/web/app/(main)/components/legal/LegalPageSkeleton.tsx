import { Card, Skeleton } from "@heroui/react";

interface LegalPageSkeletonProps {
  title: string;
  titleAccent: string;
  contentsCount: number;
}

function Placeholder({ className }: { className: string }) {
  return (
    <Skeleton
      animationType="shimmer"
      className={`bg-skeleton! dark:bg-muted! motion-reduce:after:hidden ${className}`}
    />
  );
}

export default function LegalPageSkeleton({
  title,
  titleAccent,
  contentsCount,
}: LegalPageSkeletonProps) {
  const label = `${title} ${titleAccent}`;

  return (
    <div
      className="min-h-screen bg-muted/30 dark:bg-background"
      aria-busy="true"
      aria-label={`Loading ${label}`}
    >
      <p role="status" className="sr-only">Loading {label}…</p>
      <div aria-hidden="true">
        <header className="border-b border-border bg-light-blue/60 dark:bg-primary/10">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 pb-8 pt-7 sm:px-6 sm:pb-10 sm:pt-9">
            <Placeholder className="h-7 w-20 rounded-lg" />
            <h1 className="font-nunito text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl">
              {title} <span className="text-brand">{titleAccent}</span>
            </h1>
            <div className="flex max-w-2xl flex-col gap-2 py-1">
              <Placeholder className="h-4 w-full rounded-md" />
              <Placeholder className="h-4 w-3/4 rounded-md" />
              <Placeholder className="h-4 w-1/2 rounded-md sm:hidden" />
            </div>
            <div className="mt-1 flex flex-wrap gap-x-6 gap-y-2">
              <Placeholder className="h-5 w-48 rounded-md" />
              <Placeholder className="h-5 w-44 rounded-md" />
              <Placeholder className="h-5 w-24 rounded-md" />
            </div>
          </div>
        </header>

        <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-10 px-4 pb-16 pt-8 sm:px-6 lg:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] lg:gap-8 lg:pt-10">
          <Card className="hidden self-start gap-0 rounded-xl border border-border bg-card p-3 shadow-none lg:flex">
            <Card.Header className="px-2 pb-2">
              <Placeholder className="h-4 w-20 rounded-md" />
            </Card.Header>
            <Card.Content className="gap-0.5">
              {Array.from({ length: contentsCount }, (_, index) => (
                <div key={index} className="flex min-h-6 items-center gap-2 px-2 py-0.5">
                  <Placeholder className="size-5 shrink-0 rounded-full" />
                  <Placeholder className={`h-3 rounded-md ${index % 3 === 0 ? "w-3/4" : "w-2/3"}`} />
                </div>
              ))}
            </Card.Content>
          </Card>

          <Card className="flex-row items-center justify-between rounded-xl border border-border bg-card px-4 py-5 shadow-none lg:hidden">
            <Placeholder className="h-4 w-24 rounded-md" />
            <Placeholder className="size-4 rounded-md" />
          </Card>

          <div className="min-w-0 max-w-4xl space-y-5">
            <Card className="rounded-xl border border-border/70 bg-card p-5 shadow-none sm:p-6">
              <Card.Header className="gap-2">
                <Placeholder className="h-5 w-24 rounded-full" />
                <Placeholder className="h-7 w-64 max-w-full rounded-lg" />
              </Card.Header>
              <Card.Content className="gap-3">
                <Placeholder className="h-4 w-full rounded-md" />
                <Placeholder className="h-4 w-full rounded-md" />
                <Placeholder className="h-4 w-3/4 rounded-md" />
              </Card.Content>
              <Placeholder className="h-12 w-full rounded-lg" />
            </Card>

            <Card className="rounded-xl border border-border/70 bg-card p-5 shadow-none sm:p-6">
              <Card.Header className="gap-2">
                <Placeholder className="h-5 w-24 rounded-full" />
                <Placeholder className="h-7 w-52 max-w-full rounded-lg" />
              </Card.Header>
              <Card.Content className="gap-3">
                <Placeholder className="h-4 w-3/4 rounded-md" />
                {Array.from({ length: 6 }, (_, index) => (
                  <div key={index} className="flex items-center gap-2.5 py-1">
                    <Placeholder className="size-1.5 shrink-0 rounded-full" />
                    <Placeholder className={`h-4 rounded-md ${index % 2 === 0 ? "w-1/2" : "w-2/3"}`} />
                  </div>
                ))}
              </Card.Content>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
