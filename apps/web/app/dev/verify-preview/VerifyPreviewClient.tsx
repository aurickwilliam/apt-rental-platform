"use client";

import { useEffect, useState } from "react";

import { Button } from "@heroui/react";

import {
  QrCompletedPanel,
  QrExpiredPanel,
  QrScanPanel,
  QrUnavailablePanel,
} from "@/app/verify/components/VerifyStatePanels";

type PreviewState = "active" | "expired" | "unavailable" | "completed";

const STATES: Array<{ name: PreviewState; label: string }> = [
  { name: "active", label: "Active QR" },
  { name: "expired", label: "Expired code" },
  { name: "unavailable", label: "Unavailable" },
  { name: "completed", label: "Completed" },
];

// Mock display data only: this QR encodes an unusable placeholder URL and
// no Supabase calls are made from this page.
const MOCK_QR_VALUE = "https://preview.invalid/verify/mobile?token=mock-display-only";
const MOCK_START = Date.now() + 10 * 60 * 1000;

function formatMockCountdown(now: number): string {
  const remaining = Math.max(0, MOCK_START - now);
  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export default function VerifyPreviewClient() {
  const [previewState, setPreviewState] = useState<PreviewState>("active");
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (previewState !== "active") return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [previewState]);

  return (
    <div className="mx-auto flex w-full max-w-[800px] flex-col gap-6 px-4 py-8">
      <div className="flex flex-col gap-2 rounded-xl border border-warning/40 bg-warning/10 px-4 py-3">
        <p className="text-sm font-semibold text-foreground">
          Development preview — mock data only
        </p>
        <p className="text-[13px] leading-5 text-muted-foreground">
          The QR below encodes an unusable placeholder and creates no sessions,
          tokens, or records. Never available in production.
        </p>
        <div className="flex flex-wrap gap-2 pt-1" role="group" aria-label="Preview state">
          {STATES.map(({ name, label }) => (
            <Button
              key={name}
              type="button"
              size="sm"
              variant={previewState === name ? "primary" : "outline"}
              onPress={() => setPreviewState(name)}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card">
        <div className="flex flex-col gap-6 p-6 sm:p-8">
          <div className="flex flex-col text-left">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Identity verification · Preview
            </span>
          </div>
          {previewState === "active" && (
            <QrScanPanel
              qrValue={MOCK_QR_VALUE}
              qrSize={192}
              countdownText={formatMockCountdown(now)}
              onBack={() => setPreviewState("expired")}
            />
          )}
          {previewState === "expired" && (
            <QrExpiredPanel
              isWorking={false}
              onRegenerate={() => setPreviewState("active")}
            />
          )}
          {previewState === "unavailable" && (
            <QrUnavailablePanel showDevNote onBack={() => setPreviewState("active")} />
          )}
          {previewState === "completed" && <QrCompletedPanel />}
        </div>
      </div>
    </div>
  );
}
