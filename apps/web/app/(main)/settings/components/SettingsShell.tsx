"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@heroui/react";

interface SettingsShellProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  showBack?: boolean;
}

export default function SettingsShell({ title, subtitle, children, showBack }: SettingsShellProps) {
  const router = useRouter();

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      {showBack && (
        <Button
          variant="outline"
          size="sm"
          onPress={() => router.back()}
          className="mb-6 gap-1.5"
        >
          <ArrowLeft size={16} />
          Back
        </Button>
      )}

      <h1 className="text-4xl md:text-5xl text-secondary font-bold">{title}</h1>
      {subtitle && <p className="text-sm text-muted-foreground mt-2">{subtitle}</p>}

      <div className="mt-6">
        <div className="rounded-xl border border-border bg-card shadow-sm">
          {children}
        </div>
      </div>
    </div>
  );
}