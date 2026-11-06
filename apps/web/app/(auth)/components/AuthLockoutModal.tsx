import { Button, Modal } from "@heroui/react";
import { IconLock } from "@tabler/icons-react";
import { AUTH_LOCKOUT_TITLE, formatLockoutClock, lockoutDescription } from "@repo/utils";

interface AuthLockoutModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  /** Seconds left on the lock; the countdown follows it. */
  secondsLeft: number;
}

// Shown when sign-in (or a code step on its own page) hits the attempt limit. The
// button behind it stays disabled with the same countdown until the lock ends.
// Code steps that already live inside a modal use AuthLockoutNotice instead: a
// second overlay opened from inside a HeroUI overlay misbehaves (see AGENTS.md).
export default function AuthLockoutModal({ isOpen, onOpenChange, secondsLeft }: AuthLockoutModalProps) {
  return (
    <Modal>
      <Modal.Backdrop isOpen={isOpen} onOpenChange={onOpenChange} variant="blur">
        <Modal.Container placement="center">
          <Modal.Dialog>
            <Modal.CloseTrigger className="text-foreground" />
            <Modal.Header>
              <Modal.Heading className="font-nunito font-bold">{AUTH_LOCKOUT_TITLE}</Modal.Heading>
            </Modal.Header>

            <Modal.Body className="flex flex-col items-center gap-4 py-4">
              <div className="rounded-full bg-danger-100 p-3">
                <IconLock size={40} className="text-danger" aria-hidden="true" />
              </div>
              <p className="text-center text-sm text-foreground">{lockoutDescription(secondsLeft)}</p>
              <p className="text-center text-sm text-foreground">
                You can try again in{" "}
                <span className="font-semibold tabular-nums" role="timer" aria-live="off">
                  {formatLockoutClock(secondsLeft)}
                </span>
              </p>
            </Modal.Body>

            <Modal.Footer>
              <Button variant="primary" size="lg" className="w-full cursor-pointer" slot="close">
                Got it
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
