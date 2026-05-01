"use client";

import { MapPin } from "lucide-react";
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
  visible: { transition: { staggerChildren: 0.15 } },
};

export default function LocationSection() {
  return (
    <motion.section
      variants={stagger}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
    >
      <motion.div variants={fadeUp}>
        <p className="text-xs font-poppinsSemiBold uppercase tracking-widest text-primary mb-2">
          Location
        </p>
        <h2 className="text-2xl font-poppins tracking-tight mb-1">
          Where we <em className="text-primary not-italic">work</em>
        </h2>
        <p className="text-sm text-default-700 mb-5">
          We're based in Caloocan and work remotely across the CAMANAVA.
        </p>
      </motion.div>

      {/* Location Card */}
      <motion.div
        variants={fadeUp}
        className="flex items-start gap-4 p-5 bg-primary/5 border border-primary/20 rounded-2xl mb-6"
      >
        <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <MapPin size={20} className="text-primary" />
        </div>
        <div>
          <p className="text-xs font-poppinsSemiBold uppercase tracking-widest text-primary mb-1">
            Office Address
          </p>
          <p className="text-sm font-poppinsMedium">
            109 Samson Road corner Caimito Road, Caloocan, Philippines
          </p>
          <p className="text-xs text-default-700 mt-1">
            Serving the CAMANAVA area — Caloocan, Malabon, Navotas, and
            Valenzuela
          </p>
        </div>
      </motion.div>

      {/* Google Maps Embed */}
      <motion.div
        variants={fadeUp}
        className="w-full rounded-2xl overflow-hidden border border-default-200 h-72"
      >
        <iframe
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3859.4520173016405!2d120.98399997499738!3d14.749845585895315!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3397b1728ef3bec3%3A0x83c5359e2c2c2c2c!2s109%20Samson%20Rd%2C%20Caloocan%2C%20Metro%20Manila!5e0!3m2!1sen!2sph!4v1234567890"
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </motion.div>
    </motion.section>
  );
}
