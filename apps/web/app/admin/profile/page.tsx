import { Card } from "@heroui/react";
import { IconUserCog } from "@tabler/icons-react";
import { createClient } from "@repo/supabase/server";
import AccountActions from "./AccountActions";
import { requireAdmin } from "../_lib/require-admin";
import UserProfileHeader from "../users/[id]/components/UserProfileHeader";
import UserPersonalInfo from "../users/[id]/components/UserPersonalInfo";
import UserActivityTimeline, {
  type UserActivityEvent,
} from "../users/[id]/components/UserActivityTimeline";
import type { AdminUserDetail } from "../users/lib/user-display";

export const dynamic = "force-dynamic";

export default async function AdminProfilePage() {
  const admin = await requireAdmin();
  const supabase = await createClient();
  const [profileResult, activityResult] = await Promise.all([
    supabase
      .from("users")
      .select(
        "id, first_name, middle_name, last_name, suffix, email, mobile_number, gender, birth_date, street_address, barangay, city, province, postal_code, avatar_url, background_url, roles, account_status, created_at, updated_at",
      )
      .eq("id", admin.id)
      .single(),
    supabase
      .from("admin_audit_logs")
      .select("id, action, target_type, target_id, reason, created_at")
      .eq("admin_id", admin.id)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  if (profileResult.error || !profileResult.data) {
    console.error("Unable to load admin profile", profileResult.error);
    throw new Error("Unable to load your profile.");
  }

  // Generated types lag the live `users.roles` column (as on the admin user detail page).
  const profile = profileResult.data as unknown as Omit<
    AdminUserDetail,
    "is_suspended" | "suspension_reason" | "suspended_at" | "suspended_by"
  >;
  const user: AdminUserDetail = {
    ...profile,
    roles: profile.roles ?? [],
    is_suspended: false,
    suspension_reason: null,
    suspended_at: null,
    suspended_by: null,
  };
  const name =
    `${admin.first_name ?? ""} ${admin.last_name ?? ""}`.trim() ||
    admin.email ||
    "Administrator";
  const events: UserActivityEvent[] = (activityResult.data ?? []).map(
    (event) => ({
      ...event,
      admin_name: name,
    }),
  );

  if (activityResult.error) {
    console.error(
      "Unable to load admin account activity",
      activityResult.error,
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl p-4">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(300px,1fr)]">
        <div className="grid min-w-0 grid-cols-1 content-start gap-3">
          <UserProfileHeader
            user={user}
            showBackLink={false}
            suspensionSupported={false}
          />
          <UserPersonalInfo user={user} />
          {activityResult.error ? (
            <Card className="rounded-3xl border border-border bg-card p-4 shadow-none sm:p-5">
              <Card.Content className="p-0">
                <h2 className="font-nunito text-lg font-bold text-primary">
                  Recent activity
                </h2>
                <p className="mt-3 text-sm text-danger" role="alert">
                  Couldn&apos;t load your activity. Please try again later.
                </p>
              </Card.Content>
            </Card>
          ) : (
            <UserActivityTimeline
              events={events}
              title="Recent activity"
              emptyMessage="You have no recorded admin actions yet."
            />
          )}
        </div>
        <Card className="h-fit rounded-3xl border border-border bg-card p-4 shadow-none sm:p-5">
          <Card.Content className="p-0">
            <h2 className="flex items-center gap-2 font-nunito text-lg font-bold text-primary">
              <IconUserCog size={20} aria-hidden="true" /> Account actions
            </h2>
            <AccountActions />
          </Card.Content>
        </Card>
      </div>
    </div>
  );
}
