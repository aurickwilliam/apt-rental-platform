import { IconHistory } from "@tabler/icons-react";

export default function ActivityEmptyState() {
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <span className="rounded-full bg-muted p-5">
        <IconHistory
          size={36}
          className="text-muted-foreground"
          aria-hidden="true"
        />
      </span>
      <div className="space-y-1">
        <p className="font-nunito text-lg font-bold">No activity yet</p>
        <p className="text-sm text-muted-foreground">
          Account access, moderation, and review history will appear here.
        </p>
      </div>
    </div>
  );
}
