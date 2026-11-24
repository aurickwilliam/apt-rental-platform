"use client";

import { useCallback, useState } from "react";
import { IconDeviceMobile, IconPlus, IconShieldLock } from "@tabler/icons-react";
import { Button, Separator } from "@heroui/react";

import { createClient } from "@repo/supabase/browser";

import { useTranslation } from "@/app/components/i18n/LocaleProvider";
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
  const { t } = useTranslation();
  const load = useCallback(async (): Promise<TwoStepStatus> => {
    const supabase = createClient();
    const { data: factors, error } = await supabase.auth.mfa.listFactors();
    if (error) throw error;
    const { data: assurance } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    return {
      devices: factors.totp.map((factor) => ({
        id: factor.id,
        name: factor.friendly_name ?? t("settings.security.twoStep.authenticator"),
      })),
      level: toAssuranceLevel(assurance?.currentLevel),
    };
  }, [t]);

  const { data, loading, error, refresh } = useAsyncResource(
    load,
    EMPTY_STATUS,
    t("settings.security.twoStep.loadError"),
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
      setRemoveError(t("settings.security.twoStep.removeError"));
      return;
    }
    await refresh();
  };

  return (
    <div className="mt-4">
      <SettingsRow
        icon={<IconShieldLock size={18} />}
        title={t("settings.security.twoStep.title")}
        description={t("settings.security.twoStep.description")}
        hideChevron
        suffix={
          loading || error ? undefined : (
            <StatusChip
            label={
              hasDevices
                ? t("settings.security.twoStep.on")
                : t("settings.security.twoStep.off")
            }
          />
          )
        }
      />

      {error && <p className="mt-2 text-sm text-danger">{error}</p>}

      {!loading && !error && (
        <div className="mt-2 flex flex-col gap-1">
          {data.devices.map((device) => (
            <div
              key={device.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-border px-4 py-2 text-sm text-foreground"
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
                  {t("settings.security.twoStep.remove")}
                </Button>
              )}
            </div>
          ))}

          {removeError && <p className="text-sm text-danger">{removeError}</p>}

          <Separator className="my-1" />

          {!hasDevices && (
            <SettingsRow
              icon={<IconPlus size={18} />}
              title={t("settings.security.twoStep.setUp")}
              href={ADMIN_MFA_PATH}
            />
          )}
          {hasDevices && verified && (
            <SettingsRow
              icon={<IconPlus size={18} />}
              title={t("settings.security.twoStep.addBackup")}
              description={t("settings.security.twoStep.addBackup.description")}
              href={`${ADMIN_MFA_PATH}?mode=add`}
            />
          )}
          {hasDevices && !verified && (
            <SettingsRow
              icon={<IconShieldLock size={18} />}
              title={t("settings.security.twoStep.enterCode")}
              href={ADMIN_MFA_PATH}
            />
          )}
        </div>
      )}
    </div>
  );
}
