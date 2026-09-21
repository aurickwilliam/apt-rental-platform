"use client";

import { useParams, useSearchParams, useRouter } from "next/navigation";
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
  Modal,
  useOverlayState,
  Spinner,
} from "@heroui/react";
import { ArrowLeft, Ban, MapPin } from "lucide-react";
import { toast } from "@heroui/react";
import { formatPesoDisplay } from "@repo/utils";
import { useTenantApplications } from "@/hooks/use-tenant-applications";
import { useVisitRequest } from "@/hooks/use-visit-request";
import { useCancelApplication } from "@/hooks/use-cancel-application";
import { useRespondToReschedule } from "@/hooks/use-respond-to-reschedule";
import { getApplicationStatusStyle } from "@/app/tenant/applications/lib/statusStyles";
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
  const apartmentIdParam = searchParams.get("apartmentId") ?? "";

  const { applications, loading: appsLoading, error: appsError, refresh } = useTenantApplications();
  const {
    visitRequest,
    history,
    loading: visitLoading,
    refetch: refetchVisit,
  } = useVisitRequest(applicationId);
  const { cancelApplication, loading: cancelling } = useCancelApplication();
  const { accept, decline, loading: responding } = useRespondToReschedule();

  const cancelDialog = useOverlayState();

  const application = applications.find((a) => a.id === applicationId) ?? null;

  if (appsLoading || visitLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 flex justify-center">
        <Spinner color="accent" />
      </div>
    );
  }

  if (appsError || !application) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center">
        <p className="text-muted-foreground">{appsError ?? "Application not found."}</p>
        <Button variant="outline" className="mt-4" onPress={() => router.back()}>
          <ArrowLeft size={16} /> Back
        </Button>
      </div>
    );
  }

  const style = getApplicationStatusStyle(application.status);
  const effectiveApartmentId = apartmentIdParam || application.apartment_id;
  const apartment = application.apartments;
  const cover =
    apartment?.apartment_images?.find((img) => img.is_cover)?.url ??
    apartment?.apartment_images?.[0]?.url ??
    null;
  const fullAddress = apartment
    ? [apartment.street_address, apartment.barangay, apartment.city, apartment.province, apartment.zip_code]
        .filter(Boolean)
        .join(", ")
    : null;

  const showRequestVisit = !visitRequest && application.status === "pending";

  const handleConfirmCancel = async () => {
    const { error } = await cancelApplication(applicationId, visitRequest?.id);
    if (error) {
      toast.danger("Failed to cancel application. Please try again.");
    } else {
      cancelDialog.setOpen(false);
      toast.success("Application cancelled");
      await refresh();
      router.push("/tenant/my-rental");
    }
  };

  const handleAccept = async () => {
    if (!visitRequest) return;
    const { error } = await accept(visitRequest.id);
    if (error) toast.danger("Failed to accept visit. Please try again.");
    else void refetchVisit();
  };

  const handleDecline = async () => {
    if (!visitRequest) return;
    const { error } = await decline(visitRequest.id);
    if (error) toast.danger("Failed to update visit request. Please try again.");
    else void refetchVisit();
  };

  const handleRequestAgain = () =>
    router.push(
      `/tenant/applications/request-visit?apartmentId=${effectiveApartmentId}&applicationId=${applicationId}`,
    );

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
      <Button variant="outline" size="sm" onPress={() => router.back()}>
        <ArrowLeft size={16} /> Back
      </Button>

      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Applied for</p>
          <h1 className="text-2xl font-bold text-primary truncate">{apartment?.name ?? "Listing"}</h1>
          <p className="text-sm text-muted-foreground mt-1">Submitted {formatLongDate(application.created_at)}</p>
        </div>
        <Chip variant="soft" color={style.chipColor as never} size="sm">
          {style.label}
        </Chip>
      </div>

      <div className="border border-border rounded-3xl overflow-hidden bg-card isolate">
        <div className="relative h-64 md:h-[360px] overflow-hidden rounded-3xl">
          {cover ? (
            <img src={cover} alt={apartment?.name ?? "Apartment"} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground">No image</div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" style={{ borderRadius: "1.375rem" }} />
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <h2 className="text-white text-xl font-bold [text-shadow:0_1px_6px_rgba(0,0,0,0.8)]">{apartment?.name ?? "Listing"}</h2>
            {fullAddress && (
              <p className="text-white text-sm flex items-center gap-1 mt-1 [text-shadow:0_1px_4px_rgba(0,0,0,0.8)]">
                <MapPin size={14} className="shrink-0" /> {fullAddress}
              </p>
            )}
          </div>
        </div>
      </div>

      <Card className="border border-border bg-card text-card-foreground p-5 rounded-2xl">
        <div className="grid grid-cols-2 gap-4">
          <DetailField label="Location" value={fullAddress} />
          <DetailField
            label="Monthly Rent"
            value={apartment?.monthly_rent != null ? `${formatPesoDisplay(apartment.monthly_rent)}/month` : "—"}
          />
        </div>
        <div className="flex gap-3 mt-4">
          <Button variant="outline" size="sm" className="flex-1" onPress={() => router.push(`/browse/${effectiveApartmentId}`)}>
            View Description
          </Button>
          {showRequestVisit && (
            <Button size="sm" className="flex-1" onPress={handleRequestAgain}>
              Request a Visit
            </Button>
          )}
        </div>
      </Card>

      {application.status === "rejected" && application.rejected_reason && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900">
          <p className="text-sm font-semibold text-red-600">Application Rejected</p>
          <p className="text-sm text-card-foreground mt-1">{application.rejected_reason}</p>
        </div>
      )}

      {application.status === "closed" && application.rejected_reason && (
        <div className="p-4 rounded-2xl bg-muted border border-border">
          <p className="text-sm font-semibold text-card-foreground">Application Closed</p>
          <p className="text-sm text-muted-foreground mt-1">{application.rejected_reason}</p>
        </div>
      )}

      {visitRequest && (
        <VisitRequestDetailsCard
          visit={visitRequest}
          onCancel={handleDecline}
          onAccept={handleAccept}
          onDecline={handleDecline}
          onRequestAgain={handleRequestAgain}
          actionLoading={responding}
        />
      )}

      <Card className="border border-border bg-card text-card-foreground p-5 rounded-2xl">
        <h3 className="text-base font-semibold text-card-foreground">Application Details</h3>
        <p className="text-xs text-muted-foreground mb-4">These are the details you provided when you submitted your application.</p>

        <Accordion className="flex flex-col gap-3">
          <AccordionItem id="personal" className="border border-border rounded-xl bg-muted overflow-hidden">
            <AccordionTrigger className="w-full flex items-center justify-between p-4 text-sm font-semibold text-card-foreground">
              Personal Information
              <AccordionIndicator />
            </AccordionTrigger>
            <AccordionPanel>
              <AccordionBody className="px-4 pb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <DetailField label="Occupation" value={application.occupation || "—"} />
                  <DetailField label="Employer" value={application.employer_name || "—"} />
                  <DetailField label="Employment Type" value={application.employment_type || "—"} />
                  <DetailField label="Monthly Income" value={formatPesoDisplay(application.monthly_income)} />
                  <DetailField label="Previous Landlord Name" value={application.prev_landlord_name} />
                  <DetailField label="Previous Landlord Contact" value={application.prev_landlord_contact} />
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
                  <DetailField
                    label="Move-in Date"
                    value={new Date(application.move_in_date).toLocaleDateString()}
                  />
                  <DetailField label="No. of Occupants" value={`${application.no_occupants} Person(s)`} />
                  <DetailField label="Has Pets" value={application.has_pets ? "Yes" : "No"} />
                  <DetailField label="Smoker" value={application.has_smoker ? "Yes" : "No"} />
                  <DetailField label="Needs Parking" value={application.need_parking ? "Yes" : "No"} />
                  <div className="md:col-span-2">
                    <DetailField label="Message" value={application.message} />
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
                  {application.documents.length > 0 ? (
                    application.documents.map((doc) => (
                      <DocumentRow
                        key={doc.label}
                        label={doc.label}
                        path={doc.path}
                        signedUrl={doc.signedUrl}
                        isImage={doc.label === "Government ID" || doc.label === "Proof of Billing"}
                      />
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No documents submitted.</p>
                  )}
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
                  <DetailField label="Date Submitted" value={formatLongDate(application.created_at)} />
                  <DetailField label="Status" value={style.label} />
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground">{style.description}</p>
                  </div>
                </div>
              </AccordionBody>
            </AccordionPanel>
          </AccordionItem>
        </Accordion>

        {history.length > 0 && (
          <>
            <Separator className="my-6" />
            <h4 className="text-sm font-semibold text-card-foreground">Visit History</h4>
            <p className="text-xs text-muted-foreground mb-3">Previous visit requests for this apartment.</p>
            <div className="flex flex-col gap-2">
              {history.map((item) => (
                <div key={item.id} className="flex items-center justify-between border border-border rounded-xl px-4 py-3 bg-muted">
                  <div>
                    <p className="text-sm font-medium text-card-foreground">
                      {formatLongDate(item.visit_date)}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">{item.status}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">Submitted {formatLongDate(item.created_at)}</p>
                </div>
              ))}
            </div>
          </>
        )}

        <Separator className="my-6" />

        {application.status === "pending" && (
          <>
            <div className="flex gap-3">
              <Button variant="danger" className="flex-1" isDisabled={cancelling || responding} onPress={() => cancelDialog.setOpen(true)}>
                <Ban size={16} /> Cancel Application
              </Button>
            </div>
            <Modal isOpen={cancelDialog.isOpen} onOpenChange={cancelDialog.setOpen}>
              <Modal.Backdrop>
                <Modal.Container size="sm">
                  <Modal.Dialog>
                    <Modal.Header>
                      <Modal.Heading>Cancel Application</Modal.Heading>
                    </Modal.Header>
                    <Modal.Body>
                      <p className="text-sm text-muted-foreground">
                        Are you sure you want to cancel your application for {apartment?.name ?? "this apartment"}? This cannot be undone.
                      </p>
                    </Modal.Body>
                    <Modal.Footer className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onPress={() => cancelDialog.setOpen(false)}>
                        Keep
                      </Button>
                      <Button variant="danger" size="sm" isDisabled={cancelling} onPress={handleConfirmCancel}>
                        Yes, Cancel
                      </Button>
                    </Modal.Footer>
                  </Modal.Dialog>
                </Modal.Container>
              </Modal.Backdrop>
            </Modal>
          </>
        )}
      </Card>
    </div>
  );
}
