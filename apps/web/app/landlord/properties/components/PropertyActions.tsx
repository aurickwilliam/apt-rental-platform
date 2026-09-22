"use client";

import { useRouter } from "next/navigation";
import { CirclePlus, FileText, Hammer, House, LayoutGrid } from "lucide-react";

import { useLandlordActionBadges, type ActionBadgeCategory } from "@/hooks/use-landlord-action-badges";

import QuickActionButton from "./QuickActionButton";

export default function PropertyActions() {
  const router = useRouter();
  const { counts, markViewed } = useLandlordActionBadges();

  const go = (category: ActionBadgeCategory | null, href: string) => {
    if (category) markViewed(category);
    router.push(href);
  };

  return (
    <section className="mt-6 rounded-3xl border border-border bg-muted/40 p-4 md:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
        <div className="flex items-center gap-3 shrink-0 lg:w-64">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <LayoutGrid size={22} className="text-primary" strokeWidth={2} />
          </span>
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-card-foreground">Property Actions</h3>
            <p className="text-xs text-muted-foreground">Quickly manage your properties and requests.</p>
          </div>
        </div>

        <div className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
          <QuickActionButton
            title="Add Property"
            subtitle="List a new apartment"
            icon={CirclePlus}
            onPress={() => go(null, "/landlord/properties/create")}
          />
          <QuickActionButton
            title="Maintenance Request"
            subtitle="Handle tenant requests"
            icon={Hammer}
            badgeCount={counts.maintenance}
            onPress={() => go("maintenance", "/landlord/maintenance-requests")}
          />
          <QuickActionButton
            title="Visit Request"
            subtitle="View scheduled visits"
            icon={House}
            badgeCount={counts.visits}
            onPress={() => go("visits", "/landlord/visit-requests")}
          />
          <QuickActionButton
            title="Tenant Applications"
            subtitle="Review and manage"
            icon={FileText}
            badgeCount={counts.applications}
            onPress={() => go("applications", "/landlord/applications")}
          />
        </div>
      </div>
    </section>
  );
}
