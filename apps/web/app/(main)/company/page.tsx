"use client";
import { Breadcrumbs, Card, Chip, Separator } from "@heroui/react";
import { motion } from "framer-motion";
import { Building2, CheckCircle2, ShieldCheck, Globe2 } from "lucide-react";

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
  visible: { transition: { staggerChildren: 0.08 } },
};

const stats = [
  { value: "500+", label: "Verified listings" },
  { value: "1,200+", label: "Renters matched" },
  { value: "98%", label: "Satisfaction rate" },
  { value: "2024", label: "Year founded" },
];

// Reframed from "Mission" to differentiators — About page already owns
// mission/vision, so this section earns its place by answering
// "why trust APT" instead of "why does APT exist".
const differentiators = [
  {
    icon: CheckCircle2,
    title: "Verified first",
    desc: "Every listing is manually reviewed before going live. No scams, no fake photos, no surprises.",
  },
  {
    icon: ShieldCheck,
    title: "Safe payments",
    desc: "Rent is processed through encrypted gateways with full records and automatic receipts.",
  },
  {
    icon: Globe2,
    title: "Built for PH",
    desc: "Designed specifically for the Philippine market with local payment methods and local support.",
  },
];

const timeline = [
  {
    year: "Early 2024",
    title: "The idea",
    desc: "Frustrated by the rental process in Metro Manila, our founders started building APT as a university capstone project.",
  },
  {
    year: "Mid 2024",
    title: "First listings go live",
    desc: "The platform launched with 50 verified listings across Caloocan, Quezon City, and Manila.",
  },
  {
    year: "Late 2024",
    title: "Live & Pay launched",
    desc: "Online rent payment, messaging tools, and a mobile-first dashboard for both tenants and owners.",
  },
  {
    year: "2026",
    title: "500+ listings and growing",
    desc: "APT now serves renters and owners across NCR with plans to expand to Cebu and Davao.",
  },
];

export default function CompanyPage() {
  return (
    <div className="min-h-screen font-poppins">
      {/* ── Hero ── */}
      <section className="px-4 py-9 md:px-12 border-b border-default-200">
        <div className="max-w-7xl mx-auto">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="mb-4"
          >
            <Breadcrumbs className="text-default-500 text-sm">
              <Breadcrumbs.Item href="/">Home</Breadcrumbs.Item>
              <Breadcrumbs.Item>Company</Breadcrumbs.Item>
            </Breadcrumbs>
          </motion.div>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.1 }}
            className="mb-5"
          >
            <Chip variant="soft" color="default" size="sm">
              <span className="flex items-center gap-1 text-xs font-poppinsSemiBold uppercase tracking-widest">
                <Building2 size={12} />
                Who We Are
              </span>
            </Chip>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.2 }}
            className="text-4xl md:text-5xl font-inter font-semibold leading-tight tracking-tight mb-4 max-w-xl"
          >
            The{" "}
            <em className="text-primary not-italic font-inter font-semibold">
              company
            </em>{" "}
            behind APT
          </motion.h1>

          <motion.p
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.3 }}
            className="text-base text-default-700 max-w-xl leading-relaxed"
          >
            We&apos;re on a mission to make renting in the Philippines
            simpler, safer, and more transparent — for renters and owners
            alike.
          </motion.p>
        </div>
      </section>

      {/* ── Content ── */}
      <div className="max-w-7xl mx-auto px-4 md:px-12 py-14">
        {/* Stats */}
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-14"
        >
          {stats.map((stat) => (
            <motion.div key={stat.label} variants={fadeUp}>
              <Card className="bg-surface border border-default-200 hover:border-primary transition-all duration-200 shadow-none p-4">
                <p className="text-xl font-poppinsSemiBold text-primary">
                  {stat.value}
                </p>
                <p className="text-xs text-default-700">{stat.label}</p>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* What sets us apart (was "Mission") */}
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="mb-14"
        >
          <p className="text-xs font-poppinsSemiBold uppercase tracking-widest text-primary mb-2">
            Why APT
          </p>
          <h2 className="text-2xl font-inter font-semibold tracking-tight mb-1">
            What sets us{" "}
            <em className="text-primary not-italic font-inter font-semibold">
              apart
            </em>
          </h2>
          <p className="text-sm text-default-700 mb-7 max-w-xl leading-relaxed">
            The details that make renting through APT different — for
            renters and owners alike.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {differentiators.map((item) => (
              <motion.div key={item.title} variants={fadeUp}>
                <Card className="bg-surface border border-default-200 hover:border-primary transition-all duration-200 shadow-none h-full p-6">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <item.icon size={18} className="text-primary" />
                  </div>
                  <h3 className="text-sm font-poppinsSemiBold mb-1.5">
                    {item.title}
                  </h3>
                  <p className="text-xs text-default-700 leading-relaxed">
                    {item.desc}
                  </p>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <Separator className="mb-14" />

        {/* Story / timeline */}
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
        >
          <p className="text-xs font-poppinsSemiBold uppercase tracking-widest text-primary mb-2">
            Story
          </p>
          <h2 className="text-2xl font-inter font-semibold tracking-tight mb-1">
            From thesis to{" "}
            <em className="text-primary not-italic font-inter font-semibold">
              real platform
            </em>
          </h2>
          <p className="text-sm text-default-700 mb-9 max-w-xl leading-relaxed">
            How APT went from a school project to helping real Filipino
            renters and owners.
          </p>

          <div className="relative pl-9">
            <div className="absolute left-[9px] top-2 bottom-2 w-px bg-default-200" />
            {timeline.map((item, i) => (
              <motion.div
                key={item.year}
                variants={fadeUp}
                className={`relative ${i === timeline.length - 1 ? "" : "mb-8"}`}
              >
                <span className="absolute -left-9 top-0.5 w-[18px] h-[18px] rounded-full bg-primary/10 border-2 border-primary" />
                <p className="text-[11px] font-poppinsSemiBold uppercase tracking-widest text-primary mb-1">
                  {item.year}
                </p>
                <h3 className="text-sm font-poppinsSemiBold mb-1">
                  {item.title}
                </h3>
                <p className="text-sm text-default-700 leading-relaxed">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}