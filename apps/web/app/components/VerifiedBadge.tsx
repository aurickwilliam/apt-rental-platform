import { Chip } from "@heroui/react";
import { ShieldCheck } from "lucide-react";

interface VerifiedBadgeProps { className?: string }
export function VerifiedBadge({ className }: VerifiedBadgeProps) {
  return <Chip className={className} variant="soft" color="success"><span className="flex items-center gap-1"><ShieldCheck aria-hidden="true" size={14} />Verified</span></Chip>;
}
