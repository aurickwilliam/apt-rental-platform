"use client";

import { useState } from "react";
import { Button, Modal } from "@heroui/react";
import { FileText } from "lucide-react";

const DESCRIPTION_PREVIEW_LENGTH = 500;

export default function ApartmentDescription({ description }: { description: string | null }) {
  const [isOpen, setIsOpen] = useState(false);
  const text = description || "No description provided.";
  const isTruncated = text.length > DESCRIPTION_PREVIEW_LENGTH;
  const preview = isTruncated
    ? `${text.slice(0, DESCRIPTION_PREVIEW_LENGTH).trimEnd()}…`
    : text;

  return (
    <section>
      <h2 className="flex items-center gap-2 font-nunito text-lg font-bold text-primary">
        <FileText size={20} aria-hidden="true" /> Description
      </h2>
      <p className="mt-2 whitespace-pre-line text-sm leading-6">{preview}</p>
      {isTruncated ? (
        <>
          <Button variant="tertiary" size="sm" className="mt-2" onPress={() => setIsOpen(true)}>
            See all
          </Button>
          <Modal isOpen={isOpen} onOpenChange={setIsOpen}>
            <Modal.Backdrop>
              <Modal.Container placement="center" scroll="inside" className="w-full max-w-4xl sm:w-full">
                <Modal.Dialog className="w-full max-w-4xl rounded-3xl bg-card p-5">
                  <Modal.CloseTrigger aria-label="Close description" className="text-foreground" />
                  <Modal.Header className="pr-10">
                    <Modal.Heading className="flex items-center gap-2 font-nunito text-xl font-bold">
                      <FileText size={20} className="text-primary" aria-hidden="true" /> Description
                    </Modal.Heading>
                  </Modal.Header>
                  <Modal.Body>
                    <p className="whitespace-pre-line wrap-break-word text-sm leading-6 text-foreground">{text}</p>
                  </Modal.Body>
                </Modal.Dialog>
              </Modal.Container>
            </Modal.Backdrop>
          </Modal>
        </>
      ) : null}
    </section>
  );
}
