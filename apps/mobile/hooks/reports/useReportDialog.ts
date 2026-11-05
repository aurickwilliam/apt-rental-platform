import { useCallback, useState } from "react";
import { useToast } from "heroui-native";

import { getErrorMessage } from "@repo/utils";

import { submitReport, type ReportTarget } from "@/service/reports/reportService";

const REPORT_ERROR_FALLBACK = "Something went wrong. Try again.";

/**
 * State for a report dialog opened from a listing or profile screen. The draft
 * lives in the dialog; this owns open state, the submit call and its error.
 */
export function useReportDialog(target: ReportTarget | null) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const open = useCallback(() => {
    setErrorMessage(null);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => setIsOpen(false), []);

  const submit = useCallback(
    async (reason: string, details: string) => {
      if (!target) return;
      setIsSubmitting(true);
      setErrorMessage(null);
      try {
        await submitReport({ target, reason, details });
        setIsOpen(false);
        toast.show({ variant: "success", label: "Report sent. Thanks for letting us know." });
      } catch (error) {
        console.error("[reports] Failed to send report:", error);
        setErrorMessage(getErrorMessage(error, REPORT_ERROR_FALLBACK));
      } finally {
        setIsSubmitting(false);
      }
    },
    [target, toast],
  );

  return { isOpen, isSubmitting, errorMessage, open, close, submit };
}
