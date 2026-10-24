import Link from "next/link";
import { Card } from "@heroui/react";
import { IconChevronLeft, IconPencil } from "@tabler/icons-react";
import { getServerIdentity } from "@/lib/server-identity";
import ProfileForm, {
  type ProfileInitial,
} from "@/app/components/profile/ProfileForm";
import { requireAdmin } from "../../_lib/require-admin";

export const dynamic = "force-dynamic";

export default async function EditAdminProfilePage() {
  await requireAdmin();
  const { user: authUser, profile: data, error } = await getServerIdentity();

  if (error || !data) {
    console.error("Unable to load admin profile for editing", error);
    throw new Error("Unable to load your profile.");
  }

  const media = data as unknown as ProfileInitial & {
    avatar_url: string | null;
    background_url: string | null;
  };
  const profile: ProfileInitial = {
    email: media.email, first_name: media.first_name, middle_name: media.middle_name,
    last_name: media.last_name, suffix: media.suffix, gender: media.gender,
    mobile_number: media.mobile_number, birth_date: media.birth_date,
    street_address: media.street_address, barangay: media.barangay, city: media.city,
    province: media.province, postal_code: media.postal_code,
  };
  const photoEditing = {
    authUserId: authUser!.id,
    avatarUrl: media.avatar_url,
    backgroundUrl: media.background_url,
  };
  return (
    <div className="w-full space-y-4 p-4">
      <header>
        <Link
          href="/admin/profile"
          className="inline-flex w-fit items-center gap-1 text-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <IconChevronLeft size={16} aria-hidden="true" /> Back to profile
        </Link>
        <h1 className="mt-3 flex items-center gap-2 font-nunito text-3xl font-bold text-primary">
          <span className="flex size-11 items-center justify-center rounded-lg bg-primary/10">
            <IconPencil size={28} className="text-primary" aria-hidden="true" />
          </span>
          Edit Profile
        </h1>
      </header>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(300px,1fr)]">
        <div className="grid min-w-0 grid-cols-1 content-start gap-4">
          <Card className="rounded-3xl border border-border bg-card p-4 shadow-none sm:p-5">
            <Card.Content className="p-0">
              <ProfileForm
                initial={profile}
                initialMode="edit"
                showMissingPrompt={false}
                align="left"
                successRedirectHref="/admin/profile"
                showEditHeading={false}
                photoEditing={photoEditing}
              />
            </Card.Content>
          </Card>
        </div>
      </div>
    </div>
  );
}
