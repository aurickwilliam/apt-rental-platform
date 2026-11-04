import { IconBuilding, IconFileText, IconUsers } from "@tabler/icons-react";

import EmptyState from "@/app/components/display/EmptyState";
import type { VerificationQueue } from "../lib/verification-display";

interface VerificationEmptyStateProps {
  selected: VerificationQueue;
}

export default function VerificationEmptyState({
  selected,
}: VerificationEmptyStateProps) {
  const icon =
    selected === "users" ? IconUsers : selected === "documents" ? IconFileText : IconBuilding;
  const title =
    selected === "users"
      ? "No pending user requests"
      : selected === "documents"
        ? "No pending document requests"
        : "No pending apartment requests";
  return (
    <EmptyState
      icon={icon}
      title={title}
      description="You're all caught up — new submissions will appear here."
    />
  );
}
