"use client";

import { Button, Card, CardBody, Avatar, Chip } from "@heroui/react";
import {
  Building2,
  ArrowRight,
  CheckCircle2,
  Star,
} from "lucide-react";
import FeaturesSection from "././components/FeaturesSection";
import { challenges, steps, testimonials } from "./components/Data";

export default function ForOwners() {
  return (
    <div className="min-h-screen">

      {/* ── 1. HERO ── */}
      <section className="relative px-4 py-24 md:px-12 bg-primary overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-white/[0.07] translate-x-1/2 -translate-y-1/3" />
          <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full bg-white/[0.04] -translate-x-1/2 translate-y-1/2" />
        </div>
        <div className="max-w-7xl mx-auto relative z-10">
            <Chip
            startContent={<Building2 size={11} />}
            variant="flat"
            color="primary"
            size="sm"
            classNames={{
              base: "bg-white/15 border border-white/20 mb-8",
              content:
                "text-white text-[11px] font-semibold tracking-widest uppercase",
            }}
          >
            For Rental Owners
          </Chip>
          <div className="md:grid md:grid-cols-5 md:gap-16 md:items-end">
            <div className="md:col-span-3 mb-10 md:mb-0">
              <h1 className="text-4xl md:text-[56px] font-bold text-white leading-[1.1] tracking-tight mb-6">
                You built this rental.{" "}
                <span className="text-white/45">
                  You shouldn't have to chase it every month.
                </span>
              </h1>
              <p className="text-base md:text-[15px] text-white/60 leading-relaxed max-w-md mb-8">
                APT handles rent collection, tenant screening, maintenance, and
                communication — so owning a rental feels less like a second job.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  className="bg-white text-primary font-semibold"
                  radius="full"
                  size="lg"
                  endContent={<ArrowRight size={16} />}
                  href="/sign-up"
                  as="a"
                >
                  Get Started for Free
                </Button>
                <Button
                  variant="bordered"
                  className="border-white/25 text-white hover:bg-white/10"
                  radius="full"
                  size="lg"
                  href="/browse"
                  as="a"
                >
                  Browse Listings
                </Button>
              </div>
            </div>
            <div className="md:col-span-2 flex flex-col divide-y divide-white/10">
              {[
                { label: "Rent collection", detail: "GCash, Maya, bank transfer" },
                { label: "Tenant verification", detail: "ID + selfie, admin-reviewed" },
                { label: "Digital contracts", detail: "Sign and store online" },
                { label: "Maintenance tracking", detail: "From report to resolution" },
              ].map((item) => (
                <div key={item.label} className="py-4 first:pt-0 last:pb-0">
                  <p className="text-sm font-semibold text-white">{item.label}</p>
                  <p className="text-xs text-white/50 mt-0.5">{item.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. CHALLENGES ── */}
      <section className="px-4 py-20 md:px-12 border-b border-default-200">
        <div className="max-w-7xl mx-auto">
          <div className="md:grid md:grid-cols-2 md:gap-20 md:items-start">
            <div className="space-y-0 mb-10 md:mb-0">
              {challenges.map((item, index) => (
                <div key={index} className="py-6 border-b border-default-100 last:border-0">
                  <p className="text-sm text-default-400 leading-relaxed mb-2 italic">
                    &ldquo;{item.pain}&rdquo;
                  </p>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 size={14} className="text-primary mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-default-700 leading-relaxed font-medium">
                      {item.relief}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="md:sticky md:top-28">
              <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-4">
                We get it
              </p>
              <h2 className="text-3xl md:text-4xl font-bold leading-snug mb-4">
                Owning a rental is rewarding.{" "}
                <span className="text-default-400">
                  Managing one shouldn't be exhausting.
                </span>
              </h2>
              <p className="text-default-500 text-sm leading-relaxed mb-6">
                You invested in property to build something — not to spend evenings
                chasing payments. APT takes that load off.
              </p>
              <Button
                color="primary"
                variant="flat"
                radius="full"
                size="md"
                endContent={<ArrowRight size={14} />}
                href="/sign-up"
                as="a"
              >
                Start managing smarter
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. STATS ── */}
      <section className="px-4 py-16 md:px-12 bg-default-50 border-b border-default-200">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-0 divide-x divide-default-200">
            {[
              { value: "CAMANAVA", sub: "Coverage area" },
              { value: "Verified", sub: "Every tenant profile" },
              { value: "Digital", sub: "Contracts & signing" },
              { value: "24/7", sub: "In-app communication" },
            ].map((s) => (
              <div key={s.sub} className="px-8 py-6 first:pl-0 last:pr-0">
                <p className="text-2xl md:text-3xl font-bold text-default-900 mb-1">{s.value}</p>
                <p className="text-xs text-default-400">{s.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. FEATURES ── */}
      <FeaturesSection />

      {/* ── 5. HOW IT WORKS ── */}
      <section className="px-4 py-20 md:px-12 bg-default-50 border-b border-default-200">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-14">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">
                Getting started
              </p>
              <h2 className="text-3xl font-bold">Up and running in an afternoon.</h2>
            </div>
            <p className="text-default-400 text-sm max-w-xs leading-relaxed">
              No technical setup. Four steps and you're collecting rent online.
            </p>
          </div>
          <div className="relative">
            <div className="hidden md:block absolute top-[18px] left-[18px] right-[18px] h-px bg-default-200 z-0" />
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10">
              {steps.map((step) => (
                <div key={step.number} className="relative z-10">
                  <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center mb-4">
                    <span className="text-white font-bold text-xs">{step.number}</span>
                  </div>
                  <h3 className="text-sm font-semibold mb-1.5">{step.title}</h3>
                  <p className="text-xs text-default-400 leading-relaxed">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── 6. TESTIMONIALS ── */}
      <section className="px-4 py-20 md:px-12 border-b border-default-200">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-12">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">
                From owners like you
              </p>
              <h2 className="text-3xl font-bold">They made the switch.</h2>
            </div>
            <p className="text-default-400 text-sm max-w-xs leading-relaxed">
              Real rental owners in CAMANAVA. Not case studies.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {testimonials.map((t) => (
              <Card key={t.name} shadow="none" classNames={{ base: "border border-default-200 bg-white" }}>
                <CardBody className="p-6 flex flex-col justify-between gap-5">
                  <div>
                    <div className="flex gap-0.5 mb-4">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          size={11}
                          fill={i < t.rating ? "currentColor" : "none"}
                          className={i < t.rating ? "text-warning" : "text-default-200"}
                        />
                      ))}
                    </div>
                    <p className="text-sm text-default-600 leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
                  </div>
                  <div className="flex items-center gap-3 pt-4 border-t border-default-100">
                    <Avatar
                      name={t.initials}
                      color="primary"
                      size="sm"
                      classNames={{ base: "flex-shrink-0 text-xs" }}
                    />
                    <div>
                      <p className="text-xs font-semibold text-default-700">{t.name}</p>
                      <p className="text-xs text-default-400">{t.role}</p>
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── 7. CTA ── */}
      <section className="px-4 py-24 md:px-12 bg-primary">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 leading-snug">
            Your rental should work for you — not the other way around.
          </h2>
          <p className="text-white/65 text-base mb-10 leading-relaxed">
            Free to start. No technical setup. No credit card.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              className="bg-white text-primary font-semibold"
              radius="full"
              size="lg"
              endContent={<ArrowRight size={16} />}
              href="/sign-up"
              as="a"
            >
              Create Your Owner Account
            </Button>
            <Button
              variant="bordered"
              className="border-white/30 text-white"
              radius="full"
              size="lg"
              href="/contact"
              as="a"
            >
              Talk to the Team
            </Button>
          </div>
          <p className="text-white/40 text-xs mt-5">
            Free for up to 2 properties. No credit card needed.
          </p>
        </div>
      </section>

    </div>
  );
}