import { IconBuilding } from "@tabler/icons-react";
import type { ReactNode } from "react";

interface SectionHeadingProps {
  id: string;
  title: string;
  icon: typeof IconBuilding;
}

export function SectionHeading({ id, title, icon: Icon }: SectionHeadingProps) {
  return (
    <h2
      id={id}
      className="flex items-center gap-2 font-nunito text-xl font-bold"
    >
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
        <Icon size={20} className="text-primary" aria-hidden="true" />
      </span>
      {title}
    </h2>
  );
}

interface AnalyticsSectionProps extends SectionHeadingProps {
  children: ReactNode;
  gridClassName?: string;
}

export default function AnalyticsSection({
  id,
  title,
  icon,
  children,
  gridClassName = "lg:grid-cols-2",
}: AnalyticsSectionProps) {
  return (
    <section aria-labelledby={id} className="space-y-3">
      <SectionHeading id={id} title={title} icon={icon} />
      <div className={`grid grid-cols-1 gap-4 ${gridClassName}`}>
        {children}
      </div>
    </section>
  );
}
