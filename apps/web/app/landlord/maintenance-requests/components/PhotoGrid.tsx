"use client";

export default function PhotoGrid({ photos }: { photos: string[] }) {
  if (photos.length === 0) {
    return (
      <div className="rounded-2xl bg-muted px-4 py-3">
        <p className="text-sm text-muted-foreground">No photos provided.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {photos.map((url, idx) => (
        <a
          key={`${url}-${idx}`}
          href={url}
          target="_blank"
          rel="noreferrer"
          className="block size-24 rounded-2xl overflow-hidden border border-border"
          aria-label={`Open issue photo ${idx + 1}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt={`Issue photo ${idx + 1}`} className="w-full h-full object-cover" />
        </a>
      ))}
    </div>
  );
}
