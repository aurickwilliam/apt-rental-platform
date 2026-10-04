"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import QRCode from "react-qr-code";
import { Button, Card, Spinner, toast } from "@heroui/react";
import {
  IconCamera,
  IconClock,
  IconDeviceMobile,
  IconQrcode,
  IconShieldCheck,
} from "@tabler/icons-react";

import {
  createVerificationSession,
  getVerificationSessionStatus,
} from "../actions";

type VerifyClientProps = {
  siteUrl: string;
  accountStatus: string | null;
  hasPending: boolean;
  onCompleted?: () => void;
  // When true, renders without the outer Card wrapper so a parent container
  // (e.g. Modal.Dialog) is the only card. Default false keeps the /verify
  // page output unchanged.
  embedded?: boolean;
};

type Phase =
  | { name: "idle" }
  | { name: "active"; token: string; expiresAt: string }
  | { name: "completed" }
  | { name: "expired" };

const POLL_INTERVAL_MS = 2500;

const HOW_IT_WORKS = [
  {
    Icon: IconQrcode,
    title: "Generate verification code",
    text: "Create a one-time code on this device.",
  },
  {
    Icon: IconDeviceMobile,
    title: "Scan with your phone",
    text: "Point your phone camera at the QR code.",
  },
  {
    Icon: IconCamera,
    title: "Capture ID and selfie",
    text: "Photograph your ID front, back, and a selfie while holding your ID.",
  },
  {
    Icon: IconClock,
    title: "Wait for review",
    text: "Our team reviews your submission shortly.",
  },
];

function formatCountdown(expiresAt: string, now: number): string {
  const remaining = Math.max(0, new Date(expiresAt).getTime() - now);
  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

// The QR encodes ONLY the opaque session token (no PII). A phone can only
// open it when siteUrl is a public HTTPS origin -- a localhost/LAN origin
// is unreachable from the phone's browser and must never be rendered as a
// scannable code. Returns the user-facing reason, or null when reachable.
function unreachableOriginReason(siteUrl: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(siteUrl);
  } catch {
    return "The verification link address looks invalid, so the QR code was hidden.";
  }
  const host = parsed.hostname.toLowerCase();
  if (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "0.0.0.0" ||
    host === "[::1]" ||
    host === "::1"
  ) {
    return "This page was opened via localhost, which your phone cannot reach. Open this site through its public HTTPS address (or set NEXT_PUBLIC_SITE_URL to it) and generate a new code.";
  }
  if (parsed.protocol !== "https:") {
    return "This page is not served over HTTPS, so your phone's browser would block the camera. Open this site through its public HTTPS address and generate a new code.";
  }
  return null;
}

function qrValue(siteUrl: string, token: string): string {
  return `${siteUrl.replace(/\/$/, "")}/verify/mobile?token=${token}`;
}

