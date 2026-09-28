import Image from "next/image";
import Link from "next/link";
import { IconChevronLeft } from "@tabler/icons-react";
import { Avatar, Chip } from "@heroui/react";
import OperationForm from "../../../OperationForm";
import { setUserAccess } from "../../../actions/operations";
import {
  formatRoles,
  getFullName,
  getInitials,
  joinedFormatter,
  verificationChipColor,
  type AdminUserDetail,
} from "../../lib/user-display";

interface UserProfileHeaderProps {
  user: AdminUserDetail;
  suspensionSupported: boolean;
}

export default function UserProfileHeader({
  user,
  suspensionSupported,
}: UserProfileHeaderProps) {
  const name = getFullName(user);
  return (
    <section className="relative overflow-hidden rounded-3xl border border-border bg-card">
      <div className="relative h-28 w-full bg-muted sm:h-32">
        {user.background_url ? (
          <Image
            src={user.background_url}
            alt=""
            fill
            unoptimized
            className="object-cover"
          />
        ) : null}
        <Link
          href="/admin/users"
          className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-black/45 px-3 py-1.5 text-sm font-medium text-white backdrop-blur-sm hover:bg-black/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <IconChevronLeft size={16} aria-hidden="true" />
          Back to users
        </Link>
      </div>
      <div className="flex flex-wrap items-start gap-4 p-4">
        <Avatar
          size="lg"
          className="-mt-12 size-24 shrink-0 border-4 border-background bg-primary/10 text-primary"
        >
          {user.avatar_url ? (
            <Avatar.Image src={user.avatar_url} alt={name} />
          ) : null}
          <Avatar.Fallback className="bg-primary/10 text-xl text-primary">
            {getInitials(name)}
          </Avatar.Fallback>
        </Avatar>
        <div className="min-w-0 flex-1 basis-48">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-nunito text-2xl font-bold wrap-break-word">
              {name}
            </h1>
            <Chip
              size="sm"
              variant="soft"
              color={verificationChipColor(user.account_status)}
              className="shrink-0 capitalize"
            >
              {user.account_status}
            </Chip>
            {user.is_suspended ? (
              <Chip
                size="sm"
                variant="soft"
                color="danger"
                className="shrink-0"
              >
                Suspended
              </Chip>
            ) : null}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatRoles(user.roles)} · Joined{" "}
            {joinedFormatter.format(new Date(user.created_at))}
          </p>
          <p className="mt-0.5 text-sm text-muted-foreground wrap-break-word">
            {user.email ?? "No email"} · {user.mobile_number ?? "No mobile"}
          </p>
        </div>
        <div className="shrink-0">
          {suspensionSupported ? (
            <OperationForm
              id={user.id}
              decision={user.is_suspended ? "reactivate" : "suspend"}
              onSubmit={setUserAccess}
            />
          ) : null}
        </div>
      </div>
    </section>
  );
}
