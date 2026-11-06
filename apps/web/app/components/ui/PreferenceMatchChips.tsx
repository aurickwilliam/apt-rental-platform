import { IconCircleCheck } from "@tabler/icons-react";

interface PreferenceMatchChipsProps {
  labels: string[];
  summary?: boolean;
}

const PRIMARY_CHIP_LIMIT = 2;
const SUMMARY_LABELS: Record<string, string> = {
  "Preferred city": "City",
  "Within budget": "Budget",
  "Preferred bedrooms": "Bedrooms",
  "Matches amenities": "Amenities",
};

export default function PreferenceMatchChips({ labels, summary = false }: PreferenceMatchChipsProps) {
  if (!labels.length) return null;
  if (summary) {
    return (
      <div role="note" aria-label="Rental preference match summary" className="mt-3 border-t border-border/60 pt-2.5">
        <p className="flex items-center gap-1.5 text-xs leading-4 font-semibold text-foreground">
          <IconCircleCheck size={14} stroke={1.75} aria-hidden="true" className="shrink-0 text-secondary-foreground" />
          <span>Matches {labels.length} of your preferences</span>
        </p>
        <p className="mt-1 text-[11px] leading-4 text-muted-foreground">{labels.map((label) => SUMMARY_LABELS[label] ?? label).join(" · ")}</p>
      </div>
    );
  }
  const primary = labels.slice(0, PRIMARY_CHIP_LIMIT);
  const additional = labels.slice(PRIMARY_CHIP_LIMIT);
  return (
    <ul aria-label="Matches your rental preferences" className="mt-1.5 flex flex-wrap gap-1">
      {primary.map((label) => (
        <li key={label} className="rounded-full bg-secondary px-1 py-0.5 text-[9px] leading-3 font-semibold text-secondary-foreground">
          {label}
        </li>
      ))}
      {additional.length ? (
        <li aria-label={`${additional.length} more matching preferences: ${additional.join(", ")}`} className="self-center whitespace-nowrap text-[9px] leading-3 text-muted-foreground">
          +{additional.length} more
        </li>
      ) : null}
    </ul>
  );
}
