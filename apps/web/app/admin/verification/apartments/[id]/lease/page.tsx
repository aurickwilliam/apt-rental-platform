import Link from "next/link";
import { notFound } from "next/navigation";
import { IconChevronLeft, IconFileText } from "@tabler/icons-react";
import { createClient } from "@repo/supabase/server";
import { requireAdmin } from "../../../../_lib/require-admin";
import LeaseDocumentPreview from "./LeaseDocumentPreview";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ApartmentLeasePreviewPage({ params }: PageProps) {
  await requireAdmin();
  const { id } = await params;
  const supabase = await createClient();
  const { data: verification, error: verificationError } = await supabase
    .from("apartment_verifications")
    .select("apartment_id")
    .eq("id", id)
    .maybeSingle();

  if (verificationError) {
    console.error("Admin lease verification lookup failed", verificationError);
    throw new Error(
      "Unable to load the lease agreement. Refresh and try again.",
    );
  }
  if (!verification) notFound();

  const { data: apartment, error: apartmentError } = await supabase
    .from("apartments")
    .select("lease_agreement_url")
    .eq("id", verification.apartment_id)
    .maybeSingle();

  if (apartmentError) {
    console.error("Admin lease apartment lookup failed", apartmentError);
    throw new Error(
      "Unable to load the lease agreement. Refresh and try again.",
    );
  }
  const path = apartment?.lease_agreement_url;
  if (!path) notFound();

  const fileName = path.split("/").at(-1) ?? "Lease agreement";
  const isPdf = /\.pdf$/i.test(fileName);
  const isDocx = /\.docx$/i.test(fileName);
  if (!isPdf && !isDocx) notFound();

  const sourceHref = `/admin/verification/apartments/${id}/lease/file`;

  return (
    <main className="mx-auto w-full max-w-7xl space-y-4 p-4">
      <Link
        href={`/admin/verification/apartments/${id}`}
        className="inline-flex items-center gap-1 rounded-md text-sm font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <IconChevronLeft size={18} aria-hidden="true" />
        Back to apartment verification
      </Link>

      <h1 className="flex items-center gap-2 font-nunito text-2xl font-bold text-primary">
        <IconFileText size={26} aria-hidden="true" />
        Lease Agreement
      </h1>

      <LeaseDocumentPreview
        sourceHref={sourceHref}
        fileName={fileName}
        isPdf={isPdf}
      />
    </main>
  );
}
