"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { isLandlordRouteOpenWhileUnverified } from "@/lib/landlord-verification-access";
import LandlordVerificationWall from "./LandlordVerificationWall";

interface LandlordAccessGateProps {
  /** True when the account holds the landlord role but is not verified. */
  blocked: boolean;
  accountStatus: string | null | undefined;
  children: ReactNode;
}

/** Layout-level catch-all: a blocked account sees the wall on every landlord
 *  route that is not on the open list, whatever page it typed in. */
export default function LandlordAccessGate({ blocked, accountStatus, children }: LandlordAccessGateProps) {
  const pathname = usePathname();
  if (blocked && !isLandlordRouteOpenWhileUnverified(pathname)) {
    return <LandlordVerificationWall accountStatus={accountStatus} />;
  }
  return <>{children}</>;
}
