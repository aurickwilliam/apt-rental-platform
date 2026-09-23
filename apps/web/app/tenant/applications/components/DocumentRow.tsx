"use client";

import { FileText, Image as ImageIcon } from "lucide-react";

type Props = {
  label: string;
  fileName?: string | null;
  path?: string | null;
  signedUrl?: string | null;
  isImage?: boolean;
};

function fileNameFromPath(path: string): string {
  const parts = path.split("/");
  return parts[parts.length - 1] ?? path;
}

export default function DocumentRow({ label, fileName, path, signedUrl, isImage }: Props) {
  const displayName = fileName ?? (path ? fileNameFromPath(path) : null);

  if (!displayName) {
    return (
      <div className="flex items-center justify-between border border-border rounded-xl p-3 bg-card">
        <span className="text-sm font-medium text-card-foreground">{label}</span>
        <span className="text-xs text-muted-foreground">Not uploaded</span>
      </div>
    );
  }

  const ext = displayName.split(".").pop()?.toLowerCase() ?? "";
  const href = signedUrl ?? undefined;

  const inner = (
    <div className="flex items-center gap-3 border border-border rounded-xl p-3 bg-card w-full text-left">
      <div className="w-14 h-14 rounded-lg border border-border bg-muted flex items-center justify-center shrink-0 overflow-hidden">
        {isImage && signedUrl ? (
          <img src={signedUrl} alt={label} className="w-full h-full object-cover" />
        ) : isImage ? (
          <ImageIcon size={20} className="text-muted-foreground" />
        ) : (
          <FileText size={20} className="text-muted-foreground" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-card-foreground truncate">{label}</p>
        <p className="text-xs text-muted-foreground truncate">
          {displayName} {ext ? `· ${ext.toUpperCase()}` : ""}
        </p>
      </div>
      {href && (
        <span className="text-xs font-medium text-primary shrink-0">
          {isImage ? "View" : "Open"}
        </span>
      )}
    </div>
  );

  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="block">
        {inner}
      </a>
    );
  }

  return inner;
}
