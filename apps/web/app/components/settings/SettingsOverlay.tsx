"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import SettingsModal from "./SettingsModal";

export const SETTINGS_QUERY_VALUE = "open";

export default function SettingsOverlay({
  iconSet = "lucide",
}: {
  iconSet?: "lucide" | "tabler";
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const open = searchParams.get("settings") === SETTINGS_QUERY_VALUE;

  if (!open) return null;

  const close = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("settings");
    const query = params.toString();
    router.replace(
      `${pathname}${query ? `?${query}` : ""}${window.location.hash}`,
    );
  };

  return <SettingsModal open onClose={close} iconSet={iconSet} />;
}
