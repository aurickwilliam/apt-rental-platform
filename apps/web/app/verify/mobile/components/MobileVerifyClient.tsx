"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Button, Card, Spinner, toast } from "@heroui/react";
import { IconShieldCheck } from "@tabler/icons-react";
import { createBrowserClient } from "@repo/supabase";
import { SECONDARY_IDS, VALID_IDS } from "@repo/constants";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@repo/supabase";

import {
  compressAvatarImage,
  compressBackgroundImage,
  validateAvatarFile,
} from "@/lib/avatar-upload";
import { claimVerificationSession, submitVerificationSession } from "../../actions";
import CameraCapture from "./CameraCapture";

type BrowserClient = SupabaseClient<Database>;

const BUCKET = "user-verification";
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

function revoke(capture: Capture) {
  if (capture) URL.revokeObjectURL(capture.url);
}

// Upload one capture into the session's private folder. Retakes overwrite
// the same object (remove-then-upload, since the bucket has no upsert grant).
async function uploadCapture(
  supabase: BrowserClient,
  path: string,
  file: File,
  isSelfie: boolean,
): Promise<void> {
  const validationError = validateAvatarFile(file);
  if (validationError) throw new Error(validationError);

  const blob = isSelfie ? await compressAvatarImage(file) : await compressBackgroundImage(file);
  let { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, blob, { contentType: "image/jpeg" });
  if (error && /exists|duplicate/i.test(error.message)) {
    await supabase.storage.from(BUCKET).remove([path]);
    ({ error } = await supabase.storage
      .from(BUCKET)
      .upload(path, blob, { contentType: "image/jpeg" }));
  }
  if (error) throw new Error(error.message);
}

