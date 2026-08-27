"use client";

type Props = { label: string; value: string | number | null | undefined };

export default function DetailField({ label, value }: Props) {
  return (
    <div className="flex flex-col gap-1 flex-1">
      <span className="text-xs text-muted-foreground font-medium">{label}</span>
      <span className="text-sm font-semibold text-card-foreground">{value ?? "—"}</span>
    </div>
  );
}
