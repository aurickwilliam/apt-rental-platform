"use client";

import { Card } from "@heroui/react";
import { Building2 } from "lucide-react";
import { motion } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" as const },
  },
};

type PropertyContextCardProps = {
  propertyName?: string;
  landlordName?: string;
};

export default function PropertyContextCard({
  propertyName = "No property on file",
  landlordName = "N/A",
}: PropertyContextCardProps) {
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
    >
      <Card className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 shadow-sm font-nunito">
        <Card.Content className="p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Building2 size={18} className="text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-nunito font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                {propertyName}
              </p>
              <p className="text-xs text-zinc-500">
                Landlord: <span className="text-zinc-700 dark:text-zinc-300">{landlordName}</span>
              </p>
            </div>
          </div>
        </Card.Content>
      </Card>
    </motion.div>
  );
}