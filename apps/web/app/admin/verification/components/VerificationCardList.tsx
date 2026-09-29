import Link from "next/link";
import { IconChevronRight } from "@tabler/icons-react";
import { Chip } from "@heroui/react";
import VerificationImage from "./VerificationImage";
import {
  submittedFormatter,
  type VerificationRow,
} from "../lib/verification-display";

interface VerificationCardListProps {
  rows: VerificationRow[];
  selected: "users" | "apartments";
}

export default function VerificationCardList({
  rows,
  selected,
}: VerificationCardListProps) {
  return (
    <ul className="space-y-2 md:hidden">
      {rows.map((row) => (
        <li key={row.id}>
          <Link
            href={`/admin/verification/${selected}/${row.id}`}
            className="block rounded-xl border border-border bg-card p-3 hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <div className="flex items-center gap-3">
              <VerificationImage
                kind={selected}
                image={row.image}
                name={row.label}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-nunito font-bold">{row.label}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {row.detail}
                </p>
              </div>
              <IconChevronRight
                size={18}
                className="shrink-0 text-primary"
                aria-hidden="true"
              />
            </div>
            <div className="mt-3 flex items-center justify-between gap-2 text-xs text-muted-foreground">
              <span className="truncate">
                {submittedFormatter.format(new Date(row.submittedAt))}
              </span>
              <Chip
                size="sm"
                variant="soft"
                color="warning"
                className="shrink-0"
              >
                Pending
              </Chip>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
