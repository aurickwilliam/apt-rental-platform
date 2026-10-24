"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@heroui/react";
import { IconCheck, IconCopy, IconDownload, IconShare2 } from "@tabler/icons-react";
import { useHydrated } from "@/hooks/use-hydrated";
import type { LandlordPaymentRecord } from "@/service/landlordPaymentService";
import { receiptData } from "../lib/receiptData";
import { renderReceiptImage } from "../lib/receiptImage";

type Feedback = "idle" | "copied" | "shared" | "saved";
type Busy = "copy" | "share" | null;

const FEEDBACK_MS = 2200;

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

interface ReceiptShareActionsProps {
  payment: LandlordPaymentRecord;
}

// Copy or share the receipt as a picture, for sending proof of payment through chat.
// Nothing leaves the device unless the landlord picks a destination in the system
// share sheet or pastes it themselves. Where file sharing is unavailable (most
// desktop browsers) the share button saves the image instead.
export default function ReceiptShareActions({ payment }: ReceiptShareActionsProps) {
  const hydrated = useHydrated();
  const fonts = useRef<HTMLSpanElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [busy, setBusy] = useState<Busy>(null);
  const [feedback, setFeedback] = useState<Feedback>("idle");
  const [error, setError] = useState<string | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const canCopy = hydrated && typeof ClipboardItem !== "undefined" && Boolean(navigator.clipboard?.write);
  const canShareFiles = hydrated && typeof navigator.share === "function" && typeof navigator.canShare === "function";

  const flash = (next: Feedback) => {
    setFeedback(next);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setFeedback("idle"), FEEDBACK_MS);
  };

  const image = () => {
    const probe = fonts.current ? getComputedStyle(fonts.current) : null;
    const heading = probe?.fontFamily || "sans-serif";
    const body = fonts.current?.parentElement ? getComputedStyle(fonts.current.parentElement).fontFamily : "sans-serif";
    const data = receiptData(payment);
    return { data, blob: renderReceiptImage(data, { heading, body }) };
  };

  const copy = async () => {
    setBusy("copy");
    setError(null);
    try {
      // The clipboard item takes a promise so the copy still counts as part of the click in Safari.
      await navigator.clipboard.write([new ClipboardItem({ "image/png": image().blob })]);
      flash("copied");
    } catch {
      console.error("The receipt image could not be copied.");
      setError("The receipt couldn't be copied. Try Save image instead.");
    } finally {
      setBusy(null);
    }
  };

  const share = async () => {
    setBusy("share");
    setError(null);
    try {
      const { data, blob } = image();
      const file = new File([await blob], data.filename, { type: "image/png" });
      if (canShareFiles && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: `Receipt ${data.reference}` });
        flash("shared");
      } else {
        download(file, data.filename);
        flash("saved");
      }
    } catch (failure) {
      // Closing the share sheet is not an error.
      if (!(failure instanceof DOMException && failure.name === "AbortError")) {
        console.error("The receipt image could not be shared.");
        setError("The receipt couldn't be shared. Please try again.");
      }
    } finally {
      setBusy(null);
    }
  };

  const sharing = canShareFiles;
  return (
    <div className="space-y-2">
      <span ref={fonts} className="font-nunito sr-only" aria-hidden="true" />
      <div className="flex gap-3">
        {canCopy ? (
          <Button variant="secondary" className="flex-1 rounded-full font-nunito" isDisabled={busy !== null} isPending={busy === "copy"} onPress={() => void copy()}>
            {feedback === "copied" ? <IconCheck size={16} aria-hidden /> : <IconCopy size={16} aria-hidden />}
            {feedback === "copied" ? "Copied" : "Copy image"}
          </Button>
        ) : null}
        <Button variant="secondary" className="flex-1 rounded-full font-nunito" isDisabled={busy !== null || !hydrated} isPending={busy === "share"} onPress={() => void share()}>
          {feedback === "shared" || feedback === "saved" ? <IconCheck size={16} aria-hidden /> : sharing ? <IconShare2 size={16} aria-hidden /> : <IconDownload size={16} aria-hidden />}
          {feedback === "shared" ? "Shared" : feedback === "saved" ? "Saved" : sharing ? "Share" : "Save image"}
        </Button>
      </div>
      <p role="status" className="sr-only">
        {feedback === "copied" ? "Receipt image copied" : feedback === "shared" ? "Receipt image shared" : feedback === "saved" ? "Receipt image saved" : ""}
      </p>
      {error ? <p role="alert" className="text-center text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
