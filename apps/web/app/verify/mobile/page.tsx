import type { Viewport } from "next";
import Link from "next/link";
import { Card } from "@heroui/react";
import { verificationApartmentPath } from "@/lib/profile-verification-navigation";
import "./verification.css";

import MobileVerifyClient from "./components/MobileVerifyClient";

// Phone-friendly viewport: honor the iPhone notch/Dynamic Island safe area.
export const viewport: Viewport = {
  viewportFit: "cover",
};

type MobileVerifyPageProps = {
  searchParams: Promise<{ token?: string; returnTo?: string }>;
};

// Phone entry opened from a desktop QR code or the same-device method picker.
// The token is opaque (no PII);
// it is validated against the signed-in owner on claim, and consumed only
// on successful submit. Abandoning the page simply lets it expire.
export default async function MobileVerifyPage({ searchParams }: MobileVerifyPageProps) {
  const params = await searchParams;
  const token = typeof params.token === "string" ? params.token : undefined;
  const returnTo = verificationApartmentPath(typeof params.returnTo === "string" ? params.returnTo : null);

  if (!token) {
    return (
      <div className="mobile-verification-page">
        <Card className="mobile-verification-shell">
          <Card.Content className="flex flex-col items-center gap-3 text-center">
            <h1 className="font-nunito text-xl font-bold">Invalid verification link</h1>
            <p className="text-sm text-muted-foreground">
              Open your profile and start identity verification to get a new secure link.
            </p>
          </Card.Content>
        </Card>
      </div>
    );
  }

  return (
    <div className="mobile-verification-page">
      <MobileVerifyClient key={token} token={token} returnTo={returnTo} />
      {returnTo ? <Link href={returnTo} className="mobile-verification-return">Return to apartment</Link> : null}
    </div>
  );
}
