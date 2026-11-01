"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useVerificationDevice } from "@/hooks/use-verification-device";
import { mobileVerificationHref } from "@/lib/mobile-verification-navigation";
import PhoneVerificationMethods from "./PhoneVerificationMethods";

import QRCode from "react-qr-code";
import { Button, Card, Spinner, toast } from "@heroui/react";
import {
  IconArrowLeft,
  IconArrowRight,
  IconBrandAndroid,
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
import type { SessionResult } from "../actions";
import DesktopVerifyWizard, {
  type DesktopWizardStep,
} from "./DesktopVerifyWizard";
import {
  QrCompletedPanel,
  QrExpiredPanel,
  QrScanPanel,
  QrUnavailablePanel,
} from "./VerifyStatePanels";

type VerifyClientProps = {
  siteUrl: string;
  accountStatus: string | null;
  hasPending: boolean;
  onCompleted?: () => void;
  onNavigate?: () => void;
  // When true, renders without the outer Card wrapper so a parent container
  // (e.g. Modal.Dialog) is the only card. Default false keeps the /verify
  // page output unchanged.
  embedded?: boolean;
};

type Phase =
  | { name: "idle" }
  | { name: "apk" }
  | { name: "desktop" }
  | { name: "active"; token: string; expiresAt: string }
  | { name: "completed" }
  | { name: "expired" };

const POLL_INTERVAL_MS = 2500;

const HOW_IT_WORKS = [
  {
    Icon: IconQrcode,
    title: "Generate a code",
    text: "A one-time code is created on this device.",
  },
  {
    Icon: IconDeviceMobile,
    title: "Continue on your phone",
    text: "Scan the code to open the secure link.",
  },
  {
    Icon: IconCamera,
    title: "Capture ID and selfie",
    text: "Photograph your valid ID and a self-photo.",
  },
  {
    Icon: IconClock,
    title: "Get reviewed",
    text: "We confirm your submission shortly.",
  },
];

function formatCountdown(expiresAt: string, now: number): string {
  const remaining = Math.max(0, new Date(expiresAt).getTime() - now);
  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

// Whether the blocked origin is a local/dev address (as opposed to a
// malformed URL): only then is tunnel-oriented guidance relevant.
function isUnreachableDevOrigin(siteUrl: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(siteUrl);
  } catch {
    return false;
  }
  const host = parsed.hostname.toLowerCase();
  return (
    parsed.protocol !== "https:" ||
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "0.0.0.0" ||
    host === "[::1]" ||
    host === "::1" ||
    host.endsWith(".local")
  );
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

// Download link for the Android APK, published only after a real,
// tested preview build exists. Null unless NEXT_PUBLIC_ANDROID_APK_URL
// is set — the modal must never advertise a download it cannot fulfill.
function resolveApkUrl(): string | null {
  const raw = process.env.NEXT_PUBLIC_ANDROID_APK_URL?.trim();
  return raw ? raw : null;
}

// The APK download QR must point at a legitimate public HTTPS address:
// phones cannot fetch localhost targets, and plain HTTP risks tampering
// with the installer. Returns the URL, or null when it must not render.
function validApkDownloadUrl(raw: string | null): string | null {
  if (!raw) return null;
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return null;
  }
  if (parsed.protocol !== "https:") return null;
  const host = parsed.hostname.toLowerCase();
  if (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "0.0.0.0" ||
    host === "[::1]" ||
    host === "::1" ||
    host.endsWith(".local")
  ) {
    return null;
  }
  return raw;
}

const FOCUS_RING =
  "transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

const DESKTOP_HEADER_COPY: Record<
  DesktopWizardStep,
  { title: string; sub: string }
> = {
  id: {
    title: "Government ID",
    sub: "Choose your ID type, then capture or upload both sides.",
  },
  selfie: {
    title: "Take your selfie",
    sub: "Use your webcam to take a live photo holding your ID.",
  },
  review: {
    title: "Review your submission",
    sub: "Check if everything looks right, then submit for review.",
  },
};

// Idle-state method picker (modal only): QR browser verification is the
// primary working path; the Android app option opens phone-first download
// guidance and never starts a download on this device.
function EmbeddedMethodPicker({
  apkReady,
  isWorking,
  onGenerate,
  onShowApk,
}: {
  apkReady: boolean;
  isWorking: boolean;
  onGenerate: () => void;
  onShowApk: () => void;
}) {
  return (
    <div className="grid grid-cols-1 items-stretch gap-3 sm:grid-cols-2">
        <div className="flex h-full flex-col gap-4 rounded-xl border border-primary/30 bg-card p-5 sm:p-6">
          <span className="flex min-h-6 w-full items-center gap-2">
            <IconQrcode size={18} className="shrink-0 text-primary" aria-hidden="true" />
            <span className="text-sm font-semibold whitespace-nowrap text-foreground">Verify on your phone</span>
          </span>
          <p className="text-[13px] leading-6 text-muted-foreground">
            Scan a QR code to verify in your mobile browser. Works on Android
            and iPhone.
          </p>
          <div className="mt-auto flex justify-start pt-2">
            <Button
              type="button"
              size="md"
              variant="primary"
              onPress={onGenerate}
              isDisabled={isWorking}
              isPending={isWorking}
              className={`min-h-10 w-full px-6 text-sm font-semibold ${FOCUS_RING}`}
            >
              Generate QR code
            </Button>
          </div>
        </div>
        <div className="flex h-full flex-col gap-4 rounded-xl border border-border bg-card p-5 sm:p-6">
          <span className="flex min-h-6 items-center gap-2">
            <IconBrandAndroid size={18} className="shrink-0 text-primary" aria-hidden="true" />
            <span className="text-sm font-semibold text-foreground">Verify with Android app</span>
          </span>
          {apkReady ? (
            <>
              <p className="text-[13px] leading-6 text-muted-foreground">
                Install APT on your Android device and complete verification
                in the app.
              </p>
              <div className="mt-auto flex justify-start pt-2">
                <Button
                  type="button"
                  size="md"
                  variant="ghost"
                  onPress={onShowApk}
                  className={`min-h-10 w-full border border-primary/25 bg-primary/10 px-6 text-sm font-semibold text-primary hover:bg-primary/15 ${FOCUS_RING}`}
                >
                  Get Android app
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="text-[13px] leading-6 text-muted-foreground">
                The Android app isn&apos;t available yet. Browser verification
                works today. No download needed.
              </p>
              <div className="mt-auto pt-4">
                <Button
                  type="button"
                  size="md"
                  variant="outline"
                  isDisabled
                  className="min-h-10 w-full px-6 text-sm font-semibold"
                >
                  APK coming soon
                </Button>
              </div>
            </>
          )}
        </div>
    </div>
  );
}

// Desktop side of the QR handoff: issues a 10-minute session, renders the QR
// (token only, no PII), then polls until the phone submits or it expires.
// The raw token lives in memory only -- never logged or persisted.
export default function VerifyClient({ siteUrl, accountStatus, hasPending, onCompleted, onNavigate, embedded = false }: VerifyClientProps) {
  const router = useRouter();
  const device = useVerificationDevice();
  const isPhone = device !== null && device !== "desktop";
  const [phase, setPhase] = useState<Phase>({ name: "idle" });
  const [isWorking, setIsWorking] = useState(false);
  const [isNavigating, startNavigation] = useTransition();
  const [now, setNow] = useState(() => Date.now());
  const [desktopStep, setDesktopStep] = useState<DesktopWizardStep>("id");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Prefetched session so Generate feels instant. Created only while the
  // modal picker is visible (never on page load); the click path reuses it
  // when still fresh and falls back to a live request otherwise.
  const prefetchedRef = useRef<Promise<SessionResult> | null>(null);
  const startingRef = useRef(false);

  useEffect(() => {
    if (!embedded || device !== "desktop" || accountStatus === "verified" || accountStatus === "pending" || hasPending || phase.name !== "idle" || prefetchedRef.current) return;
    prefetchedRef.current = createVerificationSession().catch(
      (): SessionResult => ({ ok: false, error: "prefetch" }),
    );
  }, [embedded, device, accountStatus, hasPending, phase.name]);

  const handleDesktopStepChange = useCallback((step: DesktopWizardStep) => {
    setDesktopStep(step);
  }, []);

  const handleShowDesktop = useCallback(() => {
    setDesktopStep("id");
    setPhase({ name: "desktop" });
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

  const startSession = useCallback(async (method: "qr" | "phone" = "qr") => {
    if (startingRef.current) return;
    startingRef.current = true;
    setIsWorking(true);
    try {
      // Prefer the prefetch when it resolved to a session with ample life
      // left; otherwise create one live. Either way the QR paints from a
      // single settled result.
      let result: SessionResult | null = null;
      if (prefetchedRef.current) {
        const prefetched = await prefetchedRef.current;
        prefetchedRef.current = null;
        if (
          prefetched.ok &&
          new Date(prefetched.expiresAt).getTime() - Date.now() > 60_000
        ) {
          result = prefetched;
        }
      }
      result ??= await createVerificationSession();
      if (!result.ok) {
        // Swallow the silent-prefetch sentinel; surface real failures.
        if (result.error !== "prefetch") {
          toast.danger(result.error, { timeout: 0 });
        }
        return;
      }
      if (method === "phone") {
        const returnTo = new URL(window.location.href).searchParams.get("returnTo");
        startNavigation(() => {
          // Retire the source dialog before leaving, so Back cannot restore
          // an open modal or its submission lock from the router cache.
          onNavigate?.();
          router.push(mobileVerificationHref(result.token, returnTo));
        });
        return;
      }
      setPhase({ name: "active", token: result.token, expiresAt: result.expiresAt });
      setNow(Date.now());
    } catch {
      console.error("Could not start identity verification.");
      toast.danger("Couldn't start verification. Please try again.", { timeout: 0 });
    } finally {
      startingRef.current = false;
      setIsWorking(false);
    }
  }, [router, onNavigate]);

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
        <span className="flex items-center gap-2 text-success">
          <IconShieldCheck size={20} aria-hidden="true" />
          <span className="text-[11px] font-semibold uppercase tracking-wider">Identity verification</span>
        </span>
        <h1 className="font-nunito text-xl font-bold text-foreground">Your account is verified</h1>
        <p className="max-w-md text-sm leading-6 text-muted-foreground">
          Your identity has been approved. No further action is needed.
        </p>
      </>
    );
    if (embedded) {
      return <div className="flex flex-col items-start gap-2 text-left">{inner}</div>;
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
    if (embedded) {
      return (
        <div className="flex flex-col items-start gap-2 text-left">
          <Spinner size="lg" aria-hidden="true" />
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Identity verification
          </p>
          <h1 className="font-nunito text-xl font-bold text-foreground">
            Verification submitted successfully
          </h1>
          <p className="max-w-md text-sm leading-6 text-muted-foreground">
            Status: Pending Review. Our team will review your documents shortly.
          </p>
        </div>
      );
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

  if (device === null) {
    return <div className="flex items-center justify-center gap-3 p-6" role="status"><Spinner aria-hidden="true" /><span className="text-sm text-muted-foreground">Loading verification…</span></div>;
  }

  // Narrowed once here (narrowing does not cross into inline callbacks).
  const activeSession = phase.name === "active" ? phase : null;
  const activeQrValue = activeSession ? qrValue(siteUrl, activeSession.token) : null;
  const originBlocked = activeSession ? unreachableOriginReason(siteUrl) : null;
  // APK download target for the guide below. This URL is never mixed with
  // verification tokens: it only locates the installer.
  const apkDownloadUrl =
    phase.name === "apk" ? validApkDownloadUrl(resolveApkUrl()) : null;

  // Contextual modal header: the wizard states own their titles, while
  // session states (active/expired/unavailable/completed) render headings
  // inside their panels -- so the shared header collapses to the eyebrow
  // and titles are never duplicated.
  const headerCopy =
    phase.name === "desktop"
      ? DESKTOP_HEADER_COPY[desktopStep]
      : {
          title: "Verify your identity",
          sub: isPhone ? "Use your phone's camera to capture your ID and selfie securely." : "Choose how you'd like to verify your identity using your phone.",
        };

  // Session states (active/expired/unavailable/completed) render their own
  // headings inside their panels; the shared header collapses to the
  // eyebrow so titles are never duplicated.
  const showFullHeader =
    phase.name === "idle" || phase.name === "apk" || phase.name === "desktop";

  const main = (
    <>
      {embedded || isPhone ? (
        <div className="flex flex-col text-left">
          <span className="flex items-center gap-2">
            <IconShieldCheck size={20} className="text-primary" aria-hidden="true" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Identity verification
            </span>
          </span>
          {showFullHeader && (
            <>
              <h1 className="mt-1 font-nunito text-2xl font-bold text-foreground">{headerCopy.title}</h1>
              <p className="mt-2 max-w-lg text-sm leading-6 text-muted-foreground">
                {headerCopy.sub}
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="rounded-2xl bg-primary/10 p-3 text-primary">
            <IconShieldCheck size={32} aria-hidden="true" />
          </span>
          <h1 className="font-nunito text-2xl font-bold text-foreground sm:text-3xl">Verify your identity</h1>
          <p className="max-w-lg text-sm text-muted-foreground sm:text-base">
            Identity verification helps reduce fraudulent or impersonated
            accounts and keeps the marketplace safe for everyone.
          </p>
          <p className="max-w-lg text-sm text-muted-foreground">
            You&apos;ll use your phone camera to capture your ID and a selfie.
            No webcam needed on this device.
          </p>
        </div>
      )}

      {phase.name === "idle" &&
        (isPhone ? (
          <PhoneVerificationMethods
            isWorking={isWorking || isNavigating}
            onContinue={() => void startSession("phone")}
            androidApkUrl={device === "android" ? validApkDownloadUrl(resolveApkUrl()) : null}
          />
        ) : embedded ? (
          <div className="flex flex-col gap-4">
            <EmbeddedMethodPicker
              apkReady={validApkDownloadUrl(resolveApkUrl()) !== null}
              isWorking={isWorking}
              onGenerate={() => void startSession()}
              onShowApk={() => setPhase({ name: "apk" })}
            />
            <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 flex-col gap-0.5">
                <p className="text-sm font-semibold text-foreground">
                  Prefer using desktop?
                </p>
                <p className="text-[13px] leading-5 text-muted-foreground">
                  Verify with your webcam and ID photos.
                </p>
              </div>
              <Button
                type="button"
                size="md"
                variant="ghost"
                onPress={handleShowDesktop}
                className={`min-h-10 shrink-0 border border-primary/25 bg-primary/10 px-6 text-sm font-semibold text-primary hover:bg-primary/15 sm:w-auto ${FOCUS_RING}`}
              >
                <span className="flex items-center gap-1.5">
                  Verify here
                  <IconArrowRight size={16} aria-hidden="true" />
                </span>
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <ol className="grid list-none grid-cols-1 gap-3 p-0 sm:grid-cols-2">
              {HOW_IT_WORKS.map(({ Icon, title, text }, index) => (
                <li
                  key={title}
                  className="flex items-start gap-3 rounded-xl border border-border p-3"
                >
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                    {index + 1}
                  </span>
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                      <Icon size={16} className="shrink-0 text-primary" aria-hidden="true" />
                      {title}
                    </span>
                    <span className="text-sm text-muted-foreground">{text}</span>
                  </span>
                </li>
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
                className="px-8 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                Generate verification code
              </Button>
            </div>
          </div>
        ))}

      {phase.name === "apk" && (
        <div className="flex flex-col gap-6">
          {apkDownloadUrl ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-[auto_1fr] sm:items-start">
              <div className="flex justify-center sm:justify-start">
                <div className="rounded-xl border border-border bg-white p-3 shadow-sm">
                  <QRCode
                    value={apkDownloadUrl}
                    size={embedded ? 192 : 240}
                    aria-label="QR code linking to the APT Android app download"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-4 text-left">
                <div className="flex flex-col gap-1.5">
                  <p className="font-nunito text-lg font-bold text-foreground">Get APT on Android</p>
                  <p className="max-w-sm text-[13px] leading-6 text-muted-foreground">
                    Scanning downloads the APK to your Android phone. Nothing
                    installs on this computer.
                  </p>
                </div>
                <ol className="flex max-w-sm list-none flex-col gap-3 p-0 text-left">
                  {[
                    "Install APT and sign in with the same account.",
                    "Open Account Verification inside the Android app.",
                    "Capture your ID and selfie, then submit for review.",
                  ].map((step, index) => (
                    <li key={step} className="flex items-start gap-3">
                      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {index + 1}
                      </span>
                      <span className="text-[13px] leading-6 text-muted-foreground">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2 text-left">
              <p className="font-nunito text-lg font-bold text-foreground">
                The Android app isn&apos;t available yet
              </p>
              <p className="max-w-md text-sm leading-6 text-muted-foreground">
                There&apos;s no download configured right now. QR code
                verification works today. No download needed.
              </p>
            </div>
          )}
          <div className="flex flex-col items-stretch gap-3 border-t border-border pt-6 sm:flex-row sm:items-center">
            <Button
              type="button"
              variant="ghost"
              size="md"
              onPress={() => setPhase({ name: "idle" })}
              className={`min-h-10 w-full border border-primary/25 bg-primary/10 px-6 text-sm font-semibold text-primary hover:bg-primary/15 sm:w-auto ${FOCUS_RING}`}
            >
              <span className="flex items-center gap-1.5">
                <IconArrowLeft size={16} aria-hidden="true" />
                Back to options
              </span>
            </Button>
          </div>
        </div>
      )}

      {activeSession && originBlocked && (
        <QrUnavailablePanel
          showDevNote={isUnreachableDevOrigin(siteUrl)}
          onBack={() => {
            stopPolling();
            setPhase({ name: "idle" });
          }}
        />
      )}

      {activeSession && !originBlocked && activeQrValue && (
        <QrScanPanel
          qrValue={activeQrValue}
          qrSize={embedded ? 192 : 240}
          countdownText={formatCountdown(activeSession.expiresAt, now)}
          onBack={() => {
            stopPolling();
            setPhase({ name: "idle" });
          }}
        />
      )}

      {phase.name === "desktop" && (
        <DesktopVerifyWizard
          onStepChange={handleDesktopStepChange}
          onSubmitted={() => {
            stopPolling();
            setPhase({ name: "completed" });
            router.refresh();
            onCompleted?.();
          }}
          onBackToOptions={() => setPhase({ name: "idle" })}
        />
      )}

      {phase.name === "completed" && (
        embedded ? (
          <QrCompletedPanel />
        ) : (
          <div className="flex flex-col items-start gap-2 text-left">
            <span className="flex items-center gap-2 text-success">
              <IconShieldCheck size={20} aria-hidden="true" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Identity verification
              </span>
            </span>
            <h2 className="font-nunito text-xl font-bold text-foreground">Verification submitted successfully</h2>
            <p className="max-w-md text-sm leading-6 text-muted-foreground">
              Status: Pending Review. Our team will review your documents shortly.
            </p>
          </div>
        )
      )}

      {phase.name === "expired" && (
        <QrExpiredPanel
          isWorking={isWorking}
          onRegenerate={() => void startSession()}
        />
      )}
    </>
  );

  if (embedded) {
    return <div className="flex flex-col gap-6">{main}</div>;
  }

  return (
    <Card className="border border-border bg-card p-6 text-card-foreground rounded-2xl sm:p-8 md:p-10">
      <Card.Content className="flex flex-col gap-6 sm:gap-8">{main}</Card.Content>
    </Card>
  );
}
