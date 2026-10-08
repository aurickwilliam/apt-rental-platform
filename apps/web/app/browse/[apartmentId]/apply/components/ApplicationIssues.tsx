import Link from "next/link";
import { buttonVariants } from "@heroui/react";
import { IconAlertTriangle } from "@tabler/icons-react";

import type { ApplicationIssue } from "@repo/passport";

import { passportFixHref } from "@/app/components/passport/passportSlots";

function actionFor(issue: ApplicationIssue): { label: string; href: string } | null {
  switch (issue.code) {
    case "unverified":
      return { label: "Verify account", href: "/verify" };
    case "passport-missing": {
      const slot = issue.slots?.[0];
      if (slot === "govId") return { label: "Verify your ID", href: passportFixHref(slot) };
      return { label: "Add to APT Passport", href: slot ? passportFixHref(slot) : "/tenant/passport?add=1" };
    }
    case "passport-expired":
      return { label: "Open APT Passport", href: "/tenant/passport" };
    case "already-applied":
      return { label: "View my applications", href: "/tenant/my-rental" };
    default:
      return null;
  }
}

/** Blocking problems that stop the tenant from applying, each with a fix. */
export default function ApplicationIssues({ issues }: { issues: ApplicationIssue[] }) {
  if (issues.length === 0) return null;

  return (
    <div className="space-y-3" role="alert">
      {issues.map((issue) => {
        const action = actionFor(issue);
        return (
          <div key={issue.code} className="space-y-2 rounded-2xl border border-danger/20 bg-danger/10 p-3">
            <div className="flex gap-2">
              <IconAlertTriangle size={18} className="mt-0.5 shrink-0 text-danger" aria-hidden="true" />
              <p className="text-sm text-card-foreground">{issue.message}</p>
            </div>
            {action ? (
              <Link href={action.href} className={buttonVariants({ size: "sm", variant: "danger-soft" })}>
                {action.label}
              </Link>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
