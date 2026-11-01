"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { buttonVariants } from "@heroui/react";
import { IconAlertTriangle } from "@tabler/icons-react";

import type { ApplicationIssue } from "@repo/passport";

import { passportFixHref } from "@/app/components/passport/passportSlots";
import { profileVerificationHref } from "@/lib/profile-verification-navigation";

/**
 * The fix offered for an issue. The government ID only comes from account
 * verification (it can't be uploaded), so a missing-documents card points at
 * the first slot the tenant can add; verification has its own "unverified"
 * card, and a verified account missing only its ID is sent to the Passport.
 */
function actionFor(issue: ApplicationIssue, pathname: string, accountStatus: string | null): { label: string; href: string } | null {
  switch (issue.code) {
    case "unverified":
      if (accountStatus === "verified") return null;
      return {
        label: accountStatus === "pending" ? "View verification status" : "Verify account",
        href: profileVerificationHref(pathname),
      };
    case "passport-missing": {
      const addable = issue.slots?.find((slot) => slot !== "govId");
      if (addable) return { label: "Add to APT Passport", href: passportFixHref(addable) };
      return { label: "Open APT Passport", href: "/tenant/passport" };
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
export default function ApplicationIssues({ issues, accountStatus }: { issues: ApplicationIssue[]; accountStatus: string | null }) {
  const pathname = usePathname();
  if (issues.length === 0) return null;

  return (
    <div className="space-y-3" role="alert">
      {issues.map((issue) => {
        const action = actionFor(issue, pathname, accountStatus);
        return (
          <div key={issue.code} className="space-y-2 rounded-2xl border border-danger/20 bg-danger/10 p-3">
            <div className="flex gap-2">
              <IconAlertTriangle size={18} className="mt-0.5 shrink-0 text-danger" aria-hidden="true" />
              <p className="text-sm text-card-foreground">{issue.message}</p>
            </div>
            {action ? (
              <Link href={action.href} className={`cursor-pointer ${buttonVariants({ size: "sm", variant: "primary" })}`}>
                {action.label}
              </Link>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
