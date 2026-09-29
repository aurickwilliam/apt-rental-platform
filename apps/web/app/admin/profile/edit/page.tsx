import Link from "next/link";
import { Card } from "@heroui/react";
import { IconChevronLeft } from "@tabler/icons-react";
import { createClient } from "@repo/supabase/server";
import ProfileForm, {
  type ProfileInitial,
} from "@/app/components/profile/ProfileForm";
import { requireAdmin } from "../../_lib/require-admin";

export const dynamic = "force-dynamic";

export default async function EditAdminProfilePage() {
  const admin = await requireAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("users")
    .select(
      "email, first_name, middle_name, last_name, suffix, gender, mobile_number, birth_date, street_address, barangay, city, province, postal_code",
    )
    .eq("id", admin.id)
    .single();

  if (error || !data) {
    console.error("Unable to load admin profile for editing", error);
    throw new Error("Unable to load your profile.");
  }

  const profile: ProfileInitial = data;
  return (
    <div className="mx-auto w-full max-w-7xl space-y-4 p-4">
      <Link
        href="/admin/profile"
        className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <IconChevronLeft size={16} aria-hidden="true" /> Back to profile
      </Link>
      <Card className="rounded-3xl border border-border bg-card p-4 shadow-none sm:p-5">
        <Card.Content className="p-0">
          <ProfileForm
            initial={profile}
            initialMode="edit"
            showMissingPrompt={false}
          />
        </Card.Content>
      </Card>
    </div>
  );
}
