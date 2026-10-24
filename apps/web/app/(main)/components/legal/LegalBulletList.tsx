interface LegalBulletListProps {
  items: readonly string[];
}

export default function LegalBulletList({ items }: LegalBulletListProps) {
  return (
    <ul className="flex flex-col gap-2.5">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2.5">
          <span
            aria-hidden="true"
            className="mt-2.5 size-1.5 shrink-0 rounded-full bg-brand/60"
          />
          <span className="min-w-0">{item}</span>
        </li>
      ))}
    </ul>
  );
}
