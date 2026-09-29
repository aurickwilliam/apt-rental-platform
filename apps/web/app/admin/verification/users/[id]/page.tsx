import Link from "next/link";
import { notFound } from "next/navigation";
import { IconChevronLeft, IconShieldCheck } from "@tabler/icons-react";
import { createClient } from "@repo/supabase/server";
import { requireAdmin } from "../../../_lib/require-admin";
import { reviewUserVerification } from "../../../actions/verification";
import UserProfileHeader from "../../../users/[id]/components/UserProfileHeader";
import UserPersonalInfo from "../../../users/[id]/components/UserPersonalInfo";
import UserActivityTimeline, {
  type UserActivityEvent,
} from "../../../users/[id]/components/UserActivityTimeline";
import type { AdminUserDetail } from "../../../users/lib/user-display";
import { ReviewForm } from "../../ReviewForm";
import VerificationDocuments from "./components/VerificationDocuments";
import VerificationStatusCard from "./components/VerificationStatusCard";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function UserVerificationReviewPage({ params }: PageProps) {
  await requireAdmin();
  const { id } = await params;
  const supabase = await createClient();
  const { data: verification, error: verificationError } = await supabase
    .from("user_verifications")
    .select("id, user_id, id_type, id_front_path, id_back_path, selfie_path, status, submitted_at, reviewed_at, reviewed_by, rejection_reason")
    .eq("id", id)
    .maybeSingle();

  if (verificationError) {
    console.error("Admin user verification lookup failed", verificationError);
    throw new Error("Unable to load the verification. Refresh and try again.");
  }
  if (!verification) notFound();

  const [userResult, attemptsResult, reviewerResult] = await Promise.all([
    supabase
      .from("users")
      .select("id, first_name, middle_name, last_name, suffix, email, mobile_number, gender, birth_date, street_address, barangay, city, province, postal_code, avatar_url, background_url, roles, account_status, created_at, updated_at")
      .eq("id", verification.user_id)
      .maybeSingle(),
    supabase
      .from("user_verifications")
      .select("id, submitted_at")
      .eq("user_id", verification.user_id)
      .order("submitted_at", { ascending: false })
      .limit(20),
    verification.reviewed_by
      ? supabase
          .from("users")
          .select("first_name, last_name, email")
          .eq("id", verification.reviewed_by)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);

  if (userResult.error) {
    console.error("Admin verification applicant lookup failed", userResult.error);
    throw new Error("Unable to load the applicant. Refresh and try again.");
  }
  if (!userResult.data) notFound();
  if (reviewerResult.error) {
    console.error("Admin verification reviewer lookup failed", reviewerResult.error);
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
  const attempts = attemptsResult.data ?? [];
  if (!attempts.some((attempt) => attempt.id === verification.id)) {
    attempts.push({ id: verification.id, submitted_at: verification.submitted_at });
  }
  const attemptIds = [...new Set([verification.id, ...attempts.map((item) => item.id)])];
  const [auditResult, ...signedUrls] = await Promise.all([
    supabase
      .from("admin_audit_logs")
      .select("id, action, target_type, target_id, reason, created_at, admin:users!admin_audit_logs_admin_id_fkey(first_name,last_name,email)")
      .eq("target_type", "user_verification")
      .in("target_id", attemptIds)
      .order("created_at", { ascending: false })
      .limit(20),
    ...[
      verification.id_front_path,
      verification.id_back_path,
      verification.selfie_path,
    ].map(async (path) =>
      path
        ? supabase.storage.from("user-verification").createSignedUrl(path, 60 * 10)
        : null,
    ),
  ]);

  if (attemptsResult.error || auditResult.error) {
    console.error("Admin verification activity lookup failed", attemptsResult.error ?? auditResult.error);
  }
  const labels = ["ID front", "ID back", "Selfie"];
  const images = labels.map((label, index) => {
    const result = signedUrls[index];
    if (result?.error) console.error(`Admin verification ${label} preview failed`, result.error);
    return { label, url: result?.data?.signedUrl ?? null };
  });

  const activityEvents: UserActivityEvent[] = [
    ...attempts.map((attempt) => ({
      id: `submitted-${attempt.id}`,
      action: "Verification submitted",
      target_type: "user_verification",
      target_id: attempt.id,
      reason: null,
      created_at: attempt.submitted_at,
      admin_name: "Applicant",
    })),
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
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 20);
  const reviewer = reviewerResult.data;
  const reviewerName = reviewer
    ? `${reviewer.first_name ?? ""} ${reviewer.last_name ?? ""}`.trim() || reviewer.email
    : null;

  return (
    <div className={`mx-auto w-full max-w-7xl space-y-4 p-4 ${verification.status === "pending" ? "pb-48 md:pb-28" : ""}`}>
      <header>
        <Link
          href="/admin/verification"
          className="inline-flex items-center gap-1 rounded-md text-sm font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <IconChevronLeft size={18} aria-hidden="true" />
          Back to verification table
        </Link>
        <h1 className="mt-3 flex items-center gap-2 font-nunito text-3xl font-bold text-primary">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <IconShieldCheck size={28} aria-hidden="true" />
          </span>
          Account Verification
        </h1>
      </header>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(300px,1fr)]">
        <div className="grid min-w-0 grid-cols-1 content-start gap-3">
          <UserProfileHeader user={user} suspensionSupported={false} showBackLink={false} headingLevel="h2" />
          <UserPersonalInfo user={user} />
          <VerificationDocuments images={images} idType={verification.id_type} />
          <UserActivityTimeline
            events={activityEvents}
            title="Verification activity"
            emptyMessage="No verification activity yet"
          />
        </div>
        <div className="min-w-0">
          <VerificationStatusCard
            accountStatus={user.account_status}
            status={verification.status}
            submittedAt={verification.submitted_at}
            reviewedAt={verification.reviewed_at}
            reviewerName={reviewerName}
            rejectionReason={verification.rejection_reason}
          />
        </div>
      </div>

      {verification.status === "pending" ? (
        <ReviewForm verificationId={verification.id} onReview={reviewUserVerification} sticky />
      ) : null}
    </div>
  );
}
