"use client";

import { useSearchParams } from "next/navigation";
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
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab");
  const selected = tab ? parseVerificationQueue(tab) : initialQueue;
  const { rows } = queues[selected];

  function selectQueue(queue: VerificationQueue) {
    if (queue === selected) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", queue);
    window.history.pushState(null, "", `?${params.toString()}`);
  }

  return (
    <>
      <VerificationTabs
        selected={selected}
        onSelect={selectQueue}
        userCount={queues.users.count}
        apartmentCount={queues.apartments.count}
        documentCount={queues.documents.count}
      />
      {rows.length ? (
        <VerificationResults key={selected} rows={rows} selected={selected} />
      ) : (
        <VerificationEmptyState selected={selected} />
      )}
    </>
  );
}
