"use client";

import { Breadcrumbs, Chip } from "@heroui/react";
import { motion } from "framer-motion";
import { Wrench } from "lucide-react";
import PropertyContextCard from "./components/PropertyContextCard";
import MaintenanceForm from "./components/MaintenanceForm";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" as const },
  },
};

export default function MaintenanceRequestPage() {
  return (
    <div className="min-h-screen font-poppins">
      {/* Header */}
      <section className="px-4 py-9 md:px-12 border-b border-default-200">
        <div className="max-w-3xl mx-auto">
          <motion.div variants={fadeUp} initial="hidden" animate="visible" className="mb-4">
            <Breadcrumbs className="text-default-500 text-sm">
              <Breadcrumbs.Item href="/">Home</Breadcrumbs.Item>
              <Breadcrumbs.Item href="/tenant/properties">My Property</Breadcrumbs.Item>
              <Breadcrumbs.Item>Request Maintenance</Breadcrumbs.Item>
            </Breadcrumbs>
          </motion.div>

          <motion.div variants={fadeUp} initial="hidden" animate="visible" transition={{ delay: 0.1 }} className="mb-5">
            <Chip variant="soft" color="default" size="sm">
              <span className="flex items-center gap-1 text-xs font-poppinsSemiBold uppercase tracking-widest">
                <Wrench size={12} />
                Maintenance
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
            Request{" "}
            <em className="text-primary not-italic font-inter font-semibold">Maintenance</em>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.3 }}
            className="text-base text-default-700 max-w-xl leading-relaxed"
          >
            Let your landlord know about an issue with your unit. We'll notify
            them right away and keep you posted on the status.
          </motion.p>
        </div>
      </section>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 md:px-12 py-14">
        <PropertyContextCard propertyName="123 Rizal St., Unit 4B" landlordName="N/A" />
        <MaintenanceForm />
      </div>
    </div>
  );
}