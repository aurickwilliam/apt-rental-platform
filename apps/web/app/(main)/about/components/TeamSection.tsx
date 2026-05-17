"use client";

import Image from "next/image";
import { Button, Card, CardBody } from "@heroui/react";
import { IoLogoGithub, IoLogoLinkedin } from "react-icons/io5";
import { motion } from "framer-motion";
import { teamMembers } from "../data/AboutData";
import { useState, useRef, useEffect } from "react";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" as const },
  },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15 } },
};

function MemberCard({ member }: { member: (typeof teamMembers)[0] }) {
  const [expanded, setExpanded] = useState(false);
  const [isTruncated, setIsTruncated] = useState(false);
  const bioRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const el = bioRef.current;
    if (!el) return;

    const timeout = setTimeout(() => {
      el.classList.remove("line-clamp-3");
      const fullHeight = el.scrollHeight;
      el.classList.add("line-clamp-3");
      const clampedHeight = el.clientHeight;
      setIsTruncated(fullHeight > clampedHeight);
    }, 100);

    return () => clearTimeout(timeout);
  }, []);

  return (
    <Card
      shadow="none"
      classNames={{
        base: "border border-default-200 hover:-translate-y-1 hover:border-primary hover:shadow-lg transition-all duration-300",
      }}
    >
      <CardBody className="p-0 flex flex-col">
        {/* Photo */}
        <div
          className="w-full rounded-t-xl overflow-hidden flex items-end justify-center"
          style={{ height: "275px" }}
        >
          <div className={`relative w-full ${member.imageHeight}`}>
            <Image
              src={member.image}
              alt={member.name}
              fill
              className="object-contain object-bottom"
            />
          </div>
        </div>

        {/* Info */}
        <div className="p-5 flex flex-col">
          <p className="font-poppinsSemiBold text-sm">{member.name}</p>
          <p className="text-xs text-primary font-poppinsMedium mt-0.5 mb-2">
            {member.role}
          </p>

          <p
            ref={bioRef}
            className={`text-xs text-default-700 leading-relaxed mb-1 min-h-[54px] ${
              !expanded ? "line-clamp-3" : ""
            }`}
          >
            {member.bio}
          </p>

          {/* Read more toggle — HeroUI Button */}
          <div className="min-h-[28px]">
            {isTruncated && (
              <Button
                variant="light"
                color="primary"
                size="sm"
                className="h-auto min-w-0 px-0 py-1 text-xs mb-1"
                onPress={() => setExpanded(!expanded)}
              >
                {expanded ? "Show less" : "Read more"}
              </Button>
            )}
          </div>

          {/* Social links — HeroUI isIconOnly Buttons */}
          {(member.github || member.linkedin) && (
            <div className="flex items-center gap-2">
              {member.github && (
                <Button
                  as="a"
                  href={member.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  isIconOnly
                  size="sm"
                  variant="flat"
                  color="default"
                  aria-label="GitHub profile"
                  className="w-7 h-7 min-w-0 rounded-lg bg-default-100 hover:bg-primary hover:text-white text-default-600 transition-colors duration-200"
                >
                  <IoLogoGithub size={14} />
                </Button>
              )}
              {member.linkedin && (
                <Button
                  as="a"
                  href={member.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  isIconOnly
                  size="sm"
                  variant="flat"
                  color="default"
                  aria-label="LinkedIn profile"
                  className="w-7 h-7 min-w-0 rounded-lg bg-default-100 hover:bg-primary hover:text-white text-default-600 transition-colors duration-200"
                >
                  <IoLogoLinkedin size={14} />
                </Button>
              )}
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
}

export default function TeamSection() {
  return (
    <section>
      <motion.div
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
      >
        <p className="text-xs font-poppinsSemiBold uppercase tracking-widest text-primary mb-2">
          Team
        </p>
        <h2 className="text-2xl font-poppins tracking-tight mb-1">
          The <em className="text-primary not-italic">people</em> who built this
        </h2>
        <p className="text-sm text-default-700 mb-8">
          Mga estudyante ni Enchong Dee.
        </p>
      </motion.div>

      <motion.div
        variants={stagger}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-12 items-start"
      >
        {teamMembers.map((member) => (
          <motion.div key={member.name} variants={fadeUp}>
            <MemberCard member={member} />
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
