"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { Button, Spinner } from "@heroui/react";

type CameraCaptureProps = {
  // Rear camera for IDs, front camera for selfies.
  facing: "environment" | "user";
  guide: string;
  onCapture: (file: File) => void;
  onCancel: () => void;
};

// Browser camera capture: requests permission only when mounted (i.e. only
// on a capture step), prefers the requested lens, stops all tracks on
// unmount and right after capture. Falls back to a file picker when the
// camera is unavailable or permission is denied.
export default function CameraCapture({ facing, guide, onCapture, onCancel }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<"starting" | "live" | "unavailable">("starting");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  useEffect(() => {
    let cancelled = false;

    const start = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setErrorMessage("This browser can't access the camera. You can upload a photo instead.");
        setStatus("unavailable");
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facing },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setStatus("live");
      } catch (error) {
        const name = error instanceof DOMException ? error.name : "";
        setErrorMessage(
          name === "NotAllowedError"
            ? "Camera permission was denied. Allow access in your browser settings, or upload a photo instead."
            : "Couldn't start the camera. You can upload a photo instead.",
        );
        setStatus("unavailable");
      }
    };

    void start();
    return () => {
      cancelled = true;
      stopStream();
    };
  }, [facing, stopStream]);

  const handleCapture = useCallback(() => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0 || isCapturing) return;
    setIsCapturing(true);

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setIsCapturing(false);
      return;
    }
    // Un-mirror front-camera shots so selfies read naturally.
    if (facing === "user") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => {
        setIsCapturing(false);
        if (!blob) return;
        stopStream();
        onCapture(new File([blob], "capture.jpg", { type: "image/jpeg" }));
      },
      "image/jpeg",
      0.9,
    );
  }, [facing, isCapturing, onCapture, stopStream]);

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground text-center">{guide}</p>

      {status === "starting" && (
        <div className="flex items-center justify-center gap-2 rounded-2xl bg-muted py-16">
          <Spinner size="sm" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">Starting camera...</p>
        </div>
      )}

      {status === "live" && (
        <>
          <div className="overflow-hidden rounded-2xl bg-black">
            <video
              ref={videoRef}
              playsInline
              muted
              className="aspect-[4/3] w-full object-cover"
              aria-label="Camera preview"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" onPress={onCancel} className="flex-1">
              Back
            </Button>
            <Button
              type="button"
              variant="primary"
              onPress={handleCapture}
              isDisabled={isCapturing}
              isPending={isCapturing}
              className="flex-1"
            >
              Capture
            </Button>
          </div>
        </>
      )}

      {status === "unavailable" && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-4 text-center">
          <p className="text-sm text-muted-foreground">{errorMessage}</p>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture={facing === "user" ? "user" : "environment"}
            className="hidden"
            aria-label="Upload a photo instead"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onCapture(file);
              e.target.value = "";
            }}
          />
          <div className="flex w-full items-center gap-2">
            <Button type="button" variant="outline" onPress={onCancel} className="flex-1">
              Back
            </Button>
            <Button
              type="button"
              variant="primary"
              onPress={() => fileRef.current?.click()}
              className="flex-1"
            >
              Upload photo
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
