"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import AdminSettingsModal from "./profile/AdminSettingsModal";

export default function AdminSettingsOverlay() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const open = searchParams.get("settings") === "account";

  if (!open) return null;

  const close = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("settings");
    const query = params.toString();
    router.replace(
      `${pathname}${query ? `?${query}` : ""}${window.location.hash}`,
    );
  };

  return <AdminSettingsModal open onClose={close} />;
}
