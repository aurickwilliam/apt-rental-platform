import type { Metadata } from "next";

import { requirePortalViewer } from "@/lib/server-identity";

import AvaPageClient from "@/app/components/ava/AvaPageClient";

export const metadata: Metadata = { title: "Ava | APT" };

const BROWSE_PATH = "/tenant/browse";

export default async function TenantAvaPage({
  searchParams,
}: {
  searchParams: Promise<{ chat?: string | string[] }>;
}) {
  await requirePortalViewer("tenant");

  // `?chat=` opens a saved conversation (the drawer's Expand button sets it).
  // Unknown ids simply start an empty chat; history is read in the browser.
  const { chat } = await searchParams;
  const initialChatId = typeof chat === "string" ? chat : null;

  return <AvaPageClient basePath={BROWSE_PATH} initialChatId={initialChatId} />;
}
