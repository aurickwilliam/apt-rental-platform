import { Modal, Button, InputOTP, REGEXP_ONLY_DIGITS } from "@heroui/react";
import { Mail } from "lucide-react";

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
}: OtpModalProps) {
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
                  <Modal.Heading>Verify Your Email Address</Modal.Heading>
                </Modal.Header>

                <Modal.Body className="flex flex-col items-center gap-4 py-4">
                  <div className="rounded-full bg-primary/10 p-3">
                    <Mail size={32} className="text-primary" />
                  </div>

                  <p className="text-center text-sm text-black">
                    We sent a 6-digit verification code to{" "}
                    <span className="font-semibold text-foreground">{email}</span>.
                  </p>

                  <InputOTP
                    maxLength={6}
                    value={otp}
                    onChange={(val) => onOtpChange(val)}
                    isInvalid={!!otpError}
                    pattern={REGEXP_ONLY_DIGITS}
                    autoFocus
                  >
                    <InputOTP.Group>
                      <InputOTP.Slot index={0} />
                      <InputOTP.Slot index={1} />
                      <InputOTP.Slot index={2} />
                    </InputOTP.Group>
                    <InputOTP.Separator />
                    <InputOTP.Group>
                      <InputOTP.Slot index={3} />
                      <InputOTP.Slot index={4} />
                      <InputOTP.Slot index={5} />
                    </InputOTP.Group>
                  </InputOTP>

                  {otpError && (
                    <p className="text-center text-sm text-danger">{otpError}</p>
                  )}

                  <div className="flex items-center gap-2 text-sm text-black">
                    <span>Didn&apos;t receive a code?</span>
                    {resendCooldown > 0 ? (
                      <span className="font-medium text-primary">
                        Resend in {formatCooldown(resendCooldown)}
                      </span>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        isPending={resendLoading}
                        isDisabled={resendLoading}
                        onPress={onResend}
                        className="h-auto min-w-0 p-0 font-medium"
                      >
                        Resend Code
                      </Button>
                    )}
                  </div>
                </Modal.Body>

                <Modal.Footer className="flex flex-col gap-2">
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full"
                    isDisabled={otp.length < 6 || loading}
                    isPending={loading}
                    onPress={() => onVerify(close)}
                  >
                    Verify &amp; Create Account
                  </Button>
                  <Button
                    variant="ghost"
                    size="lg"
                    className="w-full"
                    isDisabled={loading}
                    onPress={() => onCancel(close)}
                  >
                    Cancel
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