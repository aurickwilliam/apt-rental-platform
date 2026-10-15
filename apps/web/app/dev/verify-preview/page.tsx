import { notFound } from "next/navigation";

import VerifyPreviewClient from "./VerifyPreviewClient";

export const dynamic = "force-dynamic";

// Development-only UI preview for the QR verification states. Never
// served in production: the gate below runs on every request, and the
// page renders mock display data only (no sessions, tokens, or writes).
export default function VerifyPreviewPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return <VerifyPreviewClient />;
}