// Desktop side of the QR handoff: issues a 10-minute session, renders the QR
// (token only, no PII), then polls until the phone submits or it expires.
// The raw token lives in memory only -- never logged or persisted.
export default function VerifyClient({ siteUrl, accountStatus, hasPending, onCompleted, embedded = false }: VerifyClientProps) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>({ name: "idle" });
  const [isWorking, setIsWorking] = useState(false);
  const [copied, setCopied] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const copyQrLink = useCallback(async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.danger("Couldn't copy the link. Scan the QR code instead.", { timeout: 0 });
    }
  }, []);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  useEffect(() => stopPolling, [stopPolling]);

  // Tick the countdown while a code is live.
  useEffect(() => {
    if (phase.name !== "active") return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [phase.name]);

  const startSession = useCallback(async () => {
    setIsWorking(true);
    try {
      const result = await createVerificationSession();
      if (!result.ok) {
        toast.danger(result.error, { timeout: 0 });
        return;
      }
      setPhase({ name: "active", token: result.token, expiresAt: result.expiresAt });
      setNow(Date.now());
    } finally {
      setIsWorking(false);
    }
  }, []);

  // Poll session status; claim-free -- the phone consumes on submit.
  useEffect(() => {
    if (phase.name !== "active") return;

    const check = async () => {
      const result = await getVerificationSessionStatus(phase.token);
      if (!result.ok) {
        stopPolling();
        setPhase({ name: "expired" });
        return;
      }
      if (result.status === "completed") {
        stopPolling();
        setPhase({ name: "completed" });
        router.refresh();
        onCompleted?.();
      } else if (result.status === "expired") {
        stopPolling();
        setPhase({ name: "expired" });
      }
    };

    pollRef.current = setInterval(() => void check(), POLL_INTERVAL_MS);
    return stopPolling;
  }, [phase, router, stopPolling, onCompleted]);

  if (accountStatus === "verified") {
    const inner = (
      <>
        <span className="rounded-2xl bg-success/10 p-3 text-success">
          <IconShieldCheck size={embedded ? 28 : 32} aria-hidden="true" />
        </span>
        <h1 className="font-nunito text-xl font-bold sm:text-2xl">Your account is verified</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          Your identity has been approved. No further action is needed.
        </p>
      </>
    );
    if (embedded) {
      return <div className="flex flex-col items-center gap-4 text-center">{inner}</div>;
    }
    return (
      <Card className="border border-border bg-card p-6 text-card-foreground rounded-2xl sm:p-8">
        <Card.Content className="flex flex-col items-center gap-4 text-center">
          <span className="rounded-2xl bg-success/10 p-3 text-success">
            <IconShieldCheck size={32} aria-hidden="true" />
          </span>
          <h1 className="font-nunito text-xl font-bold sm:text-2xl">Your account is verified</h1>
          <p className="max-w-md text-sm text-muted-foreground">
            Your identity has been approved. No further action is needed.
          </p>
        </Card.Content>
      </Card>
    );
  }

  if (accountStatus === "pending" || hasPending) {
    const inner = (
      <>
        <Spinner size="lg" aria-hidden="true" />
        <h1 className="font-nunito text-xl font-bold sm:text-2xl">Verification submitted successfully</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          Status: Pending Review. Our team will review your documents shortly.
        </p>
      </>
    );
    if (embedded) {
      return <div className="flex flex-col items-center gap-4 text-center">{inner}</div>;
    }
    return (
      <Card className="border border-border bg-card p-6 text-card-foreground rounded-2xl sm:p-8">
        <Card.Content className="flex flex-col items-center gap-4 text-center">
          <Spinner size="lg" aria-hidden="true" />
          <h1 className="font-nunito text-xl font-bold sm:text-2xl">Verification submitted successfully</h1>
          <p className="max-w-md text-sm text-muted-foreground">
            Status: Pending Review. Our team will review your documents shortly.
          </p>
        </Card.Content>
      </Card>
    );
  }

  // Narrowed once here (narrowing does not cross into inline callbacks).
  const activeSession = phase.name === "active" ? phase : null;
  const activeQrValue = activeSession ? qrValue(siteUrl, activeSession.token) : null;
  const originBlocked = activeSession ? unreachableOriginReason(siteUrl) : null;

  const main = (
    <>
      <div className={`flex flex-col items-center text-center ${embedded ? "gap-2" : "gap-3"}`}>
        <span className={`rounded-2xl bg-primary/10 text-primary ${embedded ? "p-2" : "p-3"}`}>
          <IconShieldCheck size={embedded ? 24 : 32} aria-hidden="true" />
        </span>
        <h1 className={`font-nunito text-2xl font-bold${embedded ? "" : " sm:text-3xl"}`}>Verify your identity</h1>
        {embedded ? (
          <>
            <p className="max-w-lg text-sm text-muted-foreground">
              Verify your identity to keep the marketplace safe for everyone.
            </p>
            <p className="max-w-lg text-xs text-muted-foreground">
              You&apos;ll use your phone camera — no webcam needed on this device.
            </p>
          </>
        ) : (
          <>
            <p className="max-w-lg text-sm text-muted-foreground sm:text-base">
              Identity verification helps reduce fraudulent or impersonated
              accounts and keeps the marketplace safe for everyone.
            </p>
            <p className="max-w-lg text-sm text-muted-foreground">
              You&apos;ll use your phone camera to capture your ID and a selfie —
              no webcam needed on this device.
            </p>
          </>
        )}
      </div>

      {phase.name === "idle" && (
        <div className={`flex flex-col ${embedded ? "gap-5" : "gap-6"}`}>
          <ol className="grid list-none grid-cols-1 gap-3 p-0 sm:grid-cols-2">
            {HOW_IT_WORKS.map(({ Icon, title, text }, index) => (
              embedded ? (
                <li
                  key={title}
                  className="flex h-full items-center gap-3 rounded-xl border border-border p-3 sm:min-h-24"
                >
                  <span className="flex shrink-0 items-center gap-2">
                    <span className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                      {index + 1}
                    </span>
                    <Icon size={18} className="shrink-0 text-primary" aria-hidden="true" />
                  </span>
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="text-sm font-semibold">{title}</span>
                    <span className="text-sm text-muted-foreground">{text}</span>
                  </span>
                </li>
              ) : (
                <li
                  key={title}
                  className="flex items-start gap-3 rounded-xl border border-border p-3"
                >
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                    {index + 1}
                  </span>
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="flex items-center gap-1.5 text-sm font-semibold">
                      <Icon size={16} className="shrink-0 text-primary" aria-hidden="true" />
                      {title}
                    </span>
                    <span className="text-sm text-muted-foreground">{text}</span>
                  </span>
                </li>
              )
            ))}
          </ol>
          <div className="flex justify-center">
            <Button
              type="button"
              size="lg"
              variant="primary"
              onPress={() => void startSession()}
              isDisabled={isWorking}
              isPending={isWorking}
              className="px-8"
            >
              Generate verification code
            </Button>
          </div>
        </div>
      )}

      {activeSession && originBlocked && (
        <div className={`flex flex-col items-center text-center ${embedded ? "gap-3" : "gap-4"}`}>
          <p className="max-w-md rounded-xl border border-warning/40 bg-warning/10 px-4 py-3 text-sm font-medium text-foreground">
            {originBlocked}
          </p>
          <p className="max-w-md text-sm text-muted-foreground">
            No QR code was generated because a phone cannot open this address. Use the
            deployed public HTTPS URL, then generate a new code.
          </p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onPress={() => {
              stopPolling();
              setPhase({ name: "idle" });
            }}
          >
            Back
          </Button>
        </div>
      )}

      {activeSession && !originBlocked && activeQrValue && (
        <div className={`flex flex-col items-center ${embedded ? "gap-3" : "gap-4"}`}>
          <div className={`rounded-2xl border border-border bg-white shadow-sm ${embedded ? "p-4" : "p-6"}`}>
            <QRCode
              value={activeQrValue}
              size={embedded ? 200 : 240}
              aria-label="QR code linking to the mobile verification page"
            />
          </div>
          <p className="text-base font-semibold">Scan this QR code using your phone</p>
          <p className="text-sm text-muted-foreground">
            It opens this site in your phone&apos;s browser — the link holds only a
            one-time code, no personal information.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onPress={() => void copyQrLink(activeQrValue)}
          >
            {copied ? "Link copied" : "Copy link instead"}
          </Button>
          <p className="text-sm font-semibold tabular-nums text-muted-foreground" aria-live="polite">
            Code expires in {formatCountdown(activeSession.expiresAt, now)}
          </p>
          <p className="flex items-center gap-2 rounded-full bg-muted px-4 py-2 text-sm text-muted-foreground">
            <Spinner size="sm" aria-hidden="true" />
            Waiting for your phone...
          </p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onPress={() => {
              stopPolling();
              setPhase({ name: "idle" });
            }}
          >
            Cancel
          </Button>
        </div>
      )}

      {phase.name === "completed" && (
        <div className="flex flex-col items-center gap-4 text-center">
          <span className="rounded-2xl bg-success/10 p-3 text-success">
            <IconShieldCheck size={embedded ? 28 : 32} aria-hidden="true" />
          </span>
          <h2 className="font-nunito text-xl font-bold sm:text-2xl">Verification submitted successfully</h2>
          <p className="max-w-md text-sm text-muted-foreground">
            Status: Pending Review. Our team will review your documents shortly.
          </p>
        </div>
      )}

      {phase.name === "expired" && (
        <div className="flex flex-col items-center gap-4 text-center">
          <span className="rounded-2xl bg-warning/10 p-3 text-warning">
            <IconClock size={embedded ? 28 : 32} aria-hidden="true" />
          </span>
          <h2 className="font-nunito text-xl font-bold sm:text-2xl">This code has expired</h2>
          <p className="max-w-md text-sm text-muted-foreground">
            Verification codes last 10 minutes. Generate a new one to continue.
          </p>
          <Button
            type="button"
            size="lg"
            variant="primary"
            onPress={() => void startSession()}
            isDisabled={isWorking}
            isPending={isWorking}
            className="px-8"
          >
            Generate a new code
          </Button>
        </div>
      )}
    </>
  );

  if (embedded) {
    return <div className="flex flex-col gap-5 sm:gap-6">{main}</div>;
  }

  return (
    <Card className="border border-border bg-card p-6 text-card-foreground rounded-2xl sm:p-8 md:p-10">
      <Card.Content className="flex flex-col gap-6 sm:gap-8">{main}</Card.Content>
    </Card>
  );
}
