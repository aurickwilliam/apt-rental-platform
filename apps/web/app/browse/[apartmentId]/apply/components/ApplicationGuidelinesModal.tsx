"use client";

import { Button, Modal } from "@heroui/react";
import {
  IconBriefcase,
  IconFileCheck,
  IconId,
  IconShieldCheck,
  IconUserCheck,
  type Icon,
} from "@tabler/icons-react";

interface Guideline {
  Icon: Icon;
  title: string;
  description: string;
}

// Same copy as mobile `ApplicationGuidelinesSheet`.
const GUIDELINES: Guideline[] = [
  {
    Icon: IconFileCheck,
    title: "Your APT Passport is submitted automatically",
    description: "Your ID and supporting documents are sent with your application, so there is nothing to upload.",
  },
  {
    Icon: IconShieldCheck,
    title: "Verified account required",
    description: "Only tenants with a verified account can apply. Verify your account first if you haven't.",
  },
  {
    Icon: IconId,
    title: "Required documents",
    description:
      "A government ID and proof of billing or residency. Employed and self-employed tenants also need proof of income. NBI clearance is optional.",
  },
  {
    Icon: IconBriefcase,
    title: "Keep your documents current",
    description:
      "Expired or rejected documents are not sent. Upload a current copy to your APT Passport before applying.",
  },
  {
    Icon: IconUserCheck,
    title: "One application per apartment",
    description:
      "You can have one pending application for each apartment, and you can't apply to your own listing. Please provide accurate information.",
  },
];

interface ApplicationGuidelinesModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Rules for applying, shown when the apply flow opens and on demand. */
export default function ApplicationGuidelinesModal({ isOpen, onOpenChange }: ApplicationGuidelinesModalProps) {
  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
      <Modal.Backdrop>
        <Modal.Container placement="center" scroll="inside" size="md">
          <Modal.Dialog className="rounded-3xl bg-card">
            <Modal.CloseTrigger />
            <Modal.Header className="flex flex-col items-start gap-1">
              <Modal.Heading className="font-nunito text-xl font-bold text-card-foreground">Before you apply</Modal.Heading>
              <p className="text-sm text-muted-foreground">A few things to know about applying for this apartment.</p>
            </Modal.Header>
            <Modal.Body className="space-y-4">
              {GUIDELINES.map(({ Icon, title, description }) => (
                <div key={title} className="flex gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-primary">
                    <Icon size={20} aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="font-nunito text-base font-semibold text-card-foreground">{title}</p>
                    <p className="text-sm text-muted-foreground">{description}</p>
                  </div>
                </div>
              ))}
            </Modal.Body>
            <Modal.Footer>
              <Button fullWidth onPress={() => onOpenChange(false)}>
                I understand
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
