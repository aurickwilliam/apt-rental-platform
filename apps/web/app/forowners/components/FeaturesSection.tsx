"use client";

import { useState } from "react";
import { Button, Card, Separator } from "@heroui/react";
import { CheckCircle2, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { features } from "./Data";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" as const },
  },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

export default function FeaturesSection() {
  const [showAll, setShowAll] = useState(false);
  const [expandedFeatures, setExpandedFeatures] = useState<Set<string>>(
    new Set(),
  );

  const visibleFeatures = showAll ? features : features.slice(0, 4);

  const toggleFeature = (key: string) => {
    setExpandedFeatures((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const leftCol = visibleFeatures.filter((_, i) => i % 2 === 0);
  const rightCol = visibleFeatures.filter((_, i) => i % 2 !== 0);

  return (
    <section className="px-4 py-20 md:px-12 bg-default-50 border-b border-default-200">
      <div className="max-w-7xl mx-auto">
        {/* Section header */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          className="max-w-xl mb-12"
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">
            What&apos;s inside APT
          </p>
          <h2 className="text-3xl font-bold tracking-tight mb-3">
            Everything in one place.
          </h2>
          <p className="text-default-400 text-sm max-w-xs leading-relaxed">
            No more switching between apps, chats, and notebooks. APT brings
            your entire rental operation under one roof.
          </p>
        </motion.div>

        {/* Feature cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[leftCol, rightCol].map((col, colIndex) => (
            <motion.div
              key={colIndex}
              variants={stagger}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-40px" }}
              className="flex flex-col gap-4"
            >
              {col.map((feature) => {
                const Icon = feature.icon;
                const isExpanded = expandedFeatures.has(feature.key);

                return (
                  <motion.div key={feature.key} variants={fadeUp}>
                    <Card
                      className={`border transition-all duration-300 cursor-pointer ${
                        isExpanded
                          ? "border-primary shadow-md shadow-primary/10"
                          : "border-default-200 hover:border-primary/40 hover:shadow-sm"
                      }`}
                      onClick={() => toggleFeature(feature.key)}
                    >
                      {/* Icon + Title + Description */}
                      <Card.Header className="p-5 gap-4 flex-row items-start justify-between">
                        <div className="flex items-start gap-4">
                          {/* Icon */}
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors duration-200 ${
                              isExpanded
                                ? "bg-primary text-white"
                                : "bg-primary/10 text-primary"
                            }`}
                          >
                            <Icon size={18} />
                          </div>

                          {/* Title + Description using proper v3 subcomponents */}
                          <div className="flex flex-col gap-1">
                            <Card.Title className="text-sm font-poppinsSemiBold !text-default-900 leading-snug">
                              {feature.title}
                            </Card.Title>
                            <Card.Description className="text-xs !text-grey-500 leading-relaxed">
                              {feature.description}
                            </Card.Description>
                          </div>
                        </div>

                        {/* Chevron toggle */}
                        <div
                          className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 ${
                            isExpanded
                              ? "bg-primary text-white rotate-180"
                              : "bg-default-100 text-default-400"
                          }`}
                        >
                          <ChevronDown size={14} />
                        </div>
                      </Card.Header>

                      {/* Expandable benefits */}
                      <AnimatePresence initial={false}>
                        {isExpanded && (
                          <motion.div
                            key="benefits"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.25, ease: "easeOut" }}
                            className="overflow-hidden"
                          >
                            <Separator />
                            <Card.Content className="p-5">
                              <p className="text-[10px] uppercase tracking-widest font-poppinsSemiBold text-default-400 mb-3">
                                What you get
                              </p>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {feature.benefits.map((benefit: string) => (
                                  <div
                                    key={benefit}
                                    className="flex items-center gap-2 bg-primary/5 rounded-lg px-3 py-2"
                                  >
                                    <CheckCircle2
                                      size={13}
                                      className="text-primary shrink-0"
                                    />
                                    <span className="text-xs text-default-600 font-medium">
                                      {benefit}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </Card.Content>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </Card>
                  </motion.div>
                );
              })}
            </motion.div>
          ))}
        </div>

        {/* Show all toggle */}
        <div className="flex justify-start mt-6">
          <Button
            variant="outline"
            size="sm"
            onPress={() => setShowAll(!showAll)}
            className="gap-1.5"
          >
            <ChevronDown
              size={14}
              className={`transition-transform duration-200 ${showAll ? "rotate-180" : ""}`}
            />
            {showAll ? "Show less" : `See all ${features.length} features`}
          </Button>
        </div>
      </div>
    </section>
  );
}
