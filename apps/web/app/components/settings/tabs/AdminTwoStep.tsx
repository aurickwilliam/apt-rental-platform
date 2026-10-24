"use client";

import { useCallback, useState } from "react";
import { IconDeviceMobile, IconPlus, IconShieldLock } from "@tabler/icons-react";
import { Button, Separator } from "@heroui/react";

import { createClient } from "@repo/supabase/browser";

import { useAsyncResource } from "@/hooks/use-async-resource";
import { ADMIN_MFA_PATH, toAssuranceLevel, type AssuranceLevel } from "@/lib/admin-mfa";
import SettingsRow from "../SettingsRow";
import StatusChip from "../StatusChip";

interface Device {
  id: string;
  name: string;
}

interface TwoStepStatus {
  devices: Device[];
  level: AssuranceLevel;
}

const EMPTY_STATUS: TwoStepStatus = { devices: [], level: "aal1" };

// Admin-only: authenticator-app devices behind two-step login. Adding a backup
// and removing a device need a verified session (aal2); the last device cannot
// be removed, so the account is never left without a way in.
export default function AdminTwoStep() {
  const load = useCallback(async (): Promise<TwoStepStatus> => {
    const supabase = createClient();
    const { data: factors, error } = await supabase.auth.mfa.listFactors();
    if (error) throw error;
    const { data: assurance } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    return {
      devices: factors.totp.map((factor) => ({
        id: factor.id,
        name: factor.friendly_name ?? "Authenticator app",
      })),
      level: toAssuranceLevel(assurance?.currentLevel),
    };
  }, []);

  const { data, loading, error, refresh } = useAsyncResource(
    load,
    EMPTY_STATUS,
    "Could not load two-step login.",
  );
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [removeError, setRemoveError] = useState<string | null>(null);

  const verified = data.level === "aal2";
  const hasDevices = data.devices.length > 0;

  const remove = async (id: string) => {
    setRemovingId(id);
    setRemoveError(null);
    const { error: unenrollError } = await createClient().auth.mfa.unenroll({ factorId: id });
    setRemovingId(null);
    if (unenrollError) {
      console.error("Could not remove the authenticator device", unenrollError);
      setRemoveError("Could not remove that device. Please try again.");
      return;
    }
    await refresh();
  };

  return (
    <div className="mt-4">
      <SettingsRow
        icon={<IconShieldLock size={18} />}
        title="Two-step login"
        description="Require a code from an authenticator app when you sign in."
        hideChevron
        suffix={
          loading || error ? undefined : (
            <StatusChip label={hasDevices ? "On" : "Off"} />
          )
        }
      />

      {error && <p className="mt-2 text-sm text-danger">{error}</p>}

      {!loading && !error && (
        <div className="mt-2 flex flex-col gap-1">
          {data.devices.map((device) => (
            <div
              key={device.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-border px-4 py-2 text-sm"
            >
              <span className="flex min-w-0 items-center gap-2">
                <IconDeviceMobile size={16} aria-hidden="true" className="shrink-0" />
                <span className="truncate">{device.name}</span>
              </span>
              {verified && data.devices.length > 1 && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-danger"
                  isPending={removingId === device.id}
                  isDisabled={removingId !== null}
                  onPress={() => remove(device.id)}
                >
                  Remove
                </Button>
              )}
            </div>
          ))}

          {removeError && <p className="text-sm text-danger">{removeError}</p>}

          <Separator className="my-1" />

          {!hasDevices && (
            <SettingsRow
              icon={<IconPlus size={18} />}
              title="Set up authenticator app"
              href={ADMIN_MFA_PATH}
            />
          )}
          {hasDevices && verified && (
            <SettingsRow
              icon={<IconPlus size={18} />}
              title="Add a backup device"
              description="Either device can sign you in if one is lost."
              href={`${ADMIN_MFA_PATH}?mode=add`}
            />
          )}
          {hasDevices && !verified && (
            <SettingsRow
              icon={<IconShieldLock size={18} />}
              title="Enter a code to manage devices"
              href={ADMIN_MFA_PATH}
            />
          )}
        </div>
      )}
    </div>
  );
}
