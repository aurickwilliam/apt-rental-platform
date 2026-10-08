import Link from "next/link";
import { buttonVariants } from "@heroui/react";
import { IconArrowLeft } from "@tabler/icons-react";

import { DOCUMENT_TYPES, PASSPORT_GOV_ID_DOC_TYPES } from "@repo/constants";

import DocumentTypePicker from "./DocumentTypePicker";
import PassportUploadForm from "./PassportUploadForm";

interface AddPassportDocumentProps {
  userId: string;
  basePath: string;
  /** `?type=` from the URL; null shows the type picker. */
  docType: string | null;
}

function UnavailableType({ basePath, isIdentityDoc }: { basePath: string; isIdentityDoc: boolean }) {
  return (
    <div className="space-y-4 rounded-2xl border border-border bg-card p-6">
      <h2 className="font-nunito text-xl font-bold text-card-foreground">
        {isIdentityDoc ? "Verify your ID" : "Choose a document type"}
      </h2>
      <p className="text-sm text-muted-foreground">
        {isIdentityDoc
          ? "Identity documents use live ID capture and a selfie in account verification. Once approved, your ID is added to your APT Passport automatically."
          : "This document type is not available for Passport uploads. Choose a type from the list instead."}
      </p>
      <Link
        href={isIdentityDoc ? "/verify" : `${basePath}/add`}
        className={buttonVariants({ variant: "primary" })}
      >
        {isIdentityDoc ? "Go to ID verification" : "Choose document type"}
      </Link>
    </div>
  );
}

export default function AddPassportDocument({ userId, basePath, docType }: AddPassportDocumentProps) {
  const isUploadable = !!docType && DOCUMENT_TYPES.includes(docType);
  const isIdentityDoc = !!docType && PASSPORT_GOV_ID_DOC_TYPES.includes(docType);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:py-8">
      <div className="mx-auto max-w-2xl space-y-4">
        <Link
          href={basePath}
          className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-primary"
        >
          <IconArrowLeft size={16} aria-hidden="true" />
          APT Passport
        </Link>
        <h1 className="font-nunito text-2xl font-bold text-card-foreground">
          {docType ? "Upload Document" : "Select Document Type"}
        </h1>

        {!docType ? (
          <DocumentTypePicker basePath={basePath} />
        ) : isUploadable ? (
          <PassportUploadForm key={docType} userId={userId} basePath={basePath} docType={docType} />
        ) : (
          <UnavailableType basePath={basePath} isIdentityDoc={isIdentityDoc} />
        )}
      </div>
    </div>
  );
}
