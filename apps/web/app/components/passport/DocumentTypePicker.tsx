import Link from "next/link";
import { IconChevronRight } from "@tabler/icons-react";

import { DOCUMENT_TYPES } from "@repo/constants";
import { getDocumentTypeDescription } from "@repo/passport";

import { DocumentTypeIcon } from "./documentTypeIcons";

interface DocumentTypePickerProps {
  basePath: string;
}

export default function DocumentTypePicker({ basePath }: DocumentTypePickerProps) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Choose the type of document you want to add. Your files are kept securely and ready for your rental
        applications.
      </p>

      <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
        {DOCUMENT_TYPES.map((docType) => (
            <li key={docType}>
              <Link
                href={`${basePath}/add?type=${encodeURIComponent(docType)}`}
                className="flex items-center gap-3 p-4 transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-primary">
                  <DocumentTypeIcon docType={docType} size={18} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-nunito text-base font-semibold text-card-foreground">{docType}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {getDocumentTypeDescription(docType)}
                  </span>
                </span>
                <IconChevronRight size={18} className="shrink-0 text-muted-foreground" aria-hidden="true" />
              </Link>
            </li>
        ))}
      </ul>

      <p className="text-center text-sm text-muted-foreground">
        Make sure your document is clear and not expired. Your government ID is added automatically once your
        account verification is approved.
      </p>
    </div>
  );
}
