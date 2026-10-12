import { IconShieldCheck } from "@tabler/icons-react";
import { createClient } from "@repo/supabase/server";
import { requireAdmin } from "../_lib/require-admin";
import VerificationQueues from "./components/VerificationQueues";
import {
  parseVerificationQueue,
  type VerificationQueueData,
  type VerificationRow,
} from "./lib/verification-display";

export const dynamic = "force-dynamic";
const QUEUE_LIMIT = 50;

interface PersonName {
  first_name: string | null;
  last_name: string | null;
  email: string | null;
}

function personLabel(person: PersonName | null, fallback: string) {
  return (
    `${person?.first_name ?? ""} ${person?.last_name ?? ""}`.trim() ||
    person?.email ||
    fallback
  );
}

export default async function VerificationPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const initialQueue = parseVerificationQueue((await searchParams).tab);
  const supabase = await createClient();

  // All three queues load together so switching tabs is instant on the
  // client. Each is one request: related names, apartments and cover images
  // are embedded, and the pending total comes back as the row count.
  // The admin check runs alongside instead of before: RLS already limits
  // what a non-admin could read, and nothing renders unless it passes.
  const [, userQueue, apartmentQueue, documentQueue] = await Promise.all([
    requireAdmin(),
    supabase
      .from("user_verifications")
      .select(
        "id, id_type, submitted_at, applicant:users!user_verifications_user_id_fkey(first_name, last_name, email, avatar_url)",
        { count: "exact" },
      )
      .eq("status", "pending")
      .order("submitted_at", { ascending: true })
      .limit(QUEUE_LIMIT),
    supabase
      .from("apartment_verifications")
      .select(
        "id, submitted_at, apartment:apartments!apartment_verifications_apartment_id_fkey(name, city, apartment_images(url, url_thumb))",
        { count: "exact" },
      )
      .eq("status", "pending")
      .eq("apartment.apartment_images.is_cover", true)
      .limit(1, { referencedTable: "apartment.apartment_images" })
      .order("submitted_at", { ascending: true })
      .limit(QUEUE_LIMIT),
    supabase
      .from("passport_documents")
      .select(
        "id, doc_type, requested_at, owner:users!passport_documents_user_id_fkey(first_name, last_name, email)",
        { count: "exact" },
      )
      .eq("review_status", "pending")
      .order("requested_at", { ascending: true })
      .limit(QUEUE_LIMIT),
  ]);

  for (const [name, result] of [
    ["users", userQueue],
    ["apartments", apartmentQueue],
    ["documents", documentQueue],
  ] as const) {
    if (result.error)
      console.error(`Admin ${name} verification queue failed`, result.error);
  }

  const userRows: VerificationRow[] = (
    (userQueue.data ?? []) as unknown as Array<{
      id: string;
      id_type: string;
      submitted_at: string;
      applicant: (PersonName & { avatar_url: string | null }) | null;
    }>
  ).map((item) => ({
    id: item.id,
    label: personLabel(item.applicant, "Unknown applicant"),
    detail: `Document: ${item.id_type}`,
    submittedAt: item.submitted_at,
    image: item.applicant?.avatar_url ?? null,
  }));

  const apartmentRows: VerificationRow[] = (
    (apartmentQueue.data ?? []) as unknown as Array<{
      id: string;
      submitted_at: string;
      apartment: {
        name: string | null;
        city: string | null;
        apartment_images: { url: string; url_thumb: string | null }[];
      } | null;
    }>
  ).map((item) => {
    const cover = item.apartment?.apartment_images[0];
    return {
      id: item.id,
      label: item.apartment?.name || "Unknown apartment",
      detail: item.apartment?.city || "Location unavailable",
      submittedAt: item.submitted_at,
      image: cover?.url_thumb ?? cover?.url ?? null,
    };
  });

  const documentRows: VerificationRow[] = (
    (documentQueue.data ?? []) as unknown as Array<{
      id: string;
      doc_type: string;
      requested_at: string | null;
      owner: PersonName | null;
    }>
  ).map((item) => ({
    id: item.id,
    label: personLabel(item.owner, "Unknown tenant"),
    detail: `Document: ${item.doc_type}`,
    submittedAt: item.requested_at ?? new Date().toISOString(),
    image: null,
  }));

  const queues: VerificationQueueData = {
    users: { rows: userRows, count: userQueue.count ?? 0 },
    apartments: { rows: apartmentRows, count: apartmentQueue.count ?? 0 },
    documents: { rows: documentRows, count: documentQueue.count ?? 0 },
  };
  const hasError = [userQueue, apartmentQueue, documentQueue].some((result) =>
    Boolean(result.error),
  );

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 p-4">
      <div>
        <h1 className="flex items-center gap-2 font-nunito text-3xl text-primary font-bold">
          <div className="flex size-11 items-center justify-center rounded-lg bg-primary/10">
            <IconShieldCheck size={28} className="text-primary" aria-hidden="true" />
          </div>
          Verification
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pending submissions are shown oldest first.
        </p>
      </div>
      {hasError ? (
        <p role="alert" className="text-sm text-danger">
          Unable to load every verification request. Refresh and try again.
        </p>
      ) : null}
      <VerificationQueues queues={queues} initialQueue={initialQueue} />
    </div>
  );
}
