"use client";

import { useEffect, useRef, useState } from "react";
import { Button, toast } from "@heroui/react";
import { IconCheck, IconCopy, IconDownload, IconShare2 } from "@tabler/icons-react";

import { useHydrated } from "@/hooks/use-hydrated";
import { receiptData } from "@/lib/receipt-data";
import { renderReceiptImage } from "@/lib/receipt-image";
import type { PaymentRecord } from "@/service/paymentService";

type Feedback = "idle" | "saved" | "shared" | "copied";
type Busy = "save" | "share" | null;

const FEEDBACK_MS = 2200;
const BUTTON_CLASS = "cursor-pointer gap-1.5 font-nunito text-zinc-500 hover:text-zinc-700";

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

interface ReceiptActionsProps {
  payment: PaymentRecord;
}

/**
 * Save and Share for the tenant's receipt, both from the receipt's picture.
 * Save downloads the PNG, which the browser puts in its Downloads folder. Share
 * opens the system share sheet with that picture; where the browser cannot share
 * files (most desktops) the button copies the picture instead, so it can be pasted
 * into a chat. Nothing leaves the device unless the tenant picks a destination.
 * Saving and copying also raise a toast in the page's top-right corner (see Providers).
 */
export default function ReceiptActions({ payment }: ReceiptActionsProps) {
  const hydrated = useHydrated();
  const fonts = useRef<HTMLSpanElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [busy, setBusy] = useState<Busy>(null);
  const [feedback, setFeedback] = useState<Feedback>("idle");
  const [error, setError] = useState<string | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const canShareFiles = hydrated && typeof navigator.share === "function" && typeof navigator.canShare === "function";
  const canCopy = hydrated && typeof ClipboardItem !== "undefined" && Boolean(navigator.clipboard?.write);
  // Without file sharing, a second download would only repeat Save.
  const shareMode = canShareFiles ? "share" : canCopy ? "copy" : null;

  const flash = (next: Feedback) => {
    setFeedback(next);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setFeedback("idle"), FEEDBACK_MS);
  };

  const image = () => {
    const probe = fonts.current ? getComputedStyle(fonts.current) : null;
    const heading = probe?.fontFamily || "sans-serif";
    const body = fonts.current?.parentElement ? getComputedStyle(fonts.current.parentElement).fontFamily : "sans-serif";
    const data = receiptData(payment, "tenant");
    return { data, blob: renderReceiptImage(data, { heading, body }) };
  };

  const save = async () => {
    setBusy("save");
    setError(null);
    try {
      const { data, blob } = image();
      download(await blob, data.filename);
      flash("saved");
      toast.success("Receipt saved", { description: `${data.filename} was downloaded to your device.` });
    } catch {
      console.error("The receipt image could not be saved.");
      setError("The receipt couldn't be saved. Please try again.");
    } finally {
      setBusy(null);
    }
  };

  const share = async () => {
    setBusy("share");
    setError(null);
    try {
      const { data, blob } = image();
      if (shareMode === "copy") {
        // The clipboard item takes a promise so the copy still counts as part of the click in Safari.
        await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
        flash("copied");
        toast.success("Receipt copied", { description: "Paste the image into a chat to send it." });
        return;
      }
      const file = new File([await blob], data.filename, { type: "image/png" });
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: `Receipt ${data.reference}` });
        flash("shared");
      } else {
        download(file, data.filename);
        flash("saved");
        toast.success("Receipt saved", { description: `${data.filename} was downloaded to your device.` });
      }
    } catch (failure) {
      // Closing the share sheet is not an error.
      if (!(failure instanceof DOMException && failure.name === "AbortError")) {
        console.error("The receipt image could not be shared.");
        setError("The receipt couldn't be shared. Try Save receipt instead.");
      }
    } finally {
      setBusy(null);
    }
  };

  const status =
    feedback === "saved" ? "Receipt saved to your downloads"
      : feedback === "shared" ? "Receipt shared"
        : feedback === "copied" ? "Receipt image copied"
          : "";

  return (
    <div className="w-full space-y-2">
      <span ref={fonts} className="font-nunito sr-only" aria-hidden="true" />
      <div className="flex items-center justify-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          isDisabled={busy !== null || !hydrated}
          isPending={busy === "save"}
          onPress={() => void save()}
          className={BUTTON_CLASS}
        >
          {feedback === "saved" ? <IconCheck size={14} aria-hidden /> : <IconDownload size={14} aria-hidden />}
          {feedback === "saved" ? "Saved" : "Save receipt"}
        </Button>
        {shareMode ? (
          <Button
            variant="ghost"
            size="sm"
            isDisabled={busy !== null}
            isPending={busy === "share"}
            onPress={() => void share()}
            className={BUTTON_CLASS}
          >
            {feedback === "shared" || feedback === "copied" ? (
              <IconCheck size={14} aria-hidden />
            ) : shareMode === "share" ? (
              <IconShare2 size={14} aria-hidden />
            ) : (
              <IconCopy size={14} aria-hidden />
            )}
            {feedback === "shared" ? "Shared" : feedback === "copied" ? "Copied" : shareMode === "share" ? "Share receipt" : "Copy receipt"}
          </Button>
        ) : null}
      </div>
      <p role="status" className="sr-only">{status}</p>
      {error ? <p role="alert" className="text-center text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
