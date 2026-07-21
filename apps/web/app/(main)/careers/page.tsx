"use client";

import {
  Breadcrumbs,
  Card,
  Chip,
  Separator,
  Button,
  Alert,
} from "@heroui/react";
import { Briefcase, Zap, Users, TrendingUp, Target } from "lucide-react";
import { motion } from "framer-motion";

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
  visible: { transition: { staggerChildren: 0.1 } },
};

const openRoles = [
  {
    title: "Frontend Developer",
    tags: [
      { label: "Next.js", color: "default" },
      { label: "Remote", color: "default" },
      { label: "Full-time", color: "success" },
    ],
  },
  {
    title: "UI / UX Designer",
    tags: [
      { label: "Figma", color: "default" },
      { label: "Caloocan", color: "default" },
      { label: "Full-time", color: "success" },
    ],
  },
  {
    title: "Property Verifier",
    tags: [
      { label: "Field work", color: "default" },
      { label: "NCR", color: "default" },
      { label: "Part-time", color: "warning" },
    ],
  },
  {
    title: "Backend Engineer",
    tags: [
      { label: "Supabase", color: "default" },
      { label: "Remote", color: "default" },
      { label: "Full-time", color: "success" },
    ],
  },
];

const cultureCards = [
  {
    icon: <Zap size={20} className="text-primary" />,
    title: "Move fast",
    description:
      "Small team means your ideas ship in days, not months. You'll see your work matter immediately.",
  },
  {
    icon: <Users size={20} className="text-primary" />,
    title: "Great team",
    description:
      "Work alongside passionate developers and designers who genuinely care about the product.",
  },
  {
    icon: <TrendingUp size={20} className="text-primary" />,
    title: "Real impact",
    description:
      "Every feature you build helps real Filipino renters find safer, better homes.",
  },
];

export default function CareersPage() {
  return (
    <div className="min-h-screen font-poppins">
      {/* ── Hero ── */}
      <section className="px-4 py-9 md:px-12 border-b border-default-200">
        <div className="max-w-7xl mx-auto">
          {/* Breadcrumb */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="mb-4"
          >
            <Breadcrumbs className="text-default-500">
              <Breadcrumbs.Item href="/">Home</Breadcrumbs.Item>
              <Breadcrumbs.Item>Careers</Breadcrumbs.Item>
            </Breadcrumbs>
          </motion.div>

          {/* Eyebrow chip */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.1 }}
            className="mb-5"
          >
            <Chip
              variant="secondary"
              color="accent"
              size="sm"
              className="uppercase tracking-widest text-xs font-poppinsSemiBold"
            >
              <Chip.Label className="flex items-center gap-1.5">
                <Briefcase size={11} />
                Careers
              </Chip.Label>
            </Chip>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.2 }}
            className="text-4xl md:text-5xl font-poppins leading-tight tracking-tight mb-4"
          >
            Join the{" "}
            <em className="text-primary not-italic font-poppins">APT</em> team
          </motion.h1>

          <motion.p
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.3 }}
            className="text-base text-default-700 max-w-xl leading-relaxed"
          >
            Help us reshape how Filipinos find, rent, and manage their homes.
            We&apos;re a small team with big ambitions.
          </motion.p>
        </div>
      </section>

      {/* ── Content ── */}
      <div className="max-w-7xl mx-auto px-4 md:px-12 py-14">
        {/* Alert */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="mb-10"
        >
          <Alert color="default">
            <div className="flex items-start gap-3">
              <Target size={16} className="text-primary mt-1" />
              <div>
                We&apos;re currently hiring for 4 open roles. All positions are
                open to fresh graduates.
              </div>
            </div>
          </Alert>
        </motion.div>

        {/* Open Roles */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="mb-2"
        >
          <p className="text-xs font-poppinsSemiBold uppercase tracking-widest text-primary mb-1">
            Open Roles
          </p>
          <h2 className="text-2xl font-poppins tracking-tight mb-1">
            Open <em className="text-primary not-italic">positions</em>
          </h2>
          <p className="text-sm text-default-700 mb-6">
            We value curiosity, ownership, and passion for building things that
            help people.
          </p>
        </motion.div>

        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="flex flex-col gap-3 mb-14"
        >
          {openRoles.map((role) => (
            <motion.div key={role.title} variants={fadeUp}>
              <Card className="bg-surface border border-default-200 hover:bg-primary/15 hover:border-primary transition-all duration-200">
                <Card.Content className="p-5 flex-row items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-poppinsSemiBold mb-2">
                      {role.title}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {role.tags.map((tag) => (
                        <Chip
                          key={tag.label}
                          size="sm"
                          color="default"
                          variant="soft"
                        >
                          {tag.label}
                        </Chip>
                      ))}
                    </div>
                  </div>
                  <Button size="sm" className="font-poppinsSemiBold shrink-0">
                    Apply now
                  </Button>
                </Card.Content>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        <Separator className="mb-14" />

        {/* Culture */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="mb-6"
        >
          <p className="text-xs font-poppinsSemiBold uppercase tracking-widest text-primary mb-1">
            Culture
          </p>
          <h2 className="text-2xl font-poppins tracking-tight mb-1">
            Why <em className="text-primary not-italic">work</em> with us?
          </h2>
          <p className="text-sm text-default-700">
            We&apos;re small enough to move fast, big enough to matter.
          </p>
        </motion.div>

        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          {cultureCards.map((card) => (
            <motion.div key={card.title} variants={fadeUp}>
              <Card className="bg-surface border border-default-200 hover:border-primary transition-all duration-200 h-full">
                <Card.Content className="p-6">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    {card.icon}
                  </div>
                  <p className="text-sm font-poppinsSemiBold mb-2">
                    {card.title}
                  </p>
                  <p className="text-sm text-default-700 leading-relaxed">
                    {card.description}
                  </p>
                </Card.Content>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
