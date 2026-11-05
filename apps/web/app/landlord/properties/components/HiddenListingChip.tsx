import StatusChip from "@/app/components/display/StatusChip";

/** Shown beside a listing's status when an admin hid it from public search. */
export default function HiddenListingChip({ hidden }: { hidden?: boolean }) {
  if (!hidden) return null;
  return (
    <StatusChip size="sm" tone="danger">
      Hidden from search
    </StatusChip>
  );
}
