"use client";

import QRCode from "react-qr-code";
import { Button, Spinner } from "@heroui/react";
import { IconArrowLeft, IconClock, IconShieldCheck } from "@tabler/icons-react";

const FOCUS_RING =
  "transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

// Presentation-only verification states, shared by the live modal and the
// development preview. They take display data plus callbacks and never
// touch Supabase, sessions, or tokens themselves.

export function QrTile({
  value,
  label,
  size = 192,
}: {
  value: string;
  label: string;
  size?: number;
}) {
  return (
    <div className="rounded-xl border border-border bg-white p-3 shadow-sm">
      <QRCode value={value} size={size} aria-label={label} />
    </div>
  );
}

export function BackToOptionsButton({ onPress }: { onPress: () => void }) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="md"
      onPress={onPress}
      className={`min-h-10 border border-primary/25 bg-primary/10 px-6 text-sm font-semibold text-primary hover:bg-primary/15 ${FOCUS_RING}`}
    >
      <span className="flex items-center gap-1.5">
        <IconArrowLeft size={16} aria-hidden="true" />
        Back to options
      </span>
    </Button>
  );
}

export function QrScanPanel({
  qrValue,
  qrSize,
  countdownText,
  onBack,
}: {
  qrValue: string;
  qrSize: number;
  countdownText: string;
  onBack: () => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-[auto_1fr] sm:items-start">
      <div className="flex flex-col items-center gap-4">
        <QrTile value={qrValue} label="QR code linking to the mobile verification page" size={qrSize} />
        <BackToOptionsButton onPress={onBack} />
      </div>
      <div className="flex flex-col items-start gap-4 text-left">
        <div className="flex flex-col gap-1.5">
          <h1 className="mt-0 font-nunito text-2xl font-bold text-foreground">
            Scan with your phone
          </h1>
          <p className="max-w-sm text-sm leading-6 text-muted-foreground">
            Open your phone&apos;s camera and scan the QR code to continue
            verification.
          </p>
        </div>
        <p
          role="timer"
          aria-live="off"
          aria-atomic="true"
          className="flex items-center gap-1.5 text-sm font-medium tabular-nums text-foreground"
        >
          <IconClock size={14} className="text-muted-foreground" aria-hidden="true" />
          Code expires in {countdownText}
        </p>
        <p className="flex items-center gap-2 text-[13px] text-muted-foreground">
          <Spinner size="sm" aria-hidden="true" />
          Waiting for your phone…
        </p>
        <p className="max-w-sm text-[13px] leading-5 text-muted-foreground">
          Keep this window open while verifying on your phone.
        </p>
      </div>
    </div>
  );
}

export function QrExpiredPanel({
  isWorking,
  onRegenerate,
}: {
  isWorking: boolean;
  onRegenerate: () => void;
}) {
  return (
    <div className="flex flex-col items-start gap-2 text-left" role="status">
      <span className="flex items-center gap-2">
        <IconClock size={20} className="text-warning" aria-hidden="true" />
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Code expired
        </span>
      </span>
      <h1 className="font-nunito text-2xl font-bold text-foreground">
        This code has expired
      </h1>
      <p className="max-w-md text-sm leading-6 text-muted-foreground">
        Verification codes last 10 minutes. Generate a new one to continue.
      </p>
      <div className="pt-2">
        <Button
          type="button"
          size="md"
          variant="primary"
          onPress={onRegenerate}
          isDisabled={isWorking}
          isPending={isWorking}
          className={`min-h-10 px-8 text-sm font-semibold ${FOCUS_RING}`}
        >
          Generate a new code
        </Button>
      </div>
    </div>
  );
}

export function QrUnavailablePanel({
  showDevNote,
  onBack,
}: {
  showDevNote: boolean;
  onBack: () => void;
}) {
  return (
    <div className="flex flex-col items-start gap-2 text-left">
      <h1 className="font-nunito text-2xl font-bold text-foreground">
        Verification unavailable
      </h1>
      <p className="max-w-md text-sm leading-6 text-muted-foreground">
        Your phone can&apos;t open a verification link from this local address.
        Open APT using its public HTTPS address, then generate a new QR code.
      </p>
      {showDevNote && (
        <p className="max-w-md text-xs leading-5 text-muted-foreground">
          For local development, use a public HTTPS tunnel or a deployed testing URL.
        </p>
      )}
      <div className="pt-2">
        <BackToOptionsButton onPress={onBack} />
      </div>
    </div>
  );
}

export function QrCompletedPanel() {
  return (
    <div className="flex flex-col items-start gap-2 text-left">
      <span className="text-success" aria-hidden="true">
        <IconShieldCheck size={28} />
      </span>
      <h1 className="font-nunito text-2xl font-bold text-foreground">
        Verification submitted successfully
      </h1>
      <p className="max-w-md text-sm leading-6 text-muted-foreground">
        Status: Pending Review. Our team will review your documents shortly.
      </p>
    </div>
  );
}
