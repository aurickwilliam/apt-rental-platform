import { redirect } from "next/navigation";
import { headers } from "next/headers";

import { getVerificationPageState } from "./actions";
import VerifyClient from "./components/VerifyClient";

// Role-agnostic desktop verification page: both tenants and landlords land
// here from their profile's "Verify Account" action. No webcam is involved --
// this page issues a short-lived QR session that the phone completes.
async function getSiteUrl(): Promise<string> {
  const override = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (override) return override;

  const incoming = await headers();
  const forwardedHost = incoming.get("x-forwarded-host");
  if (forwardedHost) return `https://${forwardedHost}`;

  const host = incoming.get("host") ?? "localhost:3000";
  const proto =
    process.env.NODE_ENV === "production" && !host.startsWith("localhost")
      ? "https"
      : host.startsWith("localhost")
        ? "http"
        : "https";
  return `${proto}://${host}`;
}

export default async function VerifyPage() {
  const state = await getVerificationPageState();
  if (!state.signedIn) redirect("/sign-in?next=/verify");

  const siteUrl = await getSiteUrl();

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:py-12">
      <VerifyClient
        siteUrl={siteUrl}
        accountStatus={state.accountStatus}
        hasPending={state.hasPending}
      />
    </div>
  );
}
