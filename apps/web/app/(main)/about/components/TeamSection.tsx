"use client";

import Image from "next/image";
import { Card, CardBody } from "@heroui/react";
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

// Separate component so each card has its own state (basically to avoid all cards expanding at once when "Read more" is clicked)
function MemberCard({ member }: { member: (typeof teamMembers)[0] }) {
  const [expanded, setExpanded] = useState(false);
  const [isTruncated, setIsTruncated] = useState(false);
  const bioRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const el = bioRef.current;
    if (el) {
      setIsTruncated(el.scrollHeight > el.clientHeight);
    }
  }, []);

  return (
    <Card
      className="border border-default-200 hover:-translate-y-1 hover:border-primary hover:shadow-lg transition-all duration-300 h-full"
      shadow="none"
    >
      <CardBody className="p-0 flex flex-col h-full">
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
        <div className="p-5 flex flex-col flex-1 overflow-hidden">
          <p className="font-poppinsSemiBold text-sm">{member.name}</p>
          <p className="text-xs text-primary font-poppinsMedium mt-0.5 mb-2">
            {member.role}
          </p>

          <div className="relative mb-1">
            <p
              ref={bioRef}
              className={`text-xs text-default-700 leading-relaxed ${!expanded ? "line-clamp-3" : ""}`}
            >
              {member.bio}
            </p>
          </div>

          {isTruncated && !expanded && (
            <span
              onClick={() => setExpanded(true)}
              className="text-xs text-primary cursor-pointer hover:underline -mt-1 mb-3 block"
            >
              Read more
            </span>
          )}

          {expanded && (
            <button
              onClick={() => setExpanded(false)}
              className="text-xs text-primary mt-1 mb-3 text-left hover:underline"
            >
              Show less
            </button>
          )}
          {/* Social Links */}
          {(member.github || member.linkedin) && (
            <div className="flex items-center gap-2 mt-auto">
              {member.github && (
                <a
                  href={member.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-7 h-7 rounded-lg bg-default-200 hover:bg-primary hover:text-white flex items-center justify-center text-default-600 transition-colors duration-200"
                >
                  <IoLogoGithub size={14} />
                </a>
              )}
              {member.linkedin && (
                <a
                  href={member.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-7 h-7 rounded-lg bg-default-200 hover:bg-primary hover:text-white flex items-center justify-center text-default-600 transition-colors duration-200"
                >
                  <IoLogoLinkedin size={14} />
                </a>
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
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-12 items-stretch"
      >
        {teamMembers.map((member) => (
          <motion.div key={member.name} variants={fadeUp} className="h-full">
            <MemberCard member={member} />
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
