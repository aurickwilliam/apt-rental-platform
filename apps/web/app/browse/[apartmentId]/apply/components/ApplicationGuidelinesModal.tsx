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

import type { TranslationKey } from "@repo/i18n";

import { useTranslation } from "@/app/components/i18n/LocaleProvider";

interface Guideline {
  Icon: Icon;
  titleKey: TranslationKey;
  bodyKey: TranslationKey;
}

// Same copy as mobile `ApplicationGuidelinesSheet`.
const GUIDELINES: Guideline[] = [
  {
    Icon: IconFileCheck,
    titleKey: "apply.guidelines.passport.title",
    bodyKey: "apply.guidelines.passport.body",
  },
  {
    Icon: IconShieldCheck,
    titleKey: "apply.guidelines.verified.title",
    bodyKey: "apply.guidelines.verified.body",
  },
  {
    Icon: IconId,
    titleKey: "apply.guidelines.documents.title",
    bodyKey: "apply.guidelines.documents.body",
  },
  {
    Icon: IconBriefcase,
    titleKey: "apply.guidelines.current.title",
    bodyKey: "apply.guidelines.current.body",
  },
  {
    Icon: IconUserCheck,
    titleKey: "apply.guidelines.one.title",
    bodyKey: "apply.guidelines.one.body",
  },
];

interface ApplicationGuidelinesModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Rules for applying, opened from the Apply Now modal's guidelines link. */
export default function ApplicationGuidelinesModal({ isOpen, onOpenChange }: ApplicationGuidelinesModalProps) {
  const { t } = useTranslation();

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
      <Modal.Backdrop>
        <Modal.Container placement="center" scroll="inside" size="md">
          <Modal.Dialog className="rounded-3xl bg-card">
            <Modal.CloseTrigger className="cursor-pointer text-card-foreground" />
            <Modal.Header className="flex flex-col items-start gap-1">
              <Modal.Heading className="font-nunito text-xl font-bold text-card-foreground">
                {t("apply.guidelines.title")}
              </Modal.Heading>
              <p className="text-sm text-muted-foreground">{t("apply.guidelines.subtitle")}</p>
            </Modal.Header>
            <Modal.Body className="space-y-4">
              {GUIDELINES.map(({ Icon, titleKey, bodyKey }) => (
                <div key={titleKey} className="flex gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-primary">
                    <Icon size={20} aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="font-nunito text-base font-semibold text-card-foreground">{t(titleKey)}</p>
                    <p className="text-sm text-muted-foreground">{t(bodyKey)}</p>
                  </div>
                </div>
              ))}
            </Modal.Body>
            <Modal.Footer>
              <Button fullWidth onPress={() => onOpenChange(false)}>
                {t("apply.guidelines.confirm")}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
