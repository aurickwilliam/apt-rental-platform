import type { Metadata } from "next";
import { notFound } from "next/navigation";
import MobileDemo from "@/app/(main)/components/mobile-demo/MobileDemo";
import { demoInter, demoNunito } from "@/app/(main)/components/mobile-demo/demo-fonts";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "APT Mobile — static preview",
  robots: { index: false, follow: false },
};

// Same development-only gate as /dev/verify-preview. /about is already public
// under the existing middleware; no auth exceptions or portal layout are needed.
export default function MobileDemoPreviewPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <main className={`${demoInter.variable} ${demoNunito.variable}`}>
      <MobileDemo />
    </main>
  );
}
