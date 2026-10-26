"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@heroui/react";

interface LandingCtaProps {
  href: string;
  variant?: "outline" | "primary";
  /** Full page load, for links that redirect off-site such as the APK download. */
  isExternalRedirect?: boolean;
  className?: string;
  children: ReactNode;
}

/** HeroUI pill button used for every landing call to action. */
export default function LandingCta({ href, variant = "primary", isExternalRedirect = false, className = "", children }: LandingCtaProps) {
  const router = useRouter();

  return (
    <Button
      variant={variant}
      className={`landing-cta landing-responsive-cta ${className}`.trim()}
      onPress={() => (isExternalRedirect ? window.location.assign(href) : router.push(href))}
    >
      {children}
    </Button>
  );
}
