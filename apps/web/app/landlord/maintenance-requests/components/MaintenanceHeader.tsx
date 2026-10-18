import { IconTools } from "@tabler/icons-react";

export default function MaintenanceHeader() {
  return (
    <div>
      <h1 className="flex items-center gap-2 font-nunito text-3xl font-bold text-primary">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <IconTools size={28} aria-hidden="true" />
        </span>
        Maintenance Requests
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Review and manage tenant maintenance requests for your properties.
      </p>
    </div>
  );
}
