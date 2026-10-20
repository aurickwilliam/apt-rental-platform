"use client";

import Link from "next/link";

import { Button } from "@heroui/react";

import { IconBrandAndroid } from "@tabler/icons-react";

/**
 * Points at the `/download` route so the published APK URL can change without
 * touching this component. The parent renders it only when
 * `NEXT_PUBLIC_APT_APK_URL` is configured — there is no dead button state.
 */
export default function AppDownloadButton() {
  return (
    <Link href="/download" className="inline-flex">
      <Button variant="outline">
        <IconBrandAndroid size={18} />
        Download for Android
      </Button>
    </Link>
  );
}
