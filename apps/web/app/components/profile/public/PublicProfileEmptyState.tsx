import type { Icon } from "@tabler/icons-react";

interface PublicProfileEmptyStateProps {
  icon: Icon;
  title: string;
  description: string;
}

export default function PublicProfileEmptyState({ icon: IconComponent, title, description }: PublicProfileEmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-3xl border border-border bg-card px-6 py-12 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
        <IconComponent size={28} aria-hidden="true" />
      </div>
      <h3 className="font-nunito text-lg font-bold">{title}</h3>
      <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