// Claim validates token + owner WITHOUT consuming: the session stays active
// while the wizard runs. Only the final submit consumes it atomically.
export default function MobileVerifyClient({ token }: { token: string }) {
  const [claim, setClaim] = useState<Claim>({ state: "claiming" });
  const [step, setStep] = useState<Step>("requirements");
  const [idType, setIdType] = useState<string | null>(null);
  const [front, setFront] = useState<Capture>(null);
  const [back, setBack] = useState<Capture>(null);
  const [selfie, setSelfie] = useState<Capture>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const claimRef = useRef(false);

  const needsBack = idType !== null && idType !== PASSPORT_LABEL;

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

  const handleSubmit = useCallback(async () => {
    if (claim.state !== "ready" || !idType || !front || !selfie || (needsBack && !back)) return;
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
      setIsSubmitting(false);
    }
  }, [claim, idType, front, back, selfie, needsBack, token]);

  if (claim.state === "claiming") {
    return <LoadingCard message="Checking your verification code..." />;
  }

  if (claim.state === "needsAuth") {
    // Same-account sign-in: `next` carries the opaque token only (no PII),
    // so a successful login returns to this exact page. Signing in never
    // consumes the session -- claim/submit stay read-only until final submit.
    const resumePath = `/verify/mobile?token=${token}`;
    return (
      <Card className="border border-border bg-card p-6 text-card-foreground rounded-2xl">
        <Card.Content className="flex flex-col items-center gap-3 text-center">
          <h1 className="font-nunito text-xl font-bold">Sign in on this phone</h1>
          <p className="text-sm text-muted-foreground">
            Sign in with the same account you used on your computer, and
            you&apos;ll return here automatically. Your code stays valid for
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
      <Card className="border border-border bg-card p-6 text-card-foreground rounded-2xl">
        <Card.Content className="flex flex-col items-center gap-3 text-center">
          <h1 className="font-nunito text-xl font-bold">This code can&apos;t be used</h1>
          <p className="text-sm text-muted-foreground">{claim.message}</p>
          <p className="text-sm text-muted-foreground">
            Ask the desktop page for a fresh code and scan it again.
          </p>
        </Card.Content>
      </Card>
    );
  }

  if (expired) {
    return (
      <Card className="border border-border bg-card p-6 text-card-foreground rounded-2xl">
        <Card.Content className="flex flex-col items-center gap-3 text-center">
          <h1 className="font-nunito text-xl font-bold">This code has expired</h1>
          <p className="text-sm text-muted-foreground">
            Codes last 10 minutes. Generate a new one on your computer and scan it again.
          </p>
        </Card.Content>
      </Card>
    );
  }

  if (submitted) {
    return (
      <Card className="border border-border bg-card p-6 text-card-foreground rounded-2xl">
        <Card.Content className="flex flex-col items-center gap-3 text-center">
          <IconShieldCheck size={40} className="text-success" aria-hidden="true" />
          <h1 className="font-nunito text-xl font-bold">Your verification has been submitted.</h1>
          <p className="text-sm text-muted-foreground">Status: Pending Review.</p>
        </Card.Content>
      </Card>
    );
  }

  return (
    <Card className="border border-border bg-card p-6 text-card-foreground rounded-2xl">
      <Card.Content className="flex flex-col gap-4">
        <div aria-live="polite">
          <p className="text-xs text-muted-foreground text-center">
            Step {stepNumber} of {steps.length}
          </p>
          <div
            className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-valuenow={stepNumber}
            aria-valuemin={1}
            aria-valuemax={steps.length}
            aria-label="Verification progress"
          >
            <div
              className="h-full rounded-full bg-primary transition-[width]"
              style={{ width: `${(stepNumber / steps.length) * 100}%` }}
            />
          </div>
        </div>

        {step === "requirements" && (
          <div className="flex flex-col gap-3">
            <h1 className="font-nunito text-xl font-bold text-center">Verify your identity</h1>
            <ul className="flex list-disc flex-col gap-1.5 pl-5 text-sm text-muted-foreground">
              <li>A valid Philippine government ID.</li>
              <li>Capture the ID front clearly (plus the back, except for Passport).</li>
              <li>Hold your ID beside your face with your full face visible.</li>
              <li>Find good lighting and avoid glare.</li>
            </ul>
            <Button type="button" variant="primary" onPress={() => setStep("idType")}>
              Continue
            </Button>
          </div>
        )}

        {step === "idType" && (
          <div className="flex flex-col gap-3">
            <h1 className="font-nunito text-xl font-bold text-center">Select your ID type</h1>
            <div className="flex flex-col gap-2">
              {VALID_IDS.map((id) => (
                <Button
                  key={id}
                  type="button"
                  variant={idType === id ? "primary" : "outline"}
                  onPress={() => setIdType(id)}
                  className="justify-start"
                >
                  {id}
                </Button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground text-center">Secondary IDs</p>
            <div className="flex flex-col gap-2">
              {SECONDARY_IDS.map((id) => (
                <Button
                  key={id}
                  type="button"
                  variant={idType === id ? "primary" : "outline"}
                  onPress={() => setIdType(id)}
                  className="justify-start"
                >
                  {id}
                </Button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" onPress={() => setStep("requirements")} className="flex-1">
                Back
              </Button>
              <Button
                type="button"
                variant="primary"
                onPress={() => setStep("front")}
                isDisabled={!idType}
                className="flex-1"
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {step === "front" && (
          <CameraCapture
            facing="environment"
            guide="Align your ID front inside the frame, then capture."
            onCapture={(file) => setCapture("front", file)}
            onCancel={() => setStep("idType")}
          />
        )}

        {step === "back" && (
          <CameraCapture
            facing="environment"
            guide="Flip your ID over and capture the back."
            onCapture={(file) => setCapture("back", file)}
            onCancel={() => setStep("front")}
          />
        )}

        {step === "selfie" && (
          <CameraCapture
            facing="user"
            guide="Hold your ID beside your face with your full face visible."
            onCapture={(file) => setCapture("selfie", file)}
            onCancel={() => setStep(needsBack ? "back" : "front")}
          />
        )}

        {step === "review" && (
          <div className="flex flex-col gap-3">
            <h1 className="font-nunito text-xl font-bold text-center">Review your submission</h1>
            <PreviewRow
              label="ID front"
              capture={front}
              onRetake={() => setStep("front")}
            />
            {needsBack && (
              <PreviewRow label="ID back" capture={back} onRetake={() => setStep("back")} />
            )}
            <PreviewRow
              label="Selfie holding ID"
              capture={selfie}
              onRetake={() => setStep("selfie")}
            />
            <Button
              type="button"
              variant="primary"
              onPress={() => void handleSubmit()}
              isDisabled={isSubmitting}
              isPending={isSubmitting}
            >
              Submit for Review
            </Button>
          </div>
        )}
      </Card.Content>
    </Card>
  );
}

function LoadingCard({ message }: { message: string }) {
  return (
    <Card className="border border-border bg-card p-6 text-card-foreground rounded-2xl">
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
    <div className="flex items-center gap-3 rounded-xl border border-border p-2">
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
      <p className="flex-1 text-sm font-medium">{label}</p>
      <Button type="button" variant="outline" size="sm" onPress={onRetake}>
        Retake
      </Button>
    </div>
  );
}
