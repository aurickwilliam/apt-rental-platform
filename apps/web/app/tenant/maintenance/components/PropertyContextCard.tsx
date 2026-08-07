// apps/web/app/(main)/tenant/maintenance/components/PropertyContextCard.tsx
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
    <Card className="bg-surface border border-default-200 shadow-none p-5 mb-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <Building2 size={18} className="text-primary" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-poppinsSemiBold text-foreground truncate">{propertyName}</p>
          <p className="text-xs text-default-500">
            Landlord: <span className="text-default-700">{landlordName}</span>
          </p>
        </div>
      </div>
    </Card>
  );
}