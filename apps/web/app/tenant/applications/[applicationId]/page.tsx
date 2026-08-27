"use client";

import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Card,
  Button,
  Separator,
  Chip,
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionIndicator,
  AccordionPanel,
  AccordionBody,
} from "@heroui/react";
import { ArrowLeft, Trash2, MapPin } from "lucide-react";
import { toast } from "@heroui/react";
import { formatPesoDisplay } from "@repo/utils";
import { getApplications, deleteApplication, type StoredApplication } from "@/app/tenant/applications/lib/application-store";
import { getApplicationStatusStyle } from "@/app/tenant/applications/lib/statusStyles";
import { getVisitRequest, deleteVisitRequest, type StoredVisit } from "@/app/tenant/applications/lib/visit-store";
import DetailField from "@/app/tenant/applications/components/DetailField";
import DocumentRow from "@/app/tenant/applications/components/DocumentRow";
import VisitRequestDetailsCard from "@/app/tenant/applications/components/VisitRequestDetailsCard";

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
  const [visit, setVisit] = useState<StoredVisit | null>(null);

  const refreshVisit = () => setVisit(getVisitRequest(applicationId));

  useEffect(() => {
    const found = getApplications().find((a) => a.id === applicationId) ?? null;
    setApp(found);
    refreshVisit();
  }, [applicationId]);

  const hasVisit = !!visit;

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
  const effectiveApartmentId = apartmentId || app.apartmentId;

  const handleDelete = () => {
    deleteApplication(app.id);
    toast.success("Application deleted");
    router.push("/tenant/my-rental");
  };

  const showRequestVisit = !hasVisit && app.status === "pending";

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
      <Button variant="outline" size="sm" onPress={() => router.back()}>
        <ArrowLeft size={16} /> Back
      </Button>

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Applied for</p>
          <h1 className="text-2xl font-bold text-primary truncate">{app.apartmentName ?? "Listing"}</h1>
          <p className="text-sm text-muted-foreground mt-1">Submitted {formatLongDate(app.createdAt)}</p>
        </div>
        <Chip variant="soft" color={style.chipColor as never} size="sm">
          {style.label}
        </Chip>
      </div>

      {/* Cover */}
      <div className="border border-border rounded-3xl overflow-hidden bg-card isolate">
        <div className="relative h-64 md:h-[360px] overflow-hidden rounded-3xl">
          {app.apartmentCover ? (
            <img src={app.apartmentCover} alt={app.apartmentName ?? "Apartment"} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground">No image</div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" style={{ borderRadius: "1.375rem" }} />
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <h2 className="text-white text-xl font-bold [text-shadow:0_1px_6px_rgba(0,0,0,0.8)]">{app.apartmentName ?? "Listing"}</h2>
            {app.apartmentAddress && (
              <p className="text-white text-sm flex items-center gap-1 mt-1 [text-shadow:0_1px_4px_rgba(0,0,0,0.8)]">
                <MapPin size={14} className="shrink-0" /> {app.apartmentAddress}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Location + Rent + Actions */}
      <Card className="border border-border bg-card text-card-foreground p-5 rounded-2xl">
        <div className="grid grid-cols-2 gap-4">
          <DetailField label="Location" value={app.apartmentAddress ?? "—"} />
          <DetailField label="Monthly Rent" value={app.monthlyRent !== null ? `${formatPesoDisplay(app.monthlyRent)}/month` : "—"} />
        </div>
        <div className="flex gap-3 mt-4">
          <Button variant="outline" size="sm" className="flex-1" onPress={() => router.push(`/browse/${effectiveApartmentId}`)}>
            View Description
          </Button>
          {showRequestVisit && (
            <Button size="sm" className="flex-1" onPress={() => router.push(`/tenant/applications/request-visit?apartmentId=${effectiveApartmentId}&applicationId=${app.id}`)}>
              Request a Visit
            </Button>
          )}
        </div>
      </Card>

      {visit && (
        <VisitRequestDetailsCard
          visit={visit}
          onCancel={() => {
            deleteVisitRequest(visit.id);
            refreshVisit();
          }}
        />
      )}

      {/* Application Details Accordion */}
      <Card className="border border-border bg-card text-card-foreground p-5 rounded-2xl">
        <h3 className="text-base font-semibold text-card-foreground">Application Details</h3>
        <p className="text-xs text-muted-foreground mb-4">These are the details you submitted. Review them carefully.</p>

        <Accordion className="flex flex-col gap-3">
          <AccordionItem id="personal" className="border border-border rounded-xl bg-muted overflow-hidden">
            <AccordionTrigger className="w-full flex items-center justify-between p-4 text-sm font-semibold text-card-foreground">
              Personal Information
              <AccordionIndicator />
            </AccordionTrigger>
            <AccordionPanel>
              <AccordionBody className="px-4 pb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <DetailField label="Full Name" value={app.data.fullName || "—"} />
                  <DetailField label="Email" value={app.data.email || "—"} />
                  <DetailField label="Date of Birth" value={app.data.dateOfBirth ? new Date(app.data.dateOfBirth).toLocaleDateString() : "—"} />
                  <DetailField label="Contact Number" value={app.data.contactNumber || "—"} />
                  <div className="md:col-span-2">
                    <DetailField label="Current Address" value={app.data.currentAddress || "—"} />
                  </div>
                  <DetailField label="Occupation" value={app.data.occupation || "—"} />
                  <DetailField label="Employer" value={app.data.companyName || "—"} />
                  <DetailRow label="Employment Type" value={app.data.employmentType || "—"} />
                  <DetailField label="Monthly Income" value={app.data.monthlyIncomeText || "—"} />
                  <DetailField label="Previous Landlord Name" value={app.data.prevLandlordName || "—"} />
                  <DetailField label="Previous Landlord Contact" value={app.data.prevLandlordContact || "—"} />
                </div>
              </AccordionBody>
            </AccordionPanel>
          </AccordionItem>

          <AccordionItem id="rental" className="border border-border rounded-xl bg-muted overflow-hidden">
            <AccordionTrigger className="w-full flex items-center justify-between p-4 text-sm font-semibold text-card-foreground">
              Rental Preferences
              <AccordionIndicator />
            </AccordionTrigger>
            <AccordionPanel>
              <AccordionBody className="px-4 pb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <DetailField label="Move-in Date" value={app.data.moveInDate ? new Date(app.data.moveInDate).toLocaleDateString() : "—"} />
                  <DetailField label="No. of Occupants" value={app.data.noOccupants ? `${app.data.noOccupants} Person(s)` : "—"} />
                  <DetailField label="Has Pets" value={app.data.hasPets ? (app.data.hasPets === "yes" ? "Yes" : "No") : "—"} />
                  <DetailField label="Smoker" value={app.data.isSmoker ? (app.data.isSmoker === "yes" ? "Yes" : "No") : "—"} />
                  <DetailField label="Needs Parking" value={app.data.needParking ? (app.data.needParking === "yes" ? "Yes" : "No") : "—"} />
                  <div className="md:col-span-2">
                    <DetailField label="Message" value={app.data.additionalNotes || "—"} />
                  </div>
                </div>
              </AccordionBody>
            </AccordionPanel>
          </AccordionItem>

          <AccordionItem id="docs" className="border border-border rounded-xl bg-muted overflow-hidden">
            <AccordionTrigger className="w-full flex items-center justify-between p-4 text-sm font-semibold text-card-foreground">
              Submitted Documents
              <AccordionIndicator />
            </AccordionTrigger>
            <AccordionPanel>
              <AccordionBody className="px-4 pb-4">
                <div className="flex flex-col gap-3">
                  <DocumentRow label="Government ID" fileName={app.data.govIdName} isImage />
                  <DocumentRow label="Proof of Billing" fileName={app.data.proofOfBillingName} isImage />
                  <DocumentRow label="Proof of Income" fileName={app.data.proofOfIncomeName} />
                  <DocumentRow label="NBI Clearance" fileName={app.data.nbiName} />
                </div>
              </AccordionBody>
            </AccordionPanel>
          </AccordionItem>

          <AccordionItem id="status" className="border border-border rounded-xl bg-muted overflow-hidden">
            <AccordionTrigger className="w-full flex items-center justify-between p-4 text-sm font-semibold text-card-foreground">
              Application Status
              <AccordionIndicator />
            </AccordionTrigger>
            <AccordionPanel>
              <AccordionBody className="px-4 pb-4">
                <div className="grid grid-cols-2 gap-4">
                  <DetailField label="Date Submitted" value={formatLongDate(app.createdAt)} />
                  <DetailField label="Status" value={style.label} />
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground">{style.description}</p>
                  </div>
                </div>
              </AccordionBody>
            </AccordionPanel>
          </AccordionItem>
        </Accordion>

        <Separator className="my-6" />

        <div className="flex gap-3">
          <Button variant="danger" className="flex-1" onPress={handleDelete}>
            <Trash2 size={16} /> Delete Application
          </Button>
        </div>
        <p className="text-[11px] text-muted-foreground text-center mt-3">Local UI test — stored in localStorage only.</p>
      </Card>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 flex-1">
      <span className="text-xs text-muted-foreground font-medium">{label}</span>
      <span className="text-sm font-semibold text-card-foreground">{value ?? "—"}</span>
    </div>
  );
}
