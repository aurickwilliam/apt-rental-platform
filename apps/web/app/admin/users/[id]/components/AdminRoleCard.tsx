"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { IconShieldCheck, IconShieldOff } from "@tabler/icons-react";
import { Button, TextArea } from "@heroui/react";
import CodeInput from "@/app/components/inputs/CodeInput";
import { getAdminRoleOption } from "@/lib/admin-role-change";
import { setAdminRole } from "../../../actions/operations";
import type { AdminUserDetail } from "../../lib/user-display";

const CODE_LENGTH = 6;
const MIN_REASON_LENGTH = 3;

const COPY = {
  grant: {
    title: "Make admin",
    description:
      "This person can review verifications, moderate listings, suspend accounts and add or remove other admins. They keep their current tenant or landlord access.",
    warning: "Confirm with your authenticator app. They must set up two-step login before they can use the admin portal.",
    confirm: "Confirm make admin",
  },
  revoke: {
    title: "Remove admin access",
    description: "This person loses the admin portal at once and is signed out everywhere. Their tenant or landlord access stays.",
    warning: "Confirm with your authenticator app.",
    confirm: "Confirm remove admin",
  },
};

interface AdminRoleCardProps {
  user: AdminUserDetail;
  viewerId: string;
}

export default function AdminRoleCard({ user, viewerId }: AdminRoleCardProps) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [code, setCode] = useState("");
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const option = getAdminRoleOption(user, viewerId);

  if (option.kind === "unavailable") {
    return (
      <div className="rounded-2xl border border-border bg-muted/40 p-4 text-sm">
        <p className="font-semibold text-foreground">Admin access</p>
        <p className="mt-1 text-muted-foreground">{option.message}</p>
      </div>
    );
  }

  const { decision } = option;
  const copy = COPY[decision];
  const Icon = decision === "grant" ? IconShieldCheck : IconShieldOff;

  const cancel = () => {
    setIsConfirming(false);
    setCode("");
    setError(null);
  };

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (reason.trim().length < MIN_REASON_LENGTH) {
      setError(`Enter a reason of at least ${MIN_REASON_LENGTH} characters.`);
      return;
    }
    if (!isConfirming) {
      setError(null);
      setIsConfirming(true);
      return;
    }
    if (code.length !== CODE_LENGTH) {
      setError("Enter the 6-digit code from your authenticator app.");
      return;
    }

    const formData = new FormData();
    formData.set("id", user.id);
    formData.set("decision", decision);
    formData.set("reason", reason.trim());
    formData.set("code", code);
    startTransition(async () => {
      try {
        const result = await setAdminRole(formData);
        // A code works only once, so any failure needs a new one.
        setCode("");
        if (result.error) {
          setError(result.error);
          return;
        }
        setReason("");
        setIsConfirming(false);
        setError(null);
        router.refresh();
      } catch (submitError) {
        console.error("Admin role change failed", submitError);
        setCode("");
        setError("Admin access could not be updated. Refresh and try again.");
      }
    });
  };

  return (
    <form onSubmit={submit} className="rounded-2xl border border-border p-4">
      <div className="flex items-start gap-3">
        <Icon
          size={20}
          className={`mt-0.5 shrink-0 ${decision === "grant" ? "text-primary" : "text-danger"}`}
          aria-hidden="true"
        />
        <div>
          <p className="font-semibold text-foreground">{copy.title}</p>
          <p className="mt-1 text-sm text-muted-foreground">{copy.description}</p>
        </div>
      </div>
      <div className="mt-4">
        <label htmlFor="admin-role-reason" className="text-sm font-semibold">
          Reason <span className="text-danger">*</span>
        </label>
        <TextArea
          id="admin-role-reason"
          value={reason}
          onChange={(event) => {
            setReason(event.target.value);
            cancel();
          }}
          placeholder="Explain this admin access change…"
          minLength={MIN_REASON_LENGTH}
          maxLength={500}
          required
          disabled={isPending}
          className="mt-2 w-full bg-card! text-foreground!"
        />
      </div>
      {isConfirming ? (
        <div className="mt-4 space-y-3 rounded-xl border border-danger/30 bg-danger/10 p-3 text-sm">
          <p>{copy.warning} This action will be added to the audit log.</p>
          <CodeInput
            length={CODE_LENGTH}
            value={code}
            onChange={setCode}
            isInvalid={!!error}
            isDisabled={isPending}
            autoFocus
            aria-label="6-digit authenticator code"
          />
        </div>
      ) : null}
      {error ? <p role="alert" className="mt-3 text-sm text-danger">{error}</p> : null}
      <div className="mt-4 flex flex-wrap gap-2">
        {isConfirming ? (
          <Button type="button" variant="outline" className="cursor-pointer" onPress={cancel} isDisabled={isPending}>
            Cancel
          </Button>
        ) : null}
        <Button
          type="submit"
          variant={decision === "grant" ? "primary" : "danger"}
          className="cursor-pointer"
          isPending={isPending}
          isDisabled={isConfirming && code.length !== CODE_LENGTH}
        >
          {isConfirming ? copy.confirm : copy.title}
        </Button>
      </div>
    </form>
  );
}
