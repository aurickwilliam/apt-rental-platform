import { IconBuilding } from "@tabler/icons-react";

export default function ApartmentsEmptyState() {
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <span className="rounded-full bg-muted p-5">
        <IconBuilding
          size={36}
          className="text-muted-foreground"
          aria-hidden="true"
        />
      </span>
      <div className="space-y-1">
        <p className="font-nunito text-lg font-bold">No apartments found</p>
        <p className="text-sm text-muted-foreground">
          Try adjusting your search or filters.
        </p>
      </div>
    </div>
  );
}
