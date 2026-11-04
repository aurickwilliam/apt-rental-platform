"use client";

import { Button } from "@heroui/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RECOMMENDATION_MESSAGES, type RecommendationStatus } from "@/lib/recommendations";

interface RecommendationNoticeProps {
  status: Exclude<RecommendationStatus, "ready">;
  basePath: string;
}

export default function RecommendationNotice({ status, basePath }: RecommendationNoticeProps) {
  const router = useRouter();
  const message = RECOMMENDATION_MESSAGES[status];
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <p role={status === "error" ? "alert" : undefined} className="font-semibold">{message.title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{message.description}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {status === "error" ? <Button size="sm" variant="secondary" onPress={() => router.refresh()}>Try again</Button> : (
          <Button size="sm" variant="secondary" onPress={() => {
            const url = new URL(window.location.href);
            url.searchParams.set("settings", "open");
            url.searchParams.set("settingsTab", "rental");
            window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
          }}>Update preferences</Button>
        )}
        <Link href={`${basePath}?sort=recent`} className="inline-flex items-center rounded-full px-3 py-2 text-sm font-semibold text-brand hover:underline focus-visible:outline-2 focus-visible:outline-primary">Browse all apartments</Link>
      </div>
    </div>
  );
}
