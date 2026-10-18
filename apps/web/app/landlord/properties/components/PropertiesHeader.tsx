import { IconBuilding } from "@tabler/icons-react";

export default function PropertiesHeader() {
  return (
    <div className="mb-6">
      <h1 className="flex items-center gap-2 font-nunito text-3xl font-bold text-primary">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <IconBuilding size={28} aria-hidden="true" />
        </span>
        My Properties
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Manage your listings, track occupancy, and monitor revenue.
      </p>
    </div>
  );
}
