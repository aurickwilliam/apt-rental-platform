"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { Button, toast } from "@heroui/react";
import { IconClock } from "@tabler/icons-react";
import { SECONDARY_IDS, VALID_IDS } from "@repo/constants";
import { createBrowserClient } from "@repo/supabase";

import {
  VERIFICATION_UPLOAD_ACCEPT,
  idTypeNeedsBack,
  validateVerificationImageFile,
} from "@/lib/verification-documents";
import {
  VERIFICATION_BUCKET,
  uploadVerificationCapture,
} from "@/lib/verification-upload";
import { submitDesktopVerification } from "../actions";
import CameraCapture from "../mobile/components/CameraCapture";
import VerifySubmitConfirm from "./VerifySubmitConfirm";

type Capture = { file: File; url: string } | null;
export type DesktopWizardStep = "id" | "selfie" | "review";
type IdSubStep = "type" | "front" | "back";

const FRONT_FILE = "id-front.jpg";
const BACK_FILE = "id-back.jpg";
const SELFIE_FILE = "selfie.jpg";

const STEP_TITLES = ["Government ID", "Webcam selfie", "Review & submit"] as const;

function revoke(capture: Capture) {
  if (capture) URL.revokeObjectURL(capture.url);
}

type DesktopVerifyWizardProps = {
  onStepChange: (step: DesktopWizardStep) => void;
  onSubmitted: () => void;
  onBackToOptions: () => void;
};

// Desktop standalone verification: ID captures plus a mandatory live
// webcam selfie, submitted without any QR session. Uploads happen only at
// final submit, so abandoning the wizard leaves nothing server-side.
// Camera tracks stop with CameraCapture unmounts; preview URLs revoke here.
export default function DesktopVerifyWizard({
  onStepChange,
  onSubmitted,
  onBackToOptions,
}: DesktopVerifyWizardProps) {
  // Folder id for this attempt only. Regenerated per mount; never logged.
  const [verificationId] = useState(() => crypto.randomUUID());
  const [step, setStep] = useState<DesktopWizardStep>("id");
  const [idSub, setIdSub] = useState<IdSubStep>("type");
  const [idType, setIdType] = useState<string | null>(null);
  const [front, setFront] = useState<Capture>(null);
  const [back, setBack] = useState<Capture>(null);
  const [selfie, setSelfie] = useState<Capture>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const submittingRef = useRef(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const uploadTargetRef = useRef<"front" | "back">("front");

  const needsBack = idType !== null && idTypeNeedsBack(idType, "Passport");

  // The modal header owns the step title; report step changes upward.
  useEffect(() => {
    onStepChange(step);
  }, [step, onStepChange]);

  // Track every preview URL so unmount revokes them all; replacements
  // revoke the old URL explicitly. All ref writes happen in handlers.
  const urlsRef = useRef<Set<string>>(new Set());
  useEffect(
    () => () => {
      urlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      urlsRef.current.clear();
    },
    [],
  );

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
      setFileError(null);
    },
    [front, back, selfie],
  );

  const clearCapture = useCallback(
    (kind: "front" | "back" | "selfie") => {
      const current = kind === "front" ? front : kind === "back" ? back : selfie;
      if (current) {
        revoke(current);
        urlsRef.current.delete(current.url);
      }
      if (kind === "front") setFront(null);
      else if (kind === "back") setBack(null);
      else setSelfie(null);
    },
    [front, back, selfie],
  );

  const handleSelectIdType = useCallback(
    (next: string) => {
      if (next !== idType) {
        // Captures belong to the previous type; never carry them over.
        clearCapture("front");
        clearCapture("back");
      }
      setIdType(next);
      setFileError(null);
    },
    [idType, clearCapture],
  );

  const openUpload = useCallback((target: "front" | "back") => {
    uploadTargetRef.current = target;
    setFileError(null);
    fileRef.current?.click();
  }, []);

  const handleUploadFile = useCallback(
    (file: File) => {
      const error = validateVerificationImageFile(file);
      if (error) {
        setFileError(error);
        return;
      }
      setCapture(uploadTargetRef.current, file);
    },
    [setCapture],
  );

  const handleSubmit = useCallback(async () => {
    if (!idType || !front || !selfie || (needsBack && !back)) return;
    // Synchronous guard: isPending alone cannot stop double-clicks that
    // land before the next render.
    if (submittingRef.current) return;
    submittingRef.current = true;
    setIsSubmitting(true);
    try {
      const supabase = createBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Please sign in to submit verification.");
      const { data: profile } = await supabase
        .from("users")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!profile) {
        throw new Error("We could not load your profile. Please try again.");
      }
      const base = `${profile.id}/${verificationId}`;
      // Uploads run concurrently: each targets its own object, so order is
      // irrelevant and a single slow file no longer gates the others.
      const pendingUploads: Array<{ path: string; file: File; isSelfie: boolean }> = [
        { path: `${base}/${FRONT_FILE}`, file: front.file, isSelfie: false },
      ];
      if (needsBack && back) {
        pendingUploads.push({ path: `${base}/${BACK_FILE}`, file: back.file, isSelfie: false });
      }
      pendingUploads.push({ path: `${base}/${SELFIE_FILE}`, file: selfie.file, isSelfie: true });
      const outcomes = await Promise.allSettled(
        pendingUploads.map((item) =>
          uploadVerificationCapture(supabase, item.path, item.file, item.isSelfie),
        ),
      );
      const failed = outcomes.find((outcome) => outcome.status === "rejected");
      const uploaded = pendingUploads
        .filter((_, index) => outcomes[index]?.status === "fulfilled")
        .map((item) => item.path);
      if (failed) {
        if (uploaded.length > 0) {
          await supabase.storage.from(VERIFICATION_BUCKET).remove(uploaded);
        }
        throw failed.reason instanceof Error ? failed.reason : new Error("Couldn't upload your images. Please try again.");
      }

      const result = await submitDesktopVerification({
        verificationId,
        idType,
      });
      if (!result.ok) {
        // Uploads stay in the private folder for a safe retry: the server
        // action re-confirms them and the insert is guarded per attempt id.
        toast.danger(result.error, { timeout: 0 });
        return;
      }
      onSubmitted();
    } catch (error) {
      toast.danger(
        error instanceof Error ? error.message : "Couldn't submit. Please try again.",
        { timeout: 0 },
      );
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  }, [idType, front, back, selfie, needsBack, verificationId, onSubmitted]);

  const stepNumber = step === "id" ? 1 : step === "selfie" ? 2 : 3;

  return (
    <div className="flex flex-col gap-6">
      <div aria-live="polite">
        <p className="text-center text-xs text-muted-foreground">
          Step {stepNumber} of 3: {STEP_TITLES[stepNumber - 1]}
        </p>
        <div
          className="mt-2 flex gap-1.5"
          role="progressbar"
          aria-valuenow={stepNumber}
          aria-valuemin={1}
          aria-valuemax={3}
          aria-label={`Verification progress: step ${stepNumber} of 3, ${STEP_TITLES[stepNumber - 1]}`}
        >
          {[1, 2, 3].map((segment) => (
            <div
              key={segment}
              aria-hidden="true"
              className={`h-1.5 flex-1 rounded-full ${
                segment <= stepNumber ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>
      </div>

      {step === "id" && idSub === "type" && (
        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap gap-2.5">
            {VALID_IDS.map((id) => (
              <Button
                key={id}
                type="button"
                size="sm"
                variant={idType === id ? "primary" : "outline"}
                onPress={() => handleSelectIdType(id)}
              >
                {id}
              </Button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">Secondary IDs</p>
          <div className="flex flex-wrap gap-2.5">
            {SECONDARY_IDS.map((id) => (
              <Button
                key={id}
                type="button"
                size="sm"
                variant={idType === id ? "primary" : "outline"}
                onPress={() => handleSelectIdType(id)}
              >
                {id}
              </Button>
            ))}
          </div>
          <div className="flex items-center gap-2 pt-2">
            <Button type="button" variant="outline" onPress={onBackToOptions} className="flex-1">
              Back
            </Button>
            <Button
              type="button"
              variant="primary"
              onPress={() => setIdSub("front")}
              isDisabled={!idType}
              className="flex-1"
            >
              Continue
            </Button>
          </div>
        </div>
      )}

      {step === "id" && idSub === "front" && (
        <div className="flex flex-col gap-5">
          {front ? (
            <CapturePreview
              label="ID front photo"
              capture={front}
              onRetake={() => clearCapture("front")}
            />
          ) : (
            <>
              <input
                ref={fileRef}
                type="file"
                accept={VERIFICATION_UPLOAD_ACCEPT}
                className="hidden"
                aria-label="Upload ID front"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleUploadFile(file);
                  e.target.value = "";
                }}
              />
              <Button
                type="button"
                variant="outline"
                onPress={() => openUpload("front")}
                className="w-full"
              >
                Upload ID front
              </Button>
              <CameraCapture
                facing="environment"
                guide="Or align your ID front inside the frame, then capture."
                onCapture={(file) => {
                  setCapture("front", file);
                }}
                onCancel={() => setIdSub("type")}
                hideBack
              />
              {fileError && (
                <p role="alert" className="text-sm text-danger">
                  {fileError}
                </p>
              )}
            </>
          )}
          <div className="flex items-center gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onPress={() => setIdSub("type")}
              className="flex-1"
            >
              Back
            </Button>
            <Button
              type="button"
              variant="primary"
              onPress={() => (needsBack ? setIdSub("back") : setStep("selfie"))}
              isDisabled={!front}
              className="flex-1"
            >
              Continue
            </Button>
          </div>
        </div>
      )}

      {step === "id" && idSub === "back" && (
        <div className="flex flex-col gap-5">
          {back ? (
            <CapturePreview
              label="ID back photo"
              capture={back}
              onRetake={() => clearCapture("back")}
            />
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                onPress={() => openUpload("back")}
                className="w-full"
              >
                Upload ID back
              </Button>
              <CameraCapture
                facing="environment"
                guide="Or flip your ID over and capture the back."
                onCapture={(file) => {
                  setCapture("back", file);
                }}
                onCancel={() => setIdSub("front")}
                hideBack
              />
              {fileError && (
                <p role="alert" className="text-sm text-danger">
                  {fileError}
                </p>
              )}
            </>
          )}
          <div className="flex items-center gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onPress={() => setIdSub("front")}
              className="flex-1"
            >
              Back
            </Button>
            <Button
              type="button"
              variant="primary"
              onPress={() => setStep("selfie")}
              isDisabled={!back}
              className="flex-1"
            >
              Continue
            </Button>
          </div>
        </div>
      )}

      {step === "selfie" && (
        <div className="flex flex-col gap-5">
          {selfie ? (
            <CapturePreview
              label="Selfie holding your ID"
              capture={selfie}
              onRetake={() => clearCapture("selfie")}
            />
          ) : (
            <CameraCapture
              facing="user"
              guide="Hold your ID beside your face with your full face visible, then take the photo."
              onCapture={(file) => {
                setCapture("selfie", file);
              }}
              onCancel={() => (needsBack ? setIdSub("back") : setIdSub("front"))}
              hideBack
              fallback={{
                hint: "A live webcam selfie is required here — an uploaded photo can't be used. You can continue on your phone instead.",
                label: "Back to options",
                onSelect: onBackToOptions,
              }}
            />
          )}
          <div className="flex items-center gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onPress={() => {
                setIdSub(needsBack ? "back" : "front");
                setStep("id");
              }}
              className="flex-1"
            >
              Back
            </Button>
            <Button
              type="button"
              variant="primary"
              onPress={() => setStep("review")}
              isDisabled={!selfie}
              className="flex-1"
            >
              Continue
            </Button>
          </div>
        </div>
      )}

      {step === "review" && (
        <div className="flex flex-col">
          <div className="flex flex-col gap-1">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Selected ID
            </p>
            <p className="text-sm font-medium text-foreground">{idType}</p>
          </div>
          <div className="mt-3 flex items-start gap-2">
            <IconClock size={16} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
            <div className="flex flex-col gap-0.5">
              <p className="text-[13px] font-semibold text-foreground">
                Manual review after submission
              </p>
              <p className="text-[13px] leading-6 text-muted-foreground">
                Usually reviewed within 24–48 hours. Track status in APT Passport.
              </p>
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-2">
            <CapturePreview
              label="ID front"
              capture={front}
              onRetake={() => {
                setIdSub("front");
                setStep("id");
              }}
            />
            {needsBack && (
              <CapturePreview
                label="ID back"
                capture={back}
                onRetake={() => {
                  setIdSub("back");
                  setStep("id");
                }}
              />
            )}
            <CapturePreview
              label="Selfie holding ID"
              capture={selfie}
              onRetake={() => setStep("selfie")}
            />
          </div>
          <div className="mt-6 flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onPress={() => setStep("selfie")}
              isDisabled={isSubmitting}
              className="flex-1"
            >
              Back
            </Button>
            <Button
              type="button"
              variant="primary"
              onPress={() => setConfirmOpen(true)}
              isDisabled={isSubmitting}
              className="flex-1"
            >
              Submit for review
            </Button>
          </div>
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
        </div>
      )}
    </div>
  );
}

function CapturePreview({
  label,
  capture,
  onRetake,
}: {
  label: string;
  capture: Capture;
  onRetake: () => void;
}) {
  if (!capture) return null;
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border p-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={capture.url}
        alt={label}
        className="size-12 shrink-0 rounded-lg object-cover"
      />
      <span className="min-w-0 flex-1 text-[13px] font-semibold text-foreground">{label}</span>
      <Button type="button" variant="ghost" size="sm" onPress={onRetake} className="min-h-10">
        Retake
      </Button>
    </div>
  );
}
