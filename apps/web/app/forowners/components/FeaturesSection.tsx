"use client";

import { useState } from "react";
import { Button, Card, Separator } from "@heroui/react";
import { CheckCircle2, ChevronDown } from "lucide-react";
import { features } from "./Data";

export default function FeaturesSection() {
  const [showAll, setShowAll] = useState(false);
  const [expandedFeatures, setExpandedFeatures] = useState<Set<string>>(new Set());

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

  return (
    <section className="px-4 py-20 md:px-12 bg-default-50 border-b border-default-200">
      <div className="max-w-7xl mx-auto">
        <div className="max-w-xl mb-12">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">
            What&apos;s inside APT
          </p>
          <h2 className="text-3xl font-bold mb-3">Everything in one place.</h2>
          <p className="text-default-500 text-sm leading-relaxed">
            No more switching between apps, chats, and notebooks. APT brings your
            entire rental operation under one roof.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            visibleFeatures.filter((_, i) => i % 2 === 0),
            visibleFeatures.filter((_, i) => i % 2 !== 0),
          ].map((col, colIndex) => (
            <div key={colIndex} className="flex flex-col gap-4">
              {col.map((feature) => {
                const Icon = feature.icon;
                const isExpanded = expandedFeatures.has(feature.key);

                return (
                  <div
                    key={feature.key}
                    onClick={() => toggleFeature(feature.key)}
                    className="cursor-pointer"
                  >
                    <Card
                      variant="default"
                      className={`border transition-all duration-300 bg-white ${
                        isExpanded
                          ? "border-primary shadow-md shadow-primary/10"
                          : "border-default-200 hover:border-primary/40 hover:shadow-sm"
                      }`}
                    >
                      <Card.Header className="px-6 pt-6 pb-5 flex items-start justify-between gap-4 min-h-[110px]">
                        <div className="flex items-start gap-4">
                          <div
                            className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-colors duration-200 ${
                              isExpanded
                                ? "bg-primary text-white"
                                : "bg-primary/8 text-primary"
                            }`}
                          >
                            <Icon size={19} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <Card.Title className="text-sm font-semibold text-default-900 mb-1 leading-snug">
                              {feature.title}
                            </Card.Title>
                            <Card.Description className="text-xs text-default-400 leading-relaxed">
                              {feature.description}
                            </Card.Description>
                          </div>
                        </div>
                        <div
                          className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 mt-0.5 ${
                            isExpanded
                              ? "bg-primary text-white rotate-180"
                              : "bg-default-100 text-default-400"
                          }`}
                        >
                          <ChevronDown size={14} />
                        </div>
                      </Card.Header>

                      {isExpanded && (
                        <>
                          <Separator className="my-4" />

                          <Card.Content className="px-6 pt-4 pb-5">
                            <p className="text-[10px] uppercase tracking-widest font-semibold text-default-400 mb-3">
                              What you get
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {feature.benefits.map((benefit) => (
                                <div
                                  key={benefit}
                                  className="flex items-center gap-2 bg-primary/5 rounded-lg px-3 py-2"
                                >
                                  <CheckCircle2 size={13} className="text-primary shrink-0" />
                                  <span className="text-xs text-default-600 font-medium">
                                    {benefit}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </Card.Content>
                        </>
                      )}
                    </Card>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        <div className="flex justify-start mt-6">
          <Button
            variant="outline"
            size="sm"
            onPress={() => setShowAll(!showAll)}
          >
            <ChevronDown
              size={15}
              className={`transition-transform duration-200 ${showAll ? "rotate-180" : ""}`}
            />
            {showAll ? "Show less" : `See all ${features.length} features`}
          </Button>
        </div>
      </div>
    </section>
  );
}