"use client";

import { usePathname } from "next/navigation";
import BackBtn from "@/app/browse/[apartmentId]/components/BackBtn";

export default function PolicyBackButton() {
  const pathname = usePathname();
  const portal = pathname.split("/")[1];
  const fallbackHref = portal === "tenant" ? "/tenant/my-rental"
    : portal === "landlord" ? "/landlord/dashboard"
      : portal === "admin" ? "/admin/dashboard" : "/";

  return <BackBtn fallbackHref={fallbackHref} />;
}
