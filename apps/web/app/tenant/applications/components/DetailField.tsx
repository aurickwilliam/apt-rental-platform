"use client";

type Props = { label: string; value: string | number | null | undefined };

export default function DetailField({ label, value }: Props) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1">
      <span className="text-xs font-nunito font-semibold text-muted-foreground">{label}</span>
      <span className="break-words text-sm font-inter leading-relaxed text-card-foreground">{value ?? "—"}</span>
    </div>
  );
}
