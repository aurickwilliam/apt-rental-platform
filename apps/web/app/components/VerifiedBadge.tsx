import StatusChip from "@/app/components/display/StatusChip";
import { IconShieldCheck as ShieldCheck } from "@tabler/icons-react";

interface VerifiedBadgeProps { className?: string }
export function VerifiedBadge({ className }: VerifiedBadgeProps) {
  return <StatusChip className={className} tone="success"><span className="flex items-center gap-1"><ShieldCheck aria-hidden="true" size={14} />Verified</span></StatusChip>;
}
