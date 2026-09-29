"use client";

import { Button } from "@heroui/react";
import { IconLogout, IconPencil, IconSettings } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { signOut } from "@/app/(auth)/actions/sign-out";

export default function AccountActions() {
  const router = useRouter();

  return (
    <div className="mt-3 flex flex-col gap-2">
      <Button
        variant="outline"
        className="min-h-11 w-full justify-start gap-3"
        onPress={() => router.push("/admin/profile/edit")}
      >
        <IconPencil size={20} aria-hidden="true" /> Edit profile
      </Button>
      <Button
        variant="outline"
        className="min-h-11 w-full justify-start gap-3"
        isDisabled
        aria-label="Settings, coming soon"
      >
        <IconSettings size={20} aria-hidden="true" /> Settings
        <span className="ml-auto text-xs">Coming soon</span>
      </Button>
      <form action={signOut}>
        <Button
          type="submit"
          variant="danger-soft"
          className="min-h-11 w-full justify-start gap-3"
        >
          <IconLogout size={20} aria-hidden="true" /> Sign out
        </Button>
      </form>
    </div>
  );
}
