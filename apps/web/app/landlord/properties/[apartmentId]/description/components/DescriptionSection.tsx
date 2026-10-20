import type { ReactNode } from "react";
import type { Icon } from "@tabler/icons-react";
import { Card } from "@heroui/react";

interface DescriptionSectionProps {
  title: string;
  subtitle: string;
  icon: Icon;
  action?: ReactNode;
  children: ReactNode;
  inline?: boolean;
}

export default function DescriptionSection({ title, subtitle, icon: Icon, action, children, inline = false }: DescriptionSectionProps) {
  return (
    <Card className="landlord-description-section border border-border">
      <div className={`flex gap-3 ${inline ? "flex-col xl:flex-row xl:items-center xl:gap-6" : "flex-col"}`}>
        <div className={`flex items-start justify-between gap-3 ${inline ? "xl:w-96 xl:shrink-0" : ""}`}>
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Icon size={24} aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h2 className="text-base font-nunito font-bold text-card-foreground">{title}</h2>
              <p className="mt-0.5 text-xs leading-5 text-muted-foreground">{subtitle}</p>
            </div>
          </div>
          {action}
        </div>
        {children}
      </div>
    </Card>
  );
}
