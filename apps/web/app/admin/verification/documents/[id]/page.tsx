import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { IconChevronLeft, IconFileText, IconShieldCheck } from "@tabler/icons-react";
import { Card } from "@heroui/react";
import { createClient } from "@repo/supabase/server";
import { requireAdmin } from "../../../_lib/require-admin";
import { reviewPassportDocument } from "../../../actions/verification";
import UserProfileHeader from "../../../users/[id]/components/UserProfileHeader";
import UserPersonalInfo from "../../../users/[id]/components/UserPersonalInfo";
import UserActivityTimeline, {
  type UserActivityEvent,
} from "../../../users/[id]/components/UserActivityTimeline";
import type { AdminUserDetail } from "../../../users/lib/user-display";
import { ReviewForm } from "../../ReviewForm";
import VerificationStatusCard from "../../components/VerificationStatusCard";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PassportDocumentReviewPage({ params }: PageProps) {
  await requireAdmin();
  const { id } = await params;
  const supabase = await createClient();
  const { data: document, error: documentError } = await supabase
    .from("passport_documents")
    .select(
      "id, user_id, doc_type, storage_path, mime_type, expires_at, created_at, review_status, requested_at, reviewed_at, reviewed_by, rejection_reason, is_verified",
    )
    .eq("id", id)
    .maybeSingle();

  if (documentError) {
    console.error("Admin passport document lookup failed", documentError);
    throw new Error("Unable to load the document. Refresh and try again.");
  }
  if (!document) notFound();

  const [userResult, reviewerResult, auditResult, signedUrl] = await Promise.all([
    supabase
      .from("users")
      .select("id, first_name, middle_name, last_name, suffix, email, mobile_number, gender, birth_date, street_address, barangay, city, province, postal_code, avatar_url, background_url, roles, account_status, created_at, updated_at")
      .eq("id", document.user_id)
      .maybeSingle(),
    document.reviewed_by
      ? supabase
          .from("users")
          .select("first_name, last_name, email")
          .eq("id", document.reviewed_by)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    supabase
      .from("admin_audit_logs")
      .select("id, action, target_type, target_id, reason, created_at, admin:users!admin_audit_logs_admin_id_fkey(first_name,last_name,email)")
      .eq("target_type", "passport_document")
      .eq("target_id", document.id)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase.storage.from("application-documents").createSignedUrl(document.storage_path, 60 * 10),
  ]);

  if (userResult.error) {
    console.error("Admin passport owner lookup failed", userResult.error);
    throw new Error("Unable to load the applicant. Refresh and try again.");
  }
  if (!userResult.data) notFound();
  if (reviewerResult.error) {
    console.error("Admin passport reviewer lookup failed", reviewerResult.error);
  }
  if (auditResult.error) {
    console.error("Admin passport audit lookup failed", auditResult.error);
  }
  if (signedUrl.error) {
    console.error("Admin passport preview failed", signedUrl.error);
  }

  type UserBase = Omit<
    AdminUserDetail,
    "is_suspended" | "suspension_reason" | "suspended_at" | "suspended_by"
  >;
  const userBase = userResult.data as unknown as UserBase;
  const user: AdminUserDetail = {
    ...userBase,
    roles: userBase.roles ?? [],
    is_suspended: false,
    suspension_reason: null,
    suspended_at: null,
    suspended_by: null,
  };

  const reviewer = reviewerResult.data;
  const reviewerName = reviewer
    ? `${reviewer.first_name ?? ""} ${reviewer.last_name ?? ""}`.trim() || reviewer.email
    : null;

  const submittedAt = document.requested_at ?? document.created_at;

  const activityEvents: UserActivityEvent[] = [
    {
      id: `requested-${document.id}`,
      action: "Document submitted for review",
      target_type: "passport_document",
      target_id: document.id,
      reason: null,
      created_at: submittedAt,
      admin_name: "Applicant",
    },
    ...(auditResult.data ?? []).map((event) => ({
      id: event.id,
      action: event.action,
      target_type: event.target_type,
      target_id: event.target_id,
      reason: event.reason,
      created_at: event.created_at,
      admin_name:
        `${event.admin?.first_name ?? ""} ${event.admin?.last_name ?? ""}`.trim() ||
        event.admin?.email ||
        "Administrator",
    })),
  ]
    .filter((event) => Boolean(event.created_at))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 20);

  const previewUrl = signedUrl.data?.signedUrl ?? null;
  const isImage = (document.mime_type ?? "").toLowerCase().startsWith("image/");
  const isPending = document.review_status === "pending";

  return (
    <div className={`mx-auto w-full max-w-7xl space-y-4 p-4 ${isPending ? "pb-48 md:pb-28" : ""}`}>
      <header>
        <Link
          href="/admin/verification?tab=documents"
          className="inline-flex items-center gap-1 rounded-md text-sm font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <IconChevronLeft size={18} aria-hidden="true" />
          Back to verification table
        </Link>
        <h1 className="mt-3 flex items-center gap-2 font-nunito text-3xl font-bold text-primary">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <IconShieldCheck size={28} aria-hidden="true" />
          </span>
          Document Verification
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{document.doc_type}</p>
      </header>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(300px,1fr)]">
        <div className="grid min-w-0 grid-cols-1 content-start gap-3">
          <UserProfileHeader user={user} suspensionSupported={false} showBackLink={false} headingLevel="h2" />
          <UserPersonalInfo user={user} />
          <Card className="rounded-3xl border border-border bg-card p-4 shadow-none sm:p-5">
            <Card.Content className="p-0">
              <h2 className="flex items-center gap-2 font-nunito text-lg font-bold text-primary">
                <IconFileText size={20} aria-hidden="true" />
                {document.doc_type}
              </h2>
              <div className="mt-3 overflow-hidden rounded-2xl bg-muted">
                {previewUrl && isImage ? (
                  <Image
                    src={previewUrl}
                    alt={document.doc_type}
                    unoptimized
                    width={800}
                    height={600}
                    className="h-auto w-full object-contain"
                  />
                ) : previewUrl ? (
                  <div className="flex flex-col items-center gap-3 p-8 text-center">
                    <IconFileText size={40} className="text-muted-foreground" aria-hidden="true" />
                    <p className="text-sm text-muted-foreground">
                      Preview is not available for this file type.
                    </p>
                    <Link
                      href={previewUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      Open document
                    </Link>
                  </div>
                ) : (
                  <p className="p-8 text-center text-sm text-muted-foreground">
                    The document could not be loaded.
                  </p>
                )}
              </div>
            </Card.Content>
          </Card>
          <UserActivityTimeline
            events={activityEvents}
            title="Document activity"
            emptyMessage="No document activity yet"
          />
        </div>
        <div className="min-w-0">
          <VerificationStatusCard
            subjectLabel="Document"
            subjectStatus={document.review_status}
            status={document.review_status}
            submittedAt={submittedAt}
            reviewedAt={document.reviewed_at}
            reviewerName={reviewerName}
            rejectionReason={document.rejection_reason}
          />
        </div>
      </div>

      {isPending ? (
        <ReviewForm verificationId={document.id} kind="document" onReview={reviewPassportDocument} sticky />
      ) : null}
    </div>
  );
}
