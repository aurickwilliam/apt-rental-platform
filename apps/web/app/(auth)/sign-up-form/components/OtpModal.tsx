import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  InputOtp,
} from "@heroui/react";
import { Mail } from "lucide-react";

interface OtpModalProps {
  isOpen: boolean;
  onOpenChange: () => void;
  email: string;
  otp: string;
  otpError: string | null;
  resendCooldown: number;
  resendLoading: boolean;
  loading: boolean;
  formatCooldown: (seconds: number) => string;
  onOtpChange: (val: string) => void;
  onResend: () => void;
  onVerify: (onClose: () => void) => void;
  onCancel: (onClose: () => void) => void;
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
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      placement="center"
      backdrop="blur"
      isDismissable={false}
      isKeyboardDismissDisabled
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              Verify Your Email Address
            </ModalHeader>
            <ModalBody className="flex flex-col items-center gap-4 py-4">
              <div className="rounded-full bg-primary/10 p-3">
                <Mail size={32} className="text-primary" />
              </div>
              <p className="text-center text-sm text-default-500">
                We sent a 6-digit verification code to{" "}
                <span className="font-semibold text-foreground">{email}</span>.
              </p>
              <InputOtp
                length={6}
                size="lg"
                variant="bordered"
                color="primary"
                value={otp}
                onValueChange={(val) => onOtpChange(val)}
                autoFocus
              />

              {otpError && (
                <p className="text-sm text-danger text-center">{otpError}</p>
              )}

              <div className="flex items-center gap-2 text-sm text-default-500">
                <span>Didn&apos;t receive a code?</span>
                {resendCooldown > 0 ? (
                  <span className="font-medium text-default-400">
                    Resend in {formatCooldown(resendCooldown)}
                  </span>
                ) : (
                  <Button
                    variant="light"
                    size="sm"
                    color="primary"
                    isLoading={resendLoading}
                    isDisabled={resendLoading}
                    onPress={onResend}
                    className="p-0 h-auto min-w-0 font-medium"
                  >
                    Resend Code
                  </Button>
                )}
              </div>
            </ModalBody>
            <ModalFooter className="flex flex-col gap-2">
              <Button
                color="primary"
                radius="full"
                size="lg"
                className="w-full"
                isDisabled={otp.length < 6 || loading}
                isLoading={loading}
                onPress={() => onVerify(onClose)}
              >
                Verify &amp; Create Account
              </Button>
              <Button
                variant="light"
                radius="full"
                size="lg"
                className="w-full"
                isDisabled={loading}
                onPress={() => onCancel(onClose)}
              >
                Cancel
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}