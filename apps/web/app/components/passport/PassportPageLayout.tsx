import Link from "next/link";
import { IconArrowLeft, IconFileCheck } from "@tabler/icons-react";

/**
 * Page shell shared by every Passport page and its loading state. `w-full`
 * matters: the portal `<main>` is a flex column, so without it `mx-auto`
 * shrinks the page to its content and the width shifts as content changes.
 */
export function PassportPageShell({ children }: { children: React.ReactNode }) {
  return <div className="w-full space-y-6 px-4 py-6 sm:py-8 md:px-6">{children}</div>;
}

export function PassportPageHeader({ portal = "tenant" }: { portal?: "tenant" | "landlord" } = {}) {
  return (
    <div>
      <h1 className="flex items-center gap-2 font-nunito text-3xl font-bold text-primary">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <IconFileCheck size={28} aria-hidden="true" />
        </span>
        APT Passport
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {portal === "landlord"
          ? "Your verified ID and ownership documents. They show tenants you are a legitimate landlord."
          : "Your verified ID and supporting documents, attached automatically when you apply."}
      </p>
    </div>
  );
}

export function PassportBackLink({ basePath }: { basePath: string }) {
  return (
    <Link
      href={basePath}
      className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-primary"
    >
      <IconArrowLeft size={16} aria-hidden="true" />
      APT Passport
    </Link>
  );
}
