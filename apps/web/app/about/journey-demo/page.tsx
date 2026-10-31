import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "APT — journey path study (local preview)",
  robots: { index: false, follow: false },
};

export default async function JourneyPreviewPage() {
  if (process.env.NODE_ENV !== "development") notFound();
  const { default: JourneyDemo } = await import("./JourneyDemo");
  return <JourneyDemo />;
}
