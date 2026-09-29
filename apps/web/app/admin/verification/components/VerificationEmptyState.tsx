import { IconBuilding, IconUsers } from "@tabler/icons-react";

interface VerificationEmptyStateProps {
  selected: "users" | "apartments";
}

export default function VerificationEmptyState({
  selected,
}: VerificationEmptyStateProps) {
  const Icon = selected === "users" ? IconUsers : IconBuilding;
  const title =
    selected === "users"
      ? "No pending user requests"
      : "No pending apartment requests";
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <span className="rounded-full bg-muted p-5">
        <Icon size={36} className="text-muted-foreground" aria-hidden="true" />
      </span>
      <div className="space-y-1">
        <p className="font-nunito text-lg font-bold">{title}</p>
        <p className="text-sm text-muted-foreground">
          You&apos;re all caught up — new submissions will appear here.
        </p>
      </div>
    </div>
  );
}
