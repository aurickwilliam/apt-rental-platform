"use client";

import { FileText, ExternalLink, Image as ImageIcon } from "lucide-react";

type Props = { label: string; fileName: string | null; isImage?: boolean };

export default function DocumentRow({ label, fileName, isImage }: Props) {
  if (!fileName) {
    return (
      <div className="flex items-center justify-between border border-border rounded-xl p-3 bg-card">
        <span className="text-sm font-medium text-card-foreground">{label}</span>
        <span className="text-xs text-muted-foreground">Not uploaded</span>
      </div>
    );
  }
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  return (
    <div className="flex items-center gap-3 border border-border rounded-xl p-3 bg-card">
      {isImage ? (
        <div className="w-14 h-14 rounded-lg border border-border bg-muted flex items-center justify-center shrink-0">
          <ImageIcon size={20} className="text-muted-foreground" />
        </div>
      ) : (
        <div className="w-14 h-14 rounded-lg border border-border bg-muted flex items-center justify-center shrink-0">
          <FileText size={20} className="text-muted-foreground" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-card-foreground truncate">{label}</p>
        <p className="text-xs text-muted-foreground truncate">{fileName} {ext ? `· ${ext.toUpperCase()}` : ""}</p>
      </div>
      {!isImage && <ExternalLink size={16} className="text-muted-foreground shrink-0" />}
    </div>
  );
}
