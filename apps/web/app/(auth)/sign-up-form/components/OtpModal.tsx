"use client";

import { Modal, Button, Link as HeroLink } from "@heroui/react";
import { IconMail as Mail } from "@tabler/icons-react";
import CodeInput from "@/app/components/inputs/CodeInput";
import { useTranslation } from "@/app/components/i18n/LocaleProvider";

interface OtpModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void; // v3: boolean arg
  email: string;
  otp: string;
  otpError: string | null;
  resendCooldown: number;
  resendLoading: boolean;
  loading: boolean;
  formatCooldown: (seconds: number) => string;
  onOtpChange: (val: string) => void;
  onResend: () => void;
  onVerify: (close: () => void) => void;
  onCancel: (close: () => void) => void;
  verifyLabel?: string;
  // Too many wrong codes: verifying stays off until a new code is sent.
  locked?: boolean;
}

export default function OtpModal({
  isOpen,
  onOpenChange,
  email,
  otp,
  otpError,
  resendCooldown,
  resendLoading,
  loading,
  formatCooldown,
  onOtpChange,
  onResend,
  onVerify,
  onCancel,
  verifyLabel,
  locked = false,
}: OtpModalProps) {
  const { t } = useTranslation();

  return (
    <Modal>
      <Modal.Backdrop
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        variant="blur"
        isDismissable={false}
        isKeyboardDismissDisabled
      >
        <Modal.Container placement="center">
          <Modal.Dialog>
            {({ close }) => (
              <>
                <Modal.Header>
                  <Modal.Heading className="font-nunito font-bold">
                    {t("auth.otp.verifyTitle")}
                  </Modal.Heading>
                </Modal.Header>

                <Modal.Body className="flex flex-col items-center gap-4 py-4">
                  <div className="rounded-full bg-primary/10 p-3">
                    <Mail size={32} className="text-primary" />
                  </div>

                  <p className="text-center text-sm text-foreground">
                    {t("auth.otp.sentTo", { email })}
                  </p>

                  <div className="flex w-full justify-center">
                    <CodeInput
                      length={6}
                      value={otp}
                      onChange={onOtpChange}
                      isInvalid={!!otpError}
                      autoFocus
                    />
                  </div>

                  {otpError && (
                    <p className="text-center text-sm text-danger">{otpError}</p>
                  )}

                  {/* HeroUI Link without href: an action styled as a link (mobile's LinkButton). */}
                  <div className="flex items-center gap-2 text-sm text-foreground">
                    <span>{t("auth.otp.didntReceive")}</span>
                    {resendCooldown > 0 ? (
                      <span className="font-medium text-primary">
                        {t("auth.otp.resendIn", { seconds: formatCooldown(resendCooldown) })}
                      </span>
                    ) : (
                      <HeroLink
                        onPress={onResend}
                        isDisabled={resendLoading}
                        className="cursor-pointer font-medium text-primary"
                      >
                        {resendLoading ? t("auth.otp.sending") : t("auth.otp.resendCode")}
                      </HeroLink>
                    )}
                  </div>
                </Modal.Body>

                <Modal.Footer className="flex flex-col gap-2">
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full"
                    isDisabled={otp.length < 6 || loading || locked}
                    isPending={loading}
                    onPress={() => onVerify(close)}
                  >
                    {verifyLabel ?? t("auth.otp.verifyCreateAccount")}
                  </Button>
                  <Button
                    variant="ghost"
                    size="lg"
                    className="w-full"
                    isDisabled={loading}
                    onPress={() => onCancel(close)}
                  >
                    {t("common.cancel")}
                  </Button>
                </Modal.Footer>
              </>
            )}
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}