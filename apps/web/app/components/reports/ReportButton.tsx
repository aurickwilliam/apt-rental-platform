"use client";

import { useMemo, useState } from "react";
import { Button, toast } from "@heroui/react";
import { IconFlag } from "@tabler/icons-react";
import { createClient } from "@repo/supabase/browser";
import { APARTMENT_REPORT_REASONS, USER_REPORT_REASONS } from "@repo/utils";
import type { ApartmentReportReason, UserReportReason } from "@repo/utils";

import ReportUserModal from "@/app/components/chat/ReportUserModal";
import { useUser } from "@/hooks/use-user";

import { reportApartment, reportProfile } from "./reportActions";

export type ReportTarget =
  | { kind: "apartment"; apartmentId: string; ownerId: string | null; name: string }
  | { kind: "profile"; userId: string; role: "landlord" | "tenant"; name: string };

interface ReportButtonProps {
  target: ReportTarget;
  className?: string;
}

function errorMessage(error: unknown): string {
  const message = (error as { message?: unknown } | null)?.message;
  return typeof message === "string" && message.trim() ? message : "Something went wrong. Try again.";
}

/**
 * Report entry point for a listing or a landlord/tenant profile. Hidden for the
 * owner of the thing being reported; signed-out visitors are asked to sign in.
 * The database is the final authority on who can report what.
 */
export default function ReportButton({ target, className }: ReportButtonProps) {
  const supabase = useMemo(() => createClient(), []);
  const { profile, loading } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const viewerId = profile?.id ?? null;
  const targetOwnerId = target.kind === "apartment" ? target.ownerId : target.userId;
  if (loading || (viewerId && viewerId === targetOwnerId)) return null;

  const isApartment = target.kind === "apartment";
  const label = isApartment ? "Report this listing" : "Report";

  const open = () => {
    if (!viewerId) {
      toast.info("Sign in to send a report.");
      return;
    }
    setError(null);
    setIsOpen(true);
  };

  const submit = async (reason: string, details: string) => {
    setIsSubmitting(true);
    setError(null);
    try {
      if (target.kind === "apartment") {
        await reportApartment(supabase, {
          apartmentId: target.apartmentId,
          reason: reason as ApartmentReportReason,
          details,
        });
      } else {
        await reportProfile(supabase, {
          userId: target.userId,
          role: target.role,
          reason: reason as UserReportReason,
          details,
        });
      }
      toast.success("Report sent. Thanks for letting us know.");
      setIsOpen(false);
    } catch (reportError) {
      console.error("[reports] Failed to send report:", reportError);
      setError(errorMessage(reportError));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Button
        size="sm"
        variant="ghost"
        onPress={open}
        className={`cursor-pointer gap-1.5 rounded-full font-nunito text-muted-foreground ${className ?? ""}`}
      >
        <IconFlag size={14} aria-hidden="true" />
        {label}
      </Button>
      <ReportUserModal
        name={isOpen ? target.name : null}
        reasons={isApartment ? APARTMENT_REPORT_REASONS : USER_REPORT_REASONS}
        isSubmitting={isSubmitting}
        error={error}
        onClose={() => setIsOpen(false)}
        onSubmit={(reason, details) => void submit(reason, details)}
      />
    </>
  );
}
