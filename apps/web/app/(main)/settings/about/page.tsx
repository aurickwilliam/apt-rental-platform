"use client";

import Image from "next/image";
import Link from "next/link";
import { Github, Globe, Mail, Facebook, Instagram } from "lucide-react";

import SettingsShell from "../components/SettingsShell";
import SectionTitle from "../components/SectionTitle";
import { teamMembers } from "@/app/(main)/about/data/AboutData";

const APP_VERSION = "1.0.0";

const socials = [
  {
    id: 1,
    label: "Website",
    icon: Globe,
    url: "https://apt.com",
  },
  {
    id: 2,
    label: "Facebook",
    icon: Facebook,
    url: "https://facebook.com/apt",
  },
  {
    id: 3,
    label: "Instagram",
    icon: Instagram,
    url: "https://instagram.com/apt",
  },
  {
    id: 4,
    label: "Email",
    icon: Mail,
    url: "mailto:support@apt.com",
  },
  {
    id: 5,
    label: "GitHub",
    icon: Github,
    url: "https://github.com/apt",
  },
];

export default function AboutPage() {
  return (
    <SettingsShell title="About Us" subtitle="Learn more about APT and our team" showBack>
      <div className="p-4 sm:p-5 divide-y divide-border">
        {/* App Info */}
        <div className="pt-6">
          <div className="items-center text-center py-8 space-y-4">
            <Image
              src="/logo/logo-name-transparent.svg"
              alt="APT Logo"
              width={120}
              height={48}
              className="mx-auto object-contain"
            />
            <h2 className="text-2xl font-nunito font-bold text-foreground">APT</h2>
            <p className="text-muted-foreground text-sm">A Place to Thrive</p>
            <div className="inline-flex px-3 py-1 rounded-full bg-primary/10">
              <span className="text-primary text-xs font-nunito font-semibold">
                Version {APP_VERSION}
              </span>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="pt-6">
          <div className="px-4 sm:px-5 pb-3">
            <SectionTitle title="About the App" />
          </div>
          <div className="px-4 sm:px-5 space-y-3">
            <p className="text-sm text-muted-foreground leading-relaxed">
              APT is a property rental platform designed for the Philippine
              market, primarily targeting Metro Manila. It connects tenants and
              landlords, making the rental process seamless &mdash; from searching for a
              place to managing leases and payments, all in one app.
            </p>
          </div>
        </div>

        {/* Meet the Team */}
        <div className="pt-6">
          <div className="px-4 sm:px-5 pb-3">
            <SectionTitle title="Meet the Team" />
          </div>
          <div className="px-4 sm:px-5 space-y-3">
            {teamMembers.map((dev) => (
              <Link
                key={dev.name}
                href="#"
                className="flex items-center gap-3 bg-muted/30 rounded-xl px-4 py-3 hover:bg-muted/50 transition-colors"
              >
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-primary font-nunito font-semibold text-sm">
                    {dev.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-nunito font-semibold text-foreground">
                    {dev.name}
                  </p>
                  <p className="text-xs text-muted-foreground">{dev.role}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Social Links */}
        <div className="pt-6">
          <div className="px-4 sm:px-5 pb-3">
            <SectionTitle title="Connect with Us" />
          </div>
          <div className="px-4 sm:px-5 space-y-2">
            {socials.map((social) => {
              const Icon = social.icon;
              return (
                <Link
                  key={social.id}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 bg-muted/30 rounded-xl px-4 py-3 hover:bg-muted/50 transition-colors"
                >
                  <Icon size={18} className="text-primary" />
                  <span className="text-sm text-foreground">{social.label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* STI Branding */}
        <div className="pt-4 pb-6 px-4 sm:px-5 text-center text-xs text-muted-foreground">
          <p>Developed as a capstone project at</p>
          <p className="font-nunito font-semibold">STI College Caloocan</p>
          <p className="mt-1">
            &copy; {new Date().getFullYear()} APT. All rights reserved.
          </p>
        </div>

      </div>
    </SettingsShell>
  );
}