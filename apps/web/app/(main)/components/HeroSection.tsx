"use client";

import { Image } from "@heroui/react";
import NextImage from "next/image";
import StartBrowsingBtn from "./StartBrowsingBtn";
import { IconShieldCheck, IconBuildingSkyscraper, IconUsers } from "@tabler/icons-react";

const stats = [
  { icon: <IconBuildingSkyscraper size={18} />, value: "2,400+", label: "Active Listings" },
  { icon: <IconUsers size={18} />, value: "800+", label: "Verified Landlords" },
  { icon: <IconShieldCheck size={18} />, label: "Secure Payments", value: "100%" },
];

export default function HeroSection() {
  return (
    <section className="relative w-full h-[800px] flex flex-row items-center rounded-2xl mb-20 overflow-hidden">
      <div className="absolute inset-0 w-1/2 pointer-events-none z-0" />

      {/* Text Side */}
      <div className="relative h-full flex flex-col justify-center gap-6 p-8 z-10 w-full md:w-1/2">
        <div className="flex flex-col gap-3">
          <h1 className="text-4xl md:text-5xl font-poppins font-bold text-primary leading-tight">
            Find, Rent, and Manage.{" "}
            <span className="text-foreground">All in one place.</span>
          </h1>

          <p className="text-base text-default-500 font-medium max-w-md leading-relaxed">
            From high-res tours to automated rent payments, we&lsquo;ve simplified
            the entire rental journey — for tenants and landlords alike.
          </p>
        </div>

        <StartBrowsingBtn />

        {/* Stats row */}
        <div className="flex flex-row gap-6 pt-2 border-t border-divider mt-2">
          {stats.map((stat) => (
            <div key={stat.label} className="flex flex-col gap-0.5">
              <span className="text-xl font-poppins font-semibold text-primary">
                {stat.value}
              </span>
              <span className="text-xs text-default-400 font-medium whitespace-nowrap">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Image Side */}
      <div className="relative hidden md:flex w-1/2 h-full items-center justify-center">
        
        <div className="absolute inset-y-0 left-0 w-24 z-10 pointer-events-none" />

        <Image
          as={NextImage}
          src="https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&h=800&fit=crop&auto=format"
          alt="Hero Image"
          width={600}
          height={800}
          className="object-cover w-full h-full rounded-r-2xl"
        />

        {/* Floating verification badge on the image */}
        <div className="absolute bottom-10 left-8 z-20 bg-background/80 backdrop-blur-md border border-divider rounded-xl px-4 py-3 flex items-center gap-3 shadow-lg">
          <div className="w-9 h-9 rounded-full bg-success/10 flex items-center justify-center text-success">
            <IconShieldCheck size={18} />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-foreground">Verified Property</span>
            <span className="text-xs text-default-400">Background-checked landlord</span>
          </div>
        </div>
      </div>

    </section>
  );
}