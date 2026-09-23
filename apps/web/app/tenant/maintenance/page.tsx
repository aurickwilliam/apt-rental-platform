"use client";

import { useRouter } from "next/navigation";
import { Button } from "@heroui/react";
import { ArrowLeft, Wrench } from "lucide-react";
import PropertyContextCard from "./components/PropertyContextCard";
import MaintenanceForm from "./components/MaintenanceForm";

export default function MaintenanceRequestPage() {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
        <div className="max-w-4xl mx-auto space-y-4">
          {/* Header */}
          <div className="flex flex-col gap-1">
            <Button variant="outline" size="sm" className="w-fit" onPress={() => router.back()}>
              <ArrowLeft size={16} /> Back
            </Button>
            <p className="text-xs text-zinc-400 uppercase tracking-wider flex items-center gap-2">
              <Wrench size={14} className="text-primary" /> Maintenance
            </p>
            <div>
              <h1 className="text-2xl sm:text-3xl font-nunito font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
                Request Maintenance
              </h1>
              <p className="text-sm text-zinc-500 mt-1">
                Let your landlord know about an issue with your unit. We&apos;ll
                notify them right away and keep you posted on the status.
              </p>
            </div>
          </div>

          <PropertyContextCard propertyName="123 Rizal St., Unit 4B" landlordName="N/A" />
          <MaintenanceForm />
        </div>
      </div>
    </div>
  );
}
