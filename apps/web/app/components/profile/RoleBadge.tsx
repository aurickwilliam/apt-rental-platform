import { Chip } from "@heroui/react";
import { IconBuildingSkyscraper, IconHome } from "@tabler/icons-react";

type RoleBadgeProps = {
  role: "tenant" | "landlord";
};

// Tint + icon mapping mirrors the admin role chips
// (roleChipStyle/roleChipIcon) without touching admin code:
// tenant reads blue, landlord reads orange, per design tokens.
const ROLE_STYLES = {
  tenant: {
    label: "Tenant",
    Icon: IconHome,
    className: "bg-primary/10 text-primary",
  },
  landlord: {
    label: "Landlord",
    Icon: IconBuildingSkyscraper,
    className: "bg-secondary/10 text-secondary",
  },
} as const;

export default function RoleBadge({ role }: RoleBadgeProps) {
  const { label, Icon, className } = ROLE_STYLES[role];
  return (
    <Chip size="sm" variant="soft" color="default" className={`shrink-0 ${className}`}>
      <span className="flex items-center gap-1">
        <Icon size={14} aria-hidden="true" />
        {label}
      </span>
    </Chip>
  );
}
