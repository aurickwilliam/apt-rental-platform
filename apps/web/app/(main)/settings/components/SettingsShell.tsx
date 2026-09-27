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
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 md:px-12 py-10">
        {showBack && (
          <Button
            variant="outline"
            size="sm"
            onPress={() => router.back()}
            className="mb-4 gap-1.5"
          >
            <ArrowLeft size={16} />
            Back
          </Button>
        )}

        <h1 className="text-4xl md:text-5xl text-secondary font-bold mb-2">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground mb-6">{subtitle}</p>}

        <div className="max-w-3xl">
          <div className="rounded-xl border border-border bg-card shadow-sm">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}