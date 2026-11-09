"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Button, Card, Spinner, toast } from "@heroui/react";
import { IconCircleCheck, IconShieldCheck } from "@tabler/icons-react";
import { createClient as createBrowserClient } from "@repo/supabase/browser";

import { claimVerificationSession, submitVerificationSession } from "../../actions";
import MobileVerificationNavigation from "./MobileVerificationNavigation";
import MobileVerificationPhotoStep from "./MobileVerificationPhotoStep";
import VerificationIdSelector from "./VerificationIdSelector";
import { mobileVerificationHref } from "@/lib/mobile-verification-navigation";
import VerifySubmitConfirm from "../../components/VerifySubmitConfirm";
import {
  VERIFICATION_BUCKET as BUCKET,
  uploadVerificationCapture as uploadCapture,
} from "@/lib/verification-upload";

const FRONT_FILE = "id-front.jpg";
const BACK_FILE = "id-back.jpg";
const SELFIE_FILE = "selfie.jpg";
const PASSPORT_LABEL = "Passport";

type Capture = { file: File; url: string } | null;

type Claim =
  | { state: "claiming" }
  | { state: "needsAuth" }
  | { state: "error"; message: string }
  | { state: "ready"; userId: string; verificationId: string; expiresAt: string };

type Step = "requirements" | "idType" | "front" | "back" | "selfie" | "review";

const STEP_TITLES: Record<Step, string> = {
  requirements: "Verify your identity",
  idType: "Select your ID type",
  front: "ID front",
  back: "ID back",
  selfie: "Selfie with your ID",
  review: "Review your submission",
};

function revoke(capture: Capture) {
  if (capture) URL.revokeObjectURL(capture.url);
}

// Claim validates token + owner WITHOUT consuming: the session stays active
// while the wizard runs. Only the final submit consumes it atomically.
export default function MobileVerifyClient({ token, returnTo = null }: { token: string; returnTo?: string | null }) {
  const [claim, setClaim] = useState<Claim>({ state: "claiming" });
  const [step, setStep] = useState<Step>("requirements");
  const [idType, setIdType] = useState<string | null>(null);
  const [front, setFront] = useState<Capture>(null);
  const [back, setBack] = useState<Capture>(null);
  const [selfie, setSelfie] = useState<Capture>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const claimRef = useRef(false);
  const submittingRef = useRef(false);

  const needsBack = idType !== PASSPORT_LABEL;
  const capturesReady = Boolean(idType && front && selfie && (!needsBack || back));

  const doClaim = useCallback(async () => {
    setClaim({ state: "claiming" });
    const result = await claimVerificationSession(token);
    if (!result.ok) {
      if (/sign in/i.test(result.error)) setClaim({ state: "needsAuth" });
      else setClaim({ state: "error", message: result.error });
      return;
    }
    setClaim({
      state: "ready",
      userId: result.userId,
      verificationId: result.verificationId,
      expiresAt: result.expiresAt,
    });
  }, [token]);

  useEffect(() => {
    if (claimRef.current) return;
    claimRef.current = true;
    void doClaim();
  }, [doClaim]);

  // Track every preview URL created so unmount revokes them all; retakes
  // revoke the replaced URL explicitly. All ref writes happen in handlers.
  const urlsRef = useRef<Set<string>>(new Set());
  useEffect(
    () => () => {
      urlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      urlsRef.current.clear();
    },
    [],
  );

  useEffect(() => {
    if (claim.state !== "ready") return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [claim.state]);

  const expired =
    claim.state === "ready" && new Date(claim.expiresAt).getTime() <= now;

  const steps: Step[] = useMemo(() => {
    const list: Step[] = ["requirements", "idType", "front"];
    if (needsBack) list.push("back");
    list.push("selfie", "review");
    return list;
  }, [needsBack]);

  const stepNumber = steps.indexOf(step) + 1;
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (claim.state !== "ready" || expired || submitted) return;
    headingRef.current?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [step, claim.state, expired, submitted]);

  const setCapture = useCallback(
    (kind: "front" | "back" | "selfie", file: File) => {
      const next = { file, url: URL.createObjectURL(file) };
      urlsRef.current.add(next.url);
      if (kind === "front") {
        if (front) {
          revoke(front);
          urlsRef.current.delete(front.url);
        }
        setFront(next);
      } else if (kind === "back") {
        if (back) {
          revoke(back);
          urlsRef.current.delete(back.url);
        }
        setBack(next);
      } else {
        if (selfie) {
          revoke(selfie);
          urlsRef.current.delete(selfie.url);
        }
        setSelfie(next);
      }
      setStep(kind === "front" ? (needsBack ? "back" : "selfie") : kind === "back" ? "selfie" : "review");
    },
    [front, back, selfie, needsBack],
  );

  const retakeCapture = (kind: "front" | "back" | "selfie") => {
    const capture = { front, back, selfie }[kind];
    if (capture) { revoke(capture); urlsRef.current.delete(capture.url); }
    if (kind === "front") setFront(null);
    else if (kind === "back") setBack(null);
    else setSelfie(null);
    setConfirmOpen(false);
    setStep(kind);
    headingRef.current?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "instant" });
  };

  const selectIdType = (value: string) => {
    if (idType !== value) {
      urlsRef.current.forEach(url => URL.revokeObjectURL(url));
      urlsRef.current.clear();
      setFront(null);
      setBack(null);
      setSelfie(null);
      setConfirmOpen(false);
    }
    setIdType(value);
  };

  const handleSubmit = useCallback(async () => {
    if (submittingRef.current || submitted || claim.state !== "ready" || Date.parse(claim.expiresAt) <= Date.now() || !idType || !front || !selfie || (needsBack && !back)) return;
    submittingRef.current = true;
    setIsSubmitting(true);
    try {
      const supabase = createBrowserClient();
      const prefix = `${claim.userId}/${claim.verificationId}`;
      const uploaded: string[] = [];
      try {
        await uploadCapture(supabase, `${prefix}/${FRONT_FILE}`, front.file, false);
        uploaded.push(`${prefix}/${FRONT_FILE}`);
        if (needsBack && back) {
          await uploadCapture(supabase, `${prefix}/${BACK_FILE}`, back.file, false);
          uploaded.push(`${prefix}/${BACK_FILE}`);
        }
        await uploadCapture(supabase, `${prefix}/${SELFIE_FILE}`, selfie.file, true);
        uploaded.push(`${prefix}/${SELFIE_FILE}`);
      } catch (error) {
        if (uploaded.length > 0) {
          await supabase.storage.from(BUCKET).remove(uploaded);
        }
        throw error;
      }

      const result = await submitVerificationSession(token, { idType });
      if (!result.ok) {
        toast.danger(result.error, { timeout: 0 });
        if (result.needsNewCode) {
          setClaim({ state: "error", message: result.error });
        }
        return;
      }
      // Success renders from the submitted flag below.
      setSubmitted(true);
    } catch (error) {
      toast.danger(
        error instanceof Error ? error.message : "Couldn't submit. Please try again.",
        { timeout: 0 },
      );
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  }, [claim, idType, front, back, selfie, needsBack, token, submitted]);

  if (claim.state === "claiming") {
    return <LoadingCard message="Checking your verification code..." />;
  }

  if (claim.state === "needsAuth") {
    // Same-account sign-in: `next` carries the opaque token only (no PII),
    // so a successful login returns to this exact page. Signing in never
    // consumes the session -- claim/submit stay read-only until final submit.
    const resumePath = mobileVerificationHref(token, returnTo);
    return (
      <Card className="mobile-verification-shell">
        <Card.Content className="flex flex-col items-center gap-3 text-center">
          <h1 className="font-nunito text-xl font-bold">Sign in on this phone</h1>
          <p className="text-sm text-muted-foreground">
            Sign in with the account that started verification, and
            you&apos;ll return here automatically. Your link stays valid for
            10 minutes, and nothing is submitted by signing in.
          </p>
          <Button
            type="button"
            variant="primary"
            onPress={() => {
              window.location.href = `/sign-in?next=${encodeURIComponent(resumePath)}`;
            }}
          >
            Go to sign in
          </Button>
          <Button type="button" variant="ghost" size="sm" onPress={() => void doClaim()}>
            I signed in — continue
          </Button>
        </Card.Content>
      </Card>
    );
  }

  if (claim.state === "error") {
    return (
      <Card className="mobile-verification-shell">
        <Card.Content className="flex flex-col items-center gap-3 text-center">
          <h1 className="font-nunito text-xl font-bold">This code can&apos;t be used</h1>
          <p className="text-sm text-muted-foreground">{claim.message}</p>
          <p className="text-sm text-muted-foreground">
            Return to your profile to start a new verification.
          </p>
        </Card.Content>
      </Card>
    );
  }

  if (expired && !submitted) {
    return (
      <Card className="mobile-verification-shell">
        <Card.Content className="flex flex-col items-center gap-3 text-center">
          <h1 className="font-nunito text-xl font-bold">This code has expired</h1>
          <p className="text-sm text-muted-foreground">
            Links last 10 minutes. Return to your profile to start a new verification.
          </p>
        </Card.Content>
      </Card>
    );
  }

  if (submitted) {
    return (
      <Card className="mobile-verification-shell">
        <Card.Content className="flex flex-col items-center gap-3 text-center">
          <IconShieldCheck size={40} className="text-success" aria-hidden="true" />
          <h1 className="font-nunito text-xl font-bold">Your verification has been submitted.</h1>
          <p className="text-sm text-muted-foreground">Status: Pending Review.</p>
        </Card.Content>
      </Card>
    );
  }

  return (
    <section className="mobile-verification-shell" data-step={step} aria-labelledby="mobile-verification-heading">
      <header className="mobile-verification-header">
        <div className="mobile-verification-step-line">
          <span className="mobile-verification-brand"><IconShieldCheck size={18} aria-hidden="true" />APT Passport</span>
          <span>Step {stepNumber} of {steps.length}</span>
        </div>
        <div className="mobile-verification-progress" role="progressbar" aria-valuenow={stepNumber} aria-valuemin={1} aria-valuemax={steps.length} aria-label="Verification progress" aria-valuetext={`Step ${stepNumber} of ${steps.length}: ${STEP_TITLES[step]}`}>
          <div style={{ width: `${(stepNumber / steps.length) * 100}%` }} />
        </div>
        <h1 id="mobile-verification-heading" ref={headingRef} tabIndex={-1} className="mobile-verification-title">{STEP_TITLES[step]}</h1>
      </header>

      {step === "requirements" ? <>
        <p className="mobile-verification-description">Have your ID ready. You&apos;ll take:</p>
        <ul className="mobile-verification-instructions">
          <li>Clear photos of your valid Philippine government ID, front and back. Passport needs the front only.</li>
          <li>A selfie holding your ID beside your face, with your full face visible.</li>
        </ul>
        <p className="mobile-verification-description">Use your camera in good lighting and avoid glare. Your photos go to our team for review.</p>
        <MobileVerificationNavigation onContinue={() => setStep("idType")} />
      </> : null}

      {step === "idType" ? <>
        <p className="mobile-verification-description">Choose the document you&apos;ll photograph.</p>
        <VerificationIdSelector value={idType} onChange={selectIdType} />
        <MobileVerificationNavigation onBack={() => setStep("requirements")} onContinue={() => setStep("front")} isDisabled={!idType} />
      </> : null}

      {step === "front" ? <MobileVerificationPhotoStep
        capture={front} label="ID front" facing="environment" guide="Align your ID front inside the frame, then capture."
        onCapture={file => setCapture("front", file)} onRetake={() => retakeCapture("front")}
        onBack={() => setStep("idType")} onContinue={() => setStep(needsBack ? "back" : "selfie")}
      /> : null}
      {step === "back" ? <MobileVerificationPhotoStep
        capture={back} label="ID back" facing="environment" guide="Flip your ID over and capture the back."
        onCapture={file => setCapture("back", file)} onRetake={() => retakeCapture("back")}
        onBack={() => setStep("front")} onContinue={() => setStep("selfie")}
      /> : null}
      {step === "selfie" ? <MobileVerificationPhotoStep
        capture={selfie} label="Selfie holding ID" facing="user" guide="Hold your ID beside your face with your full face visible."
        onCapture={file => setCapture("selfie", file)} onRetake={() => retakeCapture("selfie")}
        onBack={() => setStep(needsBack ? "back" : "front")} onContinue={() => setStep("review")}
      /> : null}

      {step === "review" ? <>
        <p className="mobile-verification-description">Check that your ID is readable and your face is clear.</p>
        <div className="mobile-verification-review">
            <PreviewRow
              label="ID front"
              capture={front}
              onRetake={() => retakeCapture("front")}
            />
            {needsBack && (
              <PreviewRow label="ID back" capture={back} onRetake={() => retakeCapture("back")} />
            )}
            <PreviewRow
              label="Selfie holding ID"
              capture={selfie}
              onRetake={() => retakeCapture("selfie")}
            />
        </div>
        <MobileVerificationNavigation onBack={() => setStep("selfie")} onContinue={() => setConfirmOpen(true)} label="Submit for Review" isDisabled={!capturesReady} isPending={isSubmitting} />
            <VerifySubmitConfirm
              open={confirmOpen}
              isSubmitting={isSubmitting}
              idPhotosReady={Boolean(front && (!needsBack || back))}
              selfieReady={Boolean(selfie)}
              onConfirm={() => {
                setConfirmOpen(false);
                void handleSubmit();
              }}
              onClose={() => setConfirmOpen(false)}
            />
      </> : null}
    </section>
  );
}

function LoadingCard({ message }: { message: string }) {
  return (
    <Card className="mobile-verification-shell">
      <Card.Content className="flex items-center justify-center gap-2 py-10">
        <Spinner size="sm" aria-hidden="true" />
        <p className="text-sm text-muted-foreground">{message}</p>
      </Card.Content>
    </Card>
  );
}

function PreviewRow({
  label,
  capture,
  onRetake,
}: {
  label: string;
  capture: Capture;
  onRetake: () => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border p-3">
      {capture ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={capture.url}
          alt={`${label} preview`}
          className="size-16 shrink-0 rounded-lg object-cover"
        />
      ) : (
        <div className="flex size-16 shrink-0 items-center justify-center rounded-lg bg-muted">
          <p className="text-xs text-muted-foreground">Missing</p>
        </div>
      )}
      <div className="min-w-0 flex-1"><p className="text-sm font-medium">{label}</p>{capture ? <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><IconCircleCheck size={14} aria-hidden="true" />Captured</span> : null}</div>
      <Button type="button" variant="outline" size="sm" onPress={onRetake} aria-label={`Retake ${label}`}>
        Retake
      </Button>
    </div>
  );
}
