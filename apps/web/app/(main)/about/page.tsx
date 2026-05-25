"use client";
import {
  Breadcrumbs,
  BreadcrumbItem,
  Card,
  CardBody,
  Chip,
  Separator,
} from "@heroui/react";
import { motion } from "framer-motion";

import { Users, Target, Eye } from "lucide-react";

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
            <Breadcrumbs size="sm" classNames={{ list: "text-default-500" }}>
              <BreadcrumbItem href="/">Home</BreadcrumbItem>
              <BreadcrumbItem>About Us</BreadcrumbItem>
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
              startContent={<Users size={12} />}
              variant="flat"
              color="primary"
              size="sm"
              classNames={{
                content:
                  "text-xs font-poppinsSemiBold uppercase tracking-widest",
              }}
            >
              About Us
            </Chip>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.2 }}
            className="text-4xl md:text-5xl font-inter font-semibold leading-tight tracking-tight mb-4"
          >
            Meet the people{" "}
            <em className="text-primary not-italic font-inter font-semibold">behind</em> APT
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

          {/* Stats — staggered Cards */}
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            {stats.map((stat) => (
              <motion.div key={stat.label} variants={fadeUp}>
                <Card
                  shadow="none"
                  classNames={{
                    base: "bg-primary/5 border border-primary/10",
                  }}
                >
                  <CardBody className="p-4 gap-0.5">
                    <p className="text-xl font-poppinsSemiBold text-primary">
                      {stat.value}
                    </p>
                    <p className="text-xs text-default-700">{stat.label}</p>
                  </CardBody>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Content ── */}
      <div className="max-w-7xl mx-auto px-4 md:px-12 py-14">
        {/* Mission & Vision */}
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-14"
        >
          {/* Mission */}
          <motion.div variants={fadeUp}>
            <Card
              shadow="none"
              classNames={{
                base: "bg-primary/5 border border-primary/10 h-full",
              }}
            >
              <CardBody className="p-8 gap-0">
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
              </CardBody>
            </Card>
          </motion.div>

          {/* Vision */}
          <motion.div variants={fadeUp}>
            <Card
              shadow="none"
              classNames={{
                base: "bg-primary/5 border border-primary/10 h-full",
              }}
            >
              <CardBody className="p-8 gap-0">
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
              </CardBody>
            </Card>
          </motion.div>
        </motion.div>

        <Separator className="mb-14" />

        <TeamSection />

        <Separator className="my-10" />

        <LocationSection />
      </div>
    </div>
  );
}
