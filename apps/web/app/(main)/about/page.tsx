"use client";

import { Divider } from "@heroui/react";
import { Users, Target, Eye } from "lucide-react";
import { motion } from "framer-motion";
import { stats } from "./data/AboutData";
import TeamSection from "./components/TeamSection";
import LocationSection from "./components/LocationSection";

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

export default function AboutUs() {
  return (
    <div className="min-h-screen font-poppins">
      {/* Hero Section */}
      <section className="px-4 py-9 md:px-12 border-b border-default-200">
        <div className="max-w-7xl mx-auto">
          {/* Breadcrumb */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="flex items-center gap-2 text-xs text-default-700 mb-4"
          >
            <a href="/" className="hover:text-primary transition-colors">
              Home
            </a>
            <span>/</span>
            <span>About Us</span>
          </motion.div>

          {/* Eyebrow */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-poppinsSemiBold uppercase tracking-widest px-3 py-1.5 rounded-full mb-5"
          >
            <Users size={12} />
            About Us
          </motion.div>

          <motion.h1
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.2 }}
            className="text-4xl md:text-5xl font-poppins leading-tight tracking-tight mb-4"
          >
            Meet the people{" "}
            <em className="text-primary not-italic font-poppins">behind</em> APT
          </motion.h1>

          <motion.p
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.3 }}
            className="text-base text-default-700 max-w-xl leading-relaxed mb-10"
          >
            A team of students developing and designing a system focused on
            improving the renting process in the Philippines.
          </motion.p>

          {/* Stats — staggered */}
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            {stats.map((stat) => (
              <motion.div
                key={stat.label}
                variants={fadeUp}
                className="bg-primary/5 border border-primary/10 rounded-2xl p-4"
              >
                <p className="text-xl font-poppinsSemiBold text-primary">
                  {stat.value}
                </p>
                <p className="text-xs text-default-700 mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 md:px-12 py-14">
        {/* Mission & Vision */}
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-14"
        >
          <motion.div
            variants={fadeUp}
            className="bg-primary/5 border border-primary/10 rounded-2xl p-8"
          >
            <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
              <Target size={20} className="text-primary" />
            </div>
            <p className="text-xs font-poppinsSemiBold uppercase tracking-widest text-primary mb-2">
              Mission
            </p>
            <h3 className="text-xl font-poppinsSemiBold mb-3">
              What we are here to do
            </h3>
            <p className="text-sm text-default-700 leading-relaxed">
              To make renting in the Philippines simpler, safer, and more
              transparent, connecting tenants and property owners through a
              trusted digital platform built for the Filipino community.
            </p>
          </motion.div>

          <motion.div
            variants={fadeUp}
            className="bg-primary/5 border border-primary/10 rounded-2xl p-8"
          >
            <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
              <Eye size={20} className="text-primary" />
            </div>
            <p className="text-xs font-poppinsSemiBold uppercase tracking-widest text-primary mb-2">
              Vision
            </p>
            <h3 className="text-xl font-poppinsSemiBold mb-3">
              Where we are headed
            </h3>
            <p className="text-sm text-default-700 leading-relaxed">
              To become the most trusted rental platform in the Philippines,
              where every Filipino can find a home they are proud of with
              confidence, ease, and peace of mind.
            </p>
          </motion.div>
        </motion.div>

        <Divider className="mb-14" />
        <TeamSection />
        <Divider className="my-10" />
        <LocationSection />
      </div>
    </div>
  );
}
