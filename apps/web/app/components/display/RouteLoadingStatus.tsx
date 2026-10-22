import { Spinner } from "@heroui/react";

/** A calm route hand-off; the client data owner renders the body skeleton. */
export default function RouteLoadingStatus({ children }: { children: React.ReactNode }) {
  return (
    <div role="status" aria-busy="true" className="flex items-center gap-3 py-6 text-sm text-muted-foreground">
      <Spinner size="sm" aria-hidden="true" />
      <span>{children}</span>
    </div>
  );
}
