"use client";

import PropertyContextCard from "./components/PropertyContextCard";
import MaintenanceForm from "./components/MaintenanceForm";

export default function MaintenanceRequestPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      <p className="text-sm text-muted-foreground">
        Let your landlord know about an issue with your unit. We&apos;ll notify them right away and keep you posted on the status.
      </p>
      <PropertyContextCard propertyName="123 Rizal St., Unit 4B" landlordName="N/A" />
      <MaintenanceForm />
    </div>
  );
}