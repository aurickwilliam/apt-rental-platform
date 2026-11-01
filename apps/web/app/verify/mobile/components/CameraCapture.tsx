"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button, Spinner } from "@heroui/react";
import { verificationCameraError } from "@/lib/verification-camera-errors";
import MobileVerificationNavigation from "./MobileVerificationNavigation";

type CameraCaptureProps = {
  facing: "environment" | "user";
  guide: string;
  onCapture: (file: File) => void;
  onCancel: () => void;
  /** Optional desktop handoff action, never a file/gallery picker. */
  fallback?: { hint: string; label: string; onSelect: () => void };
  hideBack?: boolean;
  mobileNavigation?: boolean;
};

// Camera-only browser UI. getUserMedia cannot attest image provenance or
// liveness; backend session validation and human review remain authoritative.
export default function CameraCapture({ facing, guide, onCapture, onCancel, fallback, hideBack = false, mobileNavigation = false }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const requestRef = useRef(0);
  const startingRef = useRef(false);
  const capturingRef = useRef(false);
  const [status, setStatus] = useState<"idle" | "starting" | "live" | "unavailable">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  const stopStream = useCallback(() => {
    requestRef.current += 1;
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    startingRef.current = false;
    capturingRef.current = false;
  }, []);

  useEffect(() => stopStream, [stopStream]);

  const failCamera = useCallback((reason: string) => {
    stopStream();
    setIsCapturing(false);
    setErrorMessage(verificationCameraError(reason, navigator.userAgent));
    setStatus("unavailable");
  }, [stopStream]);

  const startCamera = useCallback(async () => {
    if (startingRef.current) return;
    stopStream();
    setErrorMessage(null);
    setIsCapturing(false);
    if (!window.isSecureContext) {
      failCamera("insecure");
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      failCamera("unsupported");
      return;
    }
    startingRef.current = true;
    const request = requestRef.current;
    setStatus("starting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: facing }, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      // Permission prompts can resolve after Back, expiry or unmount. Never
      // keep those tracks alive or deliver a capture to a retired screen.
      if (requestRef.current !== request) {
        stream.getTracks().forEach(track => track.stop());
        return;
      }
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) throw new Error("Camera preview unavailable");
      video.srcObject = stream;
      for (const track of stream.getVideoTracks()) {
        track.addEventListener("ended", () => {
          if (requestRef.current === request) failCamera("ended");
        }, { once: true });
      }
      await video.play();
      if (requestRef.current !== request) return;
      if (!video.videoWidth || !video.videoHeight || !stream.getVideoTracks().some(track => track.readyState === "live")) {
        failCamera("NotFoundError");
        return;
      }
      startingRef.current = false;
      setStatus("live");
    } catch (error) {
      if (requestRef.current !== request) return;
      failCamera(error instanceof DOMException ? error.name : "hardware");
    }
  }, [facing, failCamera, stopStream]);

  const handleCapture = useCallback(() => {
    const video = videoRef.current;
    if (status !== "live" || capturingRef.current) return;
    if (!video || !video.videoWidth || !video.videoHeight || !streamRef.current?.getVideoTracks().some(track => track.readyState === "live")) {
      failCamera("capture");
      return;
    }
    capturingRef.current = true;
    setIsCapturing(true);
    const request = requestRef.current;
    try {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) { failCamera("capture"); return; }
      if (facing === "user") {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(blob => {
        if (requestRef.current !== request) return;
        if (!blob?.size) { failCamera("capture"); return; }
        stopStream();
        setIsCapturing(false);
        setStatus("idle");
        onCapture(new File([blob], "capture.jpg", { type: "image/jpeg" }));
      }, "image/jpeg", 0.9);
    } catch { failCamera("capture"); }
  }, [facing, status, onCapture, failCamera, stopStream]);

  const cancel = () => { stopStream(); onCancel(); };

  return (
    <div className={mobileNavigation ? "mobile-verification-camera" : "flex flex-col gap-3"}>
      <p className="text-center text-sm text-muted-foreground">{guide}</p>
      {status === "idle" ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl bg-muted px-4 py-10 text-center">
          <p className="text-sm text-muted-foreground">Your camera stays off until you enable it for this step.</p>
          {!mobileNavigation ? <Button type="button" variant="primary" onPress={() => void startCamera()}>Enable camera</Button> : null}
        </div>
      ) : null}
      {status === "starting" || status === "live" ? (
        <div className="relative overflow-hidden rounded-2xl bg-black">
          <video ref={videoRef} playsInline autoPlay muted className="aspect-[4/3] w-full object-cover" aria-label="Camera preview" />
          {status === "starting" ? (
            <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/60" role="status">
              <Spinner size="sm" aria-hidden="true" /><p className="text-sm text-white">Starting camera…</p>
            </div>
          ) : null}
        </div>
      ) : null}
      {status === "unavailable" ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-4 text-center">
          <p className="text-sm text-muted-foreground" role="alert">{errorMessage}</p>
          {!mobileNavigation ? <Button type="button" variant="primary" onPress={() => void startCamera()}>Try camera again</Button> : null}
          {fallback ? <><p className="text-sm text-muted-foreground">{fallback.hint}</p><Button type="button" variant="outline" onPress={fallback.onSelect}>{fallback.label}</Button></> : null}
        </div>
      ) : null}
      {mobileNavigation ? (
        <MobileVerificationNavigation
          onBack={cancel}
          onContinue={status === "live" ? handleCapture : status === "starting" ? undefined : () => void startCamera()}
          label={status === "live" ? "Capture" : status === "unavailable" ? "Try camera again" : "Enable camera"}
          isDisabled={isCapturing}
          isPending={isCapturing}
        />
      ) : <div className="flex items-center gap-2">
        {!hideBack ? <Button type="button" variant="outline" onPress={cancel} className="flex-1">Back</Button> : null}
        {status === "live" ? <Button type="button" variant="primary" onPress={handleCapture} isDisabled={isCapturing} isPending={isCapturing} className="flex-1">Capture</Button> : null}
      </div>}
    </div>
  );
}
