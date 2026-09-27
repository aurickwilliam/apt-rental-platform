import { Spinner } from "@heroui/react";

// Transition feedback for navigations into the landing route (e.g. the
// auth pages' back button): App Router renders this instantly while the
// server round-trips complete, so clicks feel acknowledged immediately.
export default function MainLoading() {
  return (
    <div
      className="flex min-h-screen items-center justify-center bg-background"
      aria-busy="true"
      aria-label="Loading"
    >
      <Spinner size="lg" />
    </div>
  );
}
