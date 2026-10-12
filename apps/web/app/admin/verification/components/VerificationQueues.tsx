"use client";

import { useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { IconRefresh } from "@tabler/icons-react";
import { Button } from "@heroui/react";
import PendingList from "../../_components/filters/PendingList";
import VerificationTabs from "./VerificationTabs";
import VerificationResults from "./VerificationResults";
import VerificationEmptyState from "./VerificationEmptyState";
import {
  parseVerificationQueue,
  type VerificationQueue,
  type VerificationQueueData,
} from "../lib/verification-display";

interface VerificationQueuesProps {
  queues: VerificationQueueData;
  initialQueue: VerificationQueue;
}

/**
 * All three queues arrive with the page, so switching tabs only swaps which
 * one renders. The tab still lives in the URL: it is written with the
 * native History API, which Next.js syncs into useSearchParams without a
 * server round trip, so Back/Forward and shared links keep working.
 */
export default function VerificationQueues({
  queues,
  initialQueue,
}: VerificationQueuesProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isRefreshing, startTransition] = useTransition();
  const tab = searchParams.get("tab");
  const selected = tab ? parseVerificationQueue(tab) : initialQueue;
  const { rows } = queues[selected];

  function selectQueue(queue: VerificationQueue) {
    if (queue === selected) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", queue);
    window.history.pushState(null, "", `?${params.toString()}`);
  }

  function refresh() {
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <VerificationTabs
          selected={selected}
          onSelect={selectQueue}
          userCount={queues.users.count}
          apartmentCount={queues.apartments.count}
          documentCount={queues.documents.count}
        />
        <Button
          isIconOnly
          variant="tertiary"
          aria-label="Refresh verification queues"
          onPress={refresh}
          className="cursor-pointer"
        >
          <IconRefresh
            size={18}
            aria-hidden="true"
            className={isRefreshing ? "animate-spin" : undefined}
          />
        </Button>
      </div>
      <PendingList isPending={isRefreshing} label="Refreshing verification queues">
        {rows.length ? (
          <VerificationResults key={selected} rows={rows} selected={selected} />
        ) : (
          <VerificationEmptyState selected={selected} />
        )}
      </PendingList>
    </>
  );
}
