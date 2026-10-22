import Link from "next/link";
import type { ComponentType } from "react";
import { IconChevronRight } from "@tabler/icons-react";

type Props = {
  label: string;
  value: string;
  caption?: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  /** Shows the value in the destructive color (e.g. overdue rent). */
  isAlert?: boolean;
  /** Omit for informational tiles. */
  href?: string;
};

export default function StatTile({
  label,
  value,
  caption,
  icon: Icon,
  isAlert = false,
  href,
}: Props) {
  const content = (
    <>
      <div className="flex items-center gap-3">
        <div className="rounded-md bg-primary/10 p-1.5 text-primary">
          <Icon size={18} />
        </div>
        <h2 className="flex-1 text-base font-medium font-noto-serif text-foreground">
          {label}
        </h2>
        {href ? <IconChevronRight size={16} className="text-muted-foreground" /> : null}
      </div>
      <div>
        <p
          className={`text-3xl font-semibold ${isAlert ? "text-destructive" : "text-foreground"}`}
        >
          {value}
        </p>
        {caption ? <p className="text-xs text-muted-foreground">{caption}</p> : null}
      </div>
    </>
  );

  const className = "flex flex-col gap-3 rounded-xl border border-border bg-card p-4";

  if (!href) return <div className={className}>{content}</div>;

  return (
    <Link
      href={href}
      className={`${className} cursor-pointer transition-colors hover:border-primary`}
    >
      {content}
    </Link>
  );
}
