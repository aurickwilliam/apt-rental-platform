import { Breadcrumbs, Chip } from "@heroui/react";
import { motion } from "framer-motion";
import { Cookie } from "lucide-react";
import { fadeUp } from "../data/animations";

export default function CookiesHero() {
  return (
    <section className="px-4 py-9 md:px-12 border-b border-default-200">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="mb-4"
        >
          <Breadcrumbs className="text-default-500 text-sm">
            <Breadcrumbs.Item href="/">Home</Breadcrumbs.Item>
            <Breadcrumbs.Item>Cookie Policy</Breadcrumbs.Item>
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
          <Chip variant="soft" color="default" size="sm">
            <span className="flex items-center gap-1 text-xs font-poppinsSemiBold uppercase tracking-widest">
              <Cookie size={12} />
              Legal
            </span>
          </Chip>
        </motion.div>

        <motion.h1
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.2 }}
          className="text-4xl md:text-5xl font-inter font-semibold leading-tight tracking-tight mb-4"
        >
          Cookie{" "}
          <em className="text-primary not-italic font-inter font-semibold">
            Policy
          </em>
        </motion.h1>

        <motion.p
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.3 }}
          className="text-base text-default-700 max-w-xl leading-relaxed mb-6"
        >
          This Cookie Policy explains how APT uses cookies and similar
          technologies to improve your experience on our website and mobile
          application.
        </motion.p>

        {/* Meta row */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.4 }}
          className="flex flex-wrap items-center gap-6"
        >
          <span className="text-sm text-default-500">Last updated: January 15, 2026</span>
          <span className="text-sm text-default-500">Effective in the Philippines</span>
          <span className="text-sm text-default-500">Version 1.0</span>
        </motion.div>
      </div>
    </section>
  );
}