"use client";

import { useRouter } from "next/navigation";
import { CirclePlus, FileText, Hammer, House } from "lucide-react";

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
    <section className="mt-6">
      <h3 className="text-base font-medium font-noto-serif">Property Actions</h3>
      <div className="mt-3 flex flex-row flex-wrap">
        <QuickActionButton
          label="Add Property"
          icon={CirclePlus}
          onPress={() => go(null, "/landlord/properties/create")}
        />
        <QuickActionButton
          label="Maintenance Request"
          icon={Hammer}
          badgeCount={counts.maintenance}
          onPress={() => go("maintenance", "/landlord/maintenance-requests")}
        />
        <QuickActionButton
          label="Visit Request"
          icon={House}
          badgeCount={counts.visits}
          onPress={() => go("visits", "/landlord/visit-requests")}
        />
        <QuickActionButton
          label="Tenant Applications"
          icon={FileText}
          badgeCount={counts.applications}
          onPress={() => go("applications", "/landlord/applications")}
        />
      </div>
    </section>
  );
}
