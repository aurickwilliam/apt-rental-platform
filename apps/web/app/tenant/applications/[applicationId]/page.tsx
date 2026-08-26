"use client";

import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, Button, Separator, Chip } from "@heroui/react";
import { ArrowLeft, Trash2 } from "lucide-react";
import { getApplications, deleteApplication, type StoredApplication } from "@/app/tenant/applications/lib/application-store";
import { getApplicationStatusStyle } from "@/app/tenant/applications/lib/statusStyles";
import { toast } from "@heroui/react";

function formatLongDate(d: string) {
  try {
    return new Intl.DateTimeFormat("en-US", { dateStyle: "long" }).format(new Date(d));
  } catch {
    return d;
  }
}

export default function ApplicationDetailPage() {
  const params = useParams<{ applicationId: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const applicationId = params.applicationId;
  const apartmentId = searchParams.get("apartmentId") ?? "";

  const [app, setApp] = useState<StoredApplication | null>(null);

  useEffect(() => {
    const found = getApplications().find((a) => a.id === applicationId) ?? null;
    setApp(found);
  }, [applicationId]);

  if (!app) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center">
        <p className="text-muted-foreground">Application not found.</p>
        <Button variant="outline" className="mt-4" onPress={() => router.back()}>
          <ArrowLeft size={16} /> Back
        </Button>
      </div>
    );
  }

  const style = getApplicationStatusStyle(app.status);

  const handleDelete = () => {
    deleteApplication(app.id);
    toast.success("Application deleted");
    router.push("/tenant/my-rental");
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-4">
      <Button variant="outline" size="sm" onPress={() => router.back()}>
        <ArrowLeft size={16} /> Back
      </Button>

      <Card className="border border-border bg-card text-card-foreground p-6 rounded-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Applied for</p>
            <h1 className="text-2xl font-bold text-card-foreground">{app.apartmentName ?? "Listing"}</h1>
            <p className="text-sm text-muted-foreground mt-1">Submitted {formatLongDate(app.createdAt)}</p>
          </div>
          <Chip variant="soft" color={style.chipColor as never} size="sm">
            {style.label}
          </Chip>
        </div>

        <Separator className="my-4" />

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Status</p>
            <p className="font-semibold text-card-foreground">{style.label}</p>
            <p className="text-xs text-muted-foreground mt-1">{style.description}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Apartment ID</p>
            <p className="font-mono text-xs text-card-foreground">{apartmentId || app.apartmentId}</p>
          </div>
        </div>

        <Separator className="my-4" />

        <h3 className="font-semibold text-card-foreground mb-3">Tenant Information</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Full Name</p>
            <p className="text-card-foreground">{app.data.fullName || "—"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Email</p>
            <p className="text-card-foreground">{app.data.email || "—"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Contact</p>
            <p className="text-card-foreground">{app.data.contactNumber || "—"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Employment</p>
            <p className="text-card-foreground">{app.data.employmentType || "—"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Monthly Income</p>
            <p className="text-card-foreground">{app.data.monthlyIncomeText || "—"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Move-In Date</p>
            <p className="text-card-foreground">{app.data.moveInDate ? new Date(app.data.moveInDate).toLocaleDateString() : "—"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Occupants</p>
            <p className="text-card-foreground">{app.data.noOccupants || "—"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Documents</p>
            <p className="text-card-foreground text-xs">
              {[app.data.govIdName, app.data.proofOfBillingName, app.data.proofOfIncomeName, app.data.nbiName].filter(Boolean).join(", ") || "—"}
            </p>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <Button variant="outline" className="flex-1" onPress={() => router.push(apartmentId ? `/browse/${apartmentId}` : "/browse")}>
            View Listing
          </Button>
          <Button variant="danger" className="flex-1" onPress={handleDelete}>
            <Trash2 size={16} /> Delete Application
          </Button>
        </div>
        <p className="text-[11px] text-muted-foreground text-center mt-3">Local UI test — stored in localStorage only.</p>
      </Card>
    </div>
  );
}
