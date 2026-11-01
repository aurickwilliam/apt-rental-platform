"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import { verificationApartmentPath } from "@/lib/profile-verification-navigation";

/** A one-shot profile entry intent, not a persistent URL-controlled dialog. */
export function useProfileVerificationIntent(accountStatus: string | null | undefined) {
  const pathname = usePathname();
  const params = useSearchParams();
  const requested = pathname === "/tenant/profile" && params.get("openVerification") === "true";
  const canVerify = accountStatus !== "verified" && accountStatus !== "pending";
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!requested) return;
    // Open after the destination has mounted and the departing application
    // overlay has cleaned up. Also survives Strict Mode's effect replay.
    const frame = window.requestAnimationFrame(() => {
      const url = new URL(window.location.href);
      if (url.pathname !== "/tenant/profile" || url.searchParams.get("openVerification") !== "true") return;
      url.searchParams.delete("openVerification");
      // Replace only this entry: Back still returns to the apartment, and a
      // refresh/Forward cannot replay an already consumed request. Native
      // history integrates with Next without remounting the profile.
      window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
      if (canVerify) setOpen(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [requested, canVerify]);

  return {
    open: open && canVerify,
    setOpen,
    returnTo: pathname === "/tenant/profile" ? verificationApartmentPath(params.get("returnTo")) : null,
  };
}
