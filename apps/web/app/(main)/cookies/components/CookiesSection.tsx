import { Alert } from "@heroui/react";
import { motion } from "framer-motion";
import type { Section } from "../data/cookies-sections";
import { fadeUp } from "../data/animations";

type CookiesSectionProps = {
  section: Section;
  isLast: boolean;
  sectionRef: (el: HTMLDivElement | null) => void;
};

export default function CookiesSection({ section, isLast, sectionRef }: CookiesSectionProps) {
  const isWarning = section.callout?.kind === "warning";

  return (
    <div>
      <motion.div
        id={section.id}
        ref={sectionRef}
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        className="scroll-mt-24 mb-13"
      >
        <div className="mb-2 text-xs font-poppinsSemiBold uppercase tracking-widest text-primary">
          {section.num}
        </div>
        <h2 className="mb-4 text-2xl font-inter font-semibold tracking-tight">
          {section.title ? `${section.title} ` : ""}
          <em className="text-primary not-italic font-inter font-semibold">{section.emphasis}</em>
        </h2>

        {section.blocks.map((block, idx) => {
          if (block.type === "paragraph") {
            return (
              <p key={idx} className="mb-3 text-sm text-default-700 leading-relaxed last:mb-0">
                {block.text}
              </p>
            );
          }

          if (block.type === "subheading") {
            return (
              <h3
                key={idx}
                className="mt-5 mb-2 text-sm font-poppinsSemiBold text-foreground first:mt-0"
              >
                {block.text}
              </h3>
            );
          }

          // block.type === "list"
          return (
            <ul key={idx} className="my-3.5 list-none">
              {block.items.map((item, itemIdx) => (
                <li
                  key={itemIdx}
                  className="relative border-b border-default-200 py-2 pl-5 text-sm text-default-700 leading-relaxed last:border-none"
                >
                  <span className="absolute left-0 top-[15px] h-1.5 w-1.5 rounded-full bg-primary opacity-50" />
                  {item}
                </li>
              ))}
            </ul>
          );
        })}

        {section.callout && (
          <Alert color={isWarning ? "warning" : "primary"} className="mt-5">
            <Alert.Content>
              <Alert.Title className="font-poppinsSemiBold text-foreground">
                {section.callout.label}
              </Alert.Title>
              <Alert.Description className="text-foreground/80">
                {section.callout.text}
              </Alert.Description>
            </Alert.Content>
          </Alert>
        )}
      </motion.div>
      {!isLast && <hr className="mb-13 border-t border-default-200" />}
    </div>
  );
}