import { Chip } from "@heroui/react";
import {
  IconAlertTriangle,
  IconHourglass,
  IconShieldCheck,
  IconShieldQuestion,
  type Icon,
} from "@tabler/icons-react";

import { PASSPORT_DOCUMENT_STATUS_LABELS, type PassportDocumentStatus } from "@repo/passport";

const STATUS_META: Record<
  PassportDocumentStatus,
  { color: "success" | "warning" | "danger" | "default"; Icon: Icon }
> = {
  verified: { color: "success", Icon: IconShieldCheck },
  expired: { color: "danger", Icon: IconAlertTriangle },
  pending: { color: "warning", Icon: IconHourglass },
  rejected: { color: "danger", Icon: IconAlertTriangle },
  unverified: { color: "default", Icon: IconShieldQuestion },
};

interface PassportStatusChipProps {
  status: PassportDocumentStatus;
  className?: string;
}

export default function PassportStatusChip({ status, className }: PassportStatusChipProps) {
  const { color, Icon } = STATUS_META[status];
  return (
    <Chip size="sm" variant="soft" color={color} className={`shrink-0 text-[11px] ${className ?? ""}`}>
      <span className="flex items-center gap-1">
        <Icon size={14} aria-hidden="true" />
        {PASSPORT_DOCUMENT_STATUS_LABELS[status]}
      </span>
    </Chip>
  );
}
