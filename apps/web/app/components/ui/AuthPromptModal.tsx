"use client";

import {
  Button,
  Modal,
} from "@heroui/react";

import Link from "next/link";

interface AuthPromptModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  signInHref?: string;
  signUpHref?: string;
}

export default function AuthPromptModal({
  isOpen,
  onOpenChange,
  title = "Sign in to save",
  description = "You need an account to save apartments and access them anytime.",
  signInHref = "/sign-in",
  signUpHref = "/sign-up",
}: AuthPromptModalProps) {
  return (
    <Modal>
      <Modal.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
        <Modal.Container>
          <Modal.Dialog>
            {({ close }) => (
              <>
                <Modal.Header>
                  <Modal.Heading>{title}</Modal.Heading>
                </Modal.Header>
                <Modal.Body className="text-sm text-muted">
                  {description}
                </Modal.Body>
                <Modal.Footer className="flex-col gap-2">
                  <Button
                    size="lg"
                    className="w-full"
                    onPress={close}
                  >
                    <Link href={signInHref}> 
                      Sign in
                    </Link>
                  </Button>
                  <Button
                    variant="tertiary"
                    size="lg"
                    className="w-full"
                    onPress={close}
                  >
                    <Link href={signUpHref}>
                      Sign up
                    </Link>
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
