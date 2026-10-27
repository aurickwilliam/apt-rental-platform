import type { ReactNode } from "react";

interface PublicProfileSectionProps {
  title: string;
  /** Muted line under the heading (how the data was collected, truncation notes). */
  description?: string;
  /** In-page anchor (e.g. the reviews link from the side column). */
  id?: string;
  children: ReactNode;
}

export default function PublicProfileSection({ title, description, id, children }: PublicProfileSectionProps) {
  return (
    <section id={id} className="flex scroll-mt-24 flex-col gap-3">
      <div className="flex flex-col gap-1">
        <h2 className="font-nunito text-xl font-bold text-primary">{title}</h2>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}
