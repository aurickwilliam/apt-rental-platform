"use client";

import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/react";

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
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      placement="center"
      backdrop="blur"
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">{title}</ModalHeader>
            <ModalBody className="text-sm text-default-500">
              {description}
            </ModalBody>
            <ModalFooter className="flex flex-col gap-2">
              <Button
                color="primary"
                radius="full"
                size="lg"
                className="w-full"
                as="a"
                href={signInHref}
                onPress={onClose}
              >
                Sign in
              </Button>
              <Button
                variant="light"
                radius="full"
                size="lg"
                className="w-full"
                as="a"
                href={signUpHref}
                onPress={onClose}
              >
                Sign up
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
