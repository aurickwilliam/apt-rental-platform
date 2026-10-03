import { IconShieldCheck } from "@tabler/icons-react";
import { createClient } from "@repo/supabase/server";
import { requireAdmin } from "../_lib/require-admin";
import VerificationTabs from "./components/VerificationTabs";
import VerificationResults from "./components/VerificationResults";
import VerificationEmptyState from "./components/VerificationEmptyState";
import type { VerificationRow } from "./lib/verification-display";

export const dynamic = "force-dynamic";

export default async function VerificationPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  await requireAdmin();
  const tab = (await searchParams).tab;
  const selected =
    tab === "apartments" ? "apartments" : tab === "documents" ? "documents" : "users";
  const supabase = await createClient();
  const [userQueue, apartmentQueue, documentQueue, userCount, apartmentCount, documentCount] =
    await Promise.all([
      supabase
        .from("user_verifications")
        .select("id, user_id, id_type, submitted_at")
        .eq("status", "pending")
        .order("submitted_at", { ascending: true })
        .limit(50),
      supabase
        .from("apartment_verifications")
        .select("id, apartment_id, submitted_at")
        .eq("status", "pending")
        .order("submitted_at", { ascending: true })
        .limit(50),
      supabase
        .from("passport_documents")
        .select("id, user_id, doc_type, requested_at")
        .eq("review_status", "pending")
        .order("requested_at", { ascending: true })
        .limit(50),
      supabase
        .from("user_verifications")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending"),
      supabase
        .from("apartment_verifications")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending"),
      supabase
        .from("passport_documents")
        .select("id", { count: "exact", head: true })
        .eq("review_status", "pending"),
    ]);
  const [profiles, apartments, docOwners] = await Promise.all([
    userQueue.data?.length
      ? supabase
          .from("users")
          .select("id, first_name, last_name, email, avatar_url")
          .in(
            "id",
            userQueue.data.map((item) => item.user_id),
          )
      : Promise.resolve({ data: [] }),
    apartmentQueue.data?.length
      ? supabase
          .from("apartments")
          .select("id, name, city")
          .in(
            "id",
            apartmentQueue.data.map((item) => item.apartment_id),
          )
      : Promise.resolve({ data: [] }),
    documentQueue.data?.length
      ? supabase
          .from("users")
          .select("id, first_name, last_name, email")
          .in(
            "id",
            [...new Set(documentQueue.data.map((item) => item.user_id))],
          )
      : Promise.resolve({ data: [] }),
  ]);
  const docOwnerById = new Map(
    ((docOwners.data ?? []) as Array<{ id: string; first_name: string | null; last_name: string | null; email: string | null }>).map((profile) => [profile.id, profile]),
  );
  const profileById = new Map(
    (profiles.data ?? []).map((profile) => [profile.id, profile]),
  );
  const apartmentById = new Map(
    (apartments.data ?? []).map((apartment) => [apartment.id, apartment]),
  );
  const coverByApartmentId = new Map<string, string>();
  if (selected === "apartments" && apartmentQueue.data?.length) {
    const { data: covers } = await supabase
      .from("apartment_images")
      .select("apartment_id, url, url_thumb")
      .in(
        "apartment_id",
        apartmentQueue.data.map((item) => item.apartment_id),
      )
      .eq("is_cover", true);
    for (const cover of covers ?? []) {
      if (cover.apartment_id && !coverByApartmentId.has(cover.apartment_id)) {
        coverByApartmentId.set(cover.apartment_id, cover.url_thumb ?? cover.url);
      }
    }
  }
  const rows: VerificationRow[] =
    selected === "users"
      ? (userQueue.data ?? []).map((item) => {
          const profile = profileById.get(item.user_id) as unknown as {
            first_name: string | null;
            last_name: string | null;
            email: string | null;
            avatar_url: string | null;
          } | undefined;
          const label =
            `${profile?.first_name ?? ""} ${profile?.last_name ?? ""}`.trim() ||
            profile?.email ||
            "Unknown applicant";
          return {
            id: item.id,
            label,
            detail: `Document: ${item.id_type}`,
            submittedAt: item.submitted_at,
            image: profile?.avatar_url ?? null,
          };
        })
      : selected === "documents"
        ? (documentQueue.data ?? []).map((item) => {
            const owner = docOwnerById.get(item.user_id);
            const label =
              `${owner?.first_name ?? ""} ${owner?.last_name ?? ""}`.trim() ||
              owner?.email ||
              "Unknown tenant";
            return {
              id: item.id,
              label,
              detail: `Document: ${item.doc_type}`,
              submittedAt: item.requested_at ?? new Date().toISOString(),
              image: null,
            };
          })
        : (apartmentQueue.data ?? []).map((item) => {
          const apartment = apartmentById.get(item.apartment_id);
          return {
            id: item.id,
            label: apartment?.name || "Unknown apartment",
            detail: apartment?.city || "Location unavailable",
            submittedAt: item.submitted_at,
            image: coverByApartmentId.get(item.apartment_id) ?? null,
          };
        });
  const hasError = [userQueue, apartmentQueue, documentQueue, userCount, apartmentCount, documentCount].some(
    (result) => Boolean(result.error),
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
      <VerificationTabs
        selected={selected}
        userCount={userCount.count ?? 0}
        apartmentCount={apartmentCount.count ?? 0}
        documentCount={documentCount.count ?? 0}
      />
      {rows.length ? (
        <VerificationResults
          key={selected}
          rows={rows}
          selected={selected}
        />
      ) : (
        <VerificationEmptyState selected={selected} />
      )}
    </div>
  );
}
