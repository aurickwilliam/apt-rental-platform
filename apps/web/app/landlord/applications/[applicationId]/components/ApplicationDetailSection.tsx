import type { ReactNode } from "react";
import type { Icon } from "@tabler/icons-react";
import { Card } from "@heroui/react";

interface ApplicationDetailSectionProps {
  title: string;
  subtitle: string;
  icon: Icon;
  children: ReactNode;
}

export default function ApplicationDetailSection({ title, subtitle, icon: Icon, children }: ApplicationDetailSectionProps) {
  return (
    <Card className="landlord-application-detail-card border border-border">
      <div className="flex items-center gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Icon size={24} aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h2 className="text-base font-nunito font-bold text-card-foreground">{title}</h2>
          <p className="mt-0.5 text-xs leading-5 text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      {children}
    </Card>
  );
}
