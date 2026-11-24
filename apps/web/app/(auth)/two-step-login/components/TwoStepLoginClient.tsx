"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@heroui/react";

import { createClient } from "@repo/supabase/browser";
import { otpAttemptErrorMessage } from "@repo/utils";

import { useTranslation } from "@/app/components/i18n/LocaleProvider";
import ErrorBanner from "@/app/components/display/ErrorBanner";
import CodeInput from "@/app/components/inputs/CodeInput";
import { ADMIN_HOME, qrCodeImageSrc } from "@/lib/admin-mfa";
import { signOut } from "../../actions/sign-out";
import { useOtpAttempts } from "../../hooks/use-otp-attempts";
import RecoveryHeader from "../../forgot-password/components/RecoveryHeader";

const CODE_LENGTH = 6;

interface PendingEnrollment {
  factorId: string;
  // Data URI of the QR image, and the same key for typing in by hand.
  qrCode: string;
  secret: string;
}

interface TwoStepLoginClientProps {
  step: "enroll" | "challenge";
  // Already verified: this is an extra (backup) device added from Settings.
  adding: boolean;
}

export default function TwoStepLoginClient({ step, adding }: TwoStepLoginClientProps) {
  const { language, t } = useTranslation();
  const [enrollment, setEnrollment] = useState<PendingEnrollment | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const attempts = useOtpAttempts();

  const enrolling = step === "enroll";
  const locked = attempts.locked;

  // A second sign-in with an unfinished set-up leaves an unverified device
  // behind; clear those so enrolling again always works.
  const startEnrollment = async () => {
    setBusy(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data: existing } = await supabase.auth.mfa.listFactors();
      for (const factor of existing?.all ?? []) {
        if (factor.factor_type === "totp" && factor.status === "unverified") {
          await supabase.auth.mfa.unenroll({ factorId: factor.id });
        }
      }
      const { data, error: enrollError } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: `Authenticator ${crypto.randomUUID().slice(0, 6)}`,
      });
      if (enrollError || !data) {
        console.error("Two-step enrolment failed", enrollError);
        setError(t("common.error"));
        return;
      }
      setEnrollment({
        factorId: data.id,
        qrCode: qrCodeImageSrc(data.totp.qr_code),
        secret: data.totp.secret,
      });
    } catch (err) {
      console.error("Two-step enrolment failed", err);
      setError(t("common.error"));
    } finally {
      setBusy(false);
    }
  };

  // Tries every verified device in turn, so a backup device works on a sign-in
  // that lists the first one.
  const verifiedFactorIds = async (): Promise<string[]> => {
    const { data } = await createClient().auth.mfa.listFactors();
    return (data?.totp ?? []).map((factor) => factor.id);
  };

  const verify = async (value: string) => {
    if (busy || locked || value.length !== CODE_LENGTH) return;
    setBusy(true);
    setError(null);
    try {
      const supabase = createClient();
      const factorIds = enrollment ? [enrollment.factorId] : await verifiedFactorIds();
      let verified = false;
      for (const factorId of factorIds) {
        const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({
          factorId,
          code: value,
        });
        if (!verifyError) {
          verified = true;
          break;
        }
      }
      if (!verified) {
        setCode("");
        const remaining = attempts.recordWrongCode();
        setError(
          remaining <= 0
            ? t("auth.twoStep.tooManyCodes")
            : otpAttemptErrorMessage(language, remaining),
        );
        return;
      }
      // Full navigation: the upgraded session cookies must reach the server.
      window.location.assign(ADMIN_HOME);
    } catch (err) {
      console.error("Two-step verification failed", err);
      setError(t("common.error"));
    } finally {
      setBusy(false);
    }
  };

  const title = enrolling
    ? t("auth.twoStep.enrollTitle")
    : t("auth.twoStep.challengeTitle");
  const description = enrolling
    ? adding
      ? t("auth.twoStep.enrollBackupBody")
      : t("auth.twoStep.enrollBody")
    : t("auth.twoStep.challengeBody");

  return (
    <>
      <RecoveryHeader title={title} description={description} />

      {error && <ErrorBanner message={error} />}

      <div className="mt-[clamp(1.5rem,4vh,2rem)] flex flex-col gap-5">
        {enrolling && !enrollment && (
          <Button
            variant="primary"
            size="lg"
            className="w-full"
            isPending={busy}
            isDisabled={busy}
            onPress={startEnrollment}
          >
            {adding ? t("auth.twoStep.addBackup") : t("auth.twoStep.setUp")}
          </Button>
        )}

        {enrolling && enrollment && (
          <div className="flex flex-col items-center gap-3 text-center">
            <p className="text-sm text-foreground">{t("auth.twoStep.scan")}</p>
            {/* The QR is a data URI from Auth, so next/image optimisation does not apply. */}
            <Image
              src={enrollment.qrCode}
              alt={t("auth.twoStep.qrAlt")}
              width={176}
              height={176}
              unoptimized
              className="rounded-lg border border-border bg-white p-2"
            />
            <p className="text-xs text-default-500">
              {t("auth.twoStep.cantScan")}{" "}
              <span className="select-all break-all font-mono text-foreground">
                {enrollment.secret}
              </span>
            </p>
          </div>
        )}

        {(!enrolling || enrollment) && (
          <>
            <CodeInput
              length={CODE_LENGTH}
              value={code}
              onChange={setCode}
              onComplete={verify}
              isInvalid={!!error}
              isDisabled={busy || locked}
              autoFocus
              aria-label={t("auth.twoStep.codeAria")}
            />
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              isPending={busy}
              isDisabled={busy || locked || code.length !== CODE_LENGTH}
              onPress={() => verify(code)}
            >
              {enrolling ? t("auth.twoStep.verifyAndTurnOn") : t("auth.twoStep.verify")}
            </Button>
          </>
        )}

        {adding ? (
          <Button variant="ghost" size="lg" className="w-full" onPress={() => window.location.assign(ADMIN_HOME)}>
            {t("common.cancel")}
          </Button>
        ) : (
          <form action={signOut}>
            <Button variant="ghost" size="lg" className="w-full" type="submit">
              {t("auth.twoStep.signOut")}
            </Button>
          </form>
        )}
      </div>
    </>
  );
}
