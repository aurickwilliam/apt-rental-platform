"use client";

import { useState } from "react";
import { Button, Spinner } from "@heroui/react";
import { createClient } from "@repo/supabase/browser";
import { useAuth } from "./AuthContext";

// Role-picker Continue button for pending-onboarding users (placeholder
// tenant row, already authenticated via Google). Runs the existing
// set_onboarding_role RPC with the chosen tab role, then reuses the
// initial-Google-onboarding path to complete-profile. RPC failures are
// shown verbatim so they can be reported.
export default function RolePickerContinue() {
  const { role } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const handleContinue = async () => {
    setError(null);
    setIsPending(true);

    const supabase = createClient();
    const { error: roleError } = await supabase.rpc("set_onboarding_role", {
      requested_role: role,
    });

    setIsPending(false);

    if (roleError) {
      setError(roleError.message);
      return;
    }

    window.location.href = `/complete-profile?role=${role}`;
  };

  const targetLabel = role === "landlord" ? "Landlord" : "Tenant";

  return (
    <div className="flex flex-col gap-3 mt-5">
      {error && (
        <div className="w-full p-3 bg-danger-50 border border-danger-200 rounded-lg">
          <p className="text-sm text-danger text-center">{error}</p>
        </div>
      )}
      <Button
        variant="primary"
        className="w-full h-11 font-medium"
        isDisabled={isPending}
        isPending={isPending}
        onPress={handleContinue}
      >
        {isPending ? (
          <>
            <Spinner size="sm" />
            Setting up {targetLabel.toLowerCase()} access...
          </>
        ) : (
          `Continue as ${targetLabel}`
        )}
      </Button>
    </div>
  );
}
