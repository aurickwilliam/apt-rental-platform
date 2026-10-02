"use client";

import { useActionState } from "react";
import { Button, Spinner } from "@heroui/react";
import { IconKey } from "@tabler/icons-react";

import { addRole } from "@/app/(auth)/actions/add-role";

type Props = {
  currentRoles: string[];
  targetRole: "tenant" | "landlord";
};

// Profile-page section letting a single-role account add its second role.
// Renders nothing when the account already holds the target role.
export default function AddRoleSection({ currentRoles, targetRole }: Props) {
  const [state, action, isPending] = useActionState(addRole, {});

  if (currentRoles.includes(targetRole)) return null;

  const targetLabel = targetRole === "landlord" ? "Landlord" : "Tenant";

  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="role" value={targetRole} />

      <div>
        <h2 className="flex items-center gap-2 font-nunito text-lg font-semibold text-primary">
          <IconKey size={20} className="shrink-0 text-primary" aria-hidden="true" />
          Account roles
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Your account currently has{" "}
          {currentRoles.length > 0 ? currentRoles.join(" and ") : "no"} access.
          Add {targetLabel.toLowerCase()} access to use this account as{" "}
          {targetRole === "landlord" ? "an owner" : "a renter"} too — no
          re-registration needed.
        </p>
      </div>

      {state?.error && (
        <div className="rounded-lg border border-danger-200 bg-danger-50 p-3">
          <p className="text-center text-sm text-danger">{state.error}</p>
        </div>
      )}

      <div>
        <Button
          type="submit"
          variant="primary"
          isDisabled={isPending}
          className="w-full sm:w-auto"
        >
          {isPending ? (
            <>
              <Spinner size="sm" />
              Adding {targetLabel.toLowerCase()} access...
            </>
          ) : (
            `Add ${targetLabel} access`
          )}
        </Button>
      </div>
    </form>
  );
}
