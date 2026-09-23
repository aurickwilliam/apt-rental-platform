"use client";

import { Card } from "@heroui/react";
import { Building2 } from "lucide-react";

type PropertyContextCardProps = {
  propertyName?: string;
  landlordName?: string;
};

export default function PropertyContextCard({
  propertyName = "No property on file",
  landlordName = "N/A",
}: PropertyContextCardProps) {
  return (
    <Card className="rounded-2xl border border-border bg-card shadow-sm font-nunito">
      <Card.Content className="p-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Building2 size={18} className="text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-nunito font-semibold text-card-foreground truncate">
              {propertyName}
            </p>
            <p className="text-xs text-muted-foreground">
              Landlord: <span className="text-card-foreground">{landlordName}</span>
            </p>
          </div>
        </div>
      </Card.Content>
    </Card>
  );
}
