"use client";

import Image from "next/image";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import {
  Card,
  Button,
  Chip,
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionIndicator,
  AccordionPanel,
  AccordionBody,
  Modal,
  Separator,
  useOverlayState,
} from "@heroui/react";
import {
  IconArrowLeft as ArrowLeft,
  IconBan as Ban,
  IconMapPin as MapPin,
} from "@tabler/icons-react";
import { toast } from "@heroui/react";
import { formatPesoDisplay } from "@repo/utils";
import { useTenantApplications } from "@/hooks/use-tenant-applications";
import { useApplicantPersonalInfo } from "@/hooks/use-applicant-personal-info";
import { useVisitRequest } from "@/hooks/use-visit-request";
import { useCancelApplication } from "@/hooks/use-cancel-application";
import { useRespondToReschedule } from "@/hooks/use-respond-to-reschedule";
import { getApplicationStatusStyle } from "@/app/tenant/applications/lib/statusStyles";
import DetailField from "@/app/tenant/applications/components/DetailField";
import ApplicationDetailSkeleton from "@/app/tenant/applications/components/ApplicationDetailSkeleton";
import DocumentRow from "@/app/tenant/applications/components/DocumentRow";
import VisitRequestDetailsCard from "@/app/tenant/applications/components/VisitRequestDetailsCard";

function formatLongDate(d: string) {
  try {
    return new Intl.DateTimeFormat("en-US", { dateStyle: "long" }).format(new Date(d));
  } catch {
    return d;
  }
}

function formatBirthDate(value: string) {
  if (!value) return "—";
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric" });
}

export default function ApplicationDetailPage() {
  const params = useParams<{ applicationId: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const applicationId = params.applicationId;
  const apartmentIdParam = searchParams.get("apartmentId") ?? "";

  const { applications, tenantId, loading: appsLoading, error: appsError, refresh } = useTenantApplications();
  const { personalInfo, loading: profileLoading } = useApplicantPersonalInfo(tenantId);
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

  if (appsLoading || visitLoading || profileLoading) {
    return <ApplicationDetailSkeleton />;
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
  const StatusIcon = style.Icon;
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
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <Button variant="outline" size="sm" onPress={() => router.back()}>
        <ArrowLeft size={16} /> Back
      </Button>

      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-inter text-muted-foreground">Applied for</p>
          <h1 className="truncate text-2xl font-nunito font-bold text-primary">{apartment?.name ?? "Listing"}</h1>
          <p className="mt-1 text-sm font-inter text-muted-foreground">Submitted {formatLongDate(application.created_at)}</p>
        </div>
        <Chip variant="soft" color={style.chipColor as never} className="px-2.5 py-1 text-sm">
          <span className="flex items-center gap-1 font-nunito font-semibold">
            <StatusIcon size={16} style={{ color: style.iconColor }} aria-hidden="true" />
          {style.label}
          </span>
        </Chip>
      </div>

      <div className="grid items-start gap-6 xl:items-stretch xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="space-y-4">
          <div className="overflow-hidden rounded-3xl border border-border bg-card">
            <div className="relative h-64 md:h-[360px]">
              {cover ? (
                <Image src={cover} alt={apartment?.name ?? "Apartment"} fill unoptimized className="object-cover" />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground">No image</div>
              )}
            </div>
          </div>

          <Card className="rounded-2xl border border-border bg-card p-5 text-card-foreground shadow-none">
            <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_auto]">
              <div className="min-w-0">
                <p className="text-xs font-nunito font-semibold text-muted-foreground">Location</p>
                <p className="mt-1 flex items-start gap-1 text-sm font-inter text-card-foreground">
                  <MapPin size={16} className="mt-0.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                  <span>{fullAddress ?? "—"}</span>
                </p>
              </div>
              <div>
                <p className="text-xs font-nunito font-semibold text-muted-foreground">Monthly Rent</p>
                <p className="mt-1 text-lg font-nunito font-bold text-primary">
                  {apartment?.monthly_rent != null ? `${formatPesoDisplay(apartment.monthly_rent)}/month` : "—"}
                </p>
              </div>
            </div>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
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
        </div>

        <div className="space-y-4 xl:flex xl:flex-col">
      <Card className="border border-border bg-card text-card-foreground p-5 rounded-2xl shadow-none xl:flex xl:h-full xl:flex-col">
        <h3 className="text-lg font-nunito font-semibold text-card-foreground">Application Details</h3>
        <p className="mb-5 mt-1 text-sm font-inter text-muted-foreground">
          These are the details you provided when you submitted your application.
        </p>

        <Accordion className="flex flex-col gap-3">
          <AccordionItem id="personal" className="overflow-hidden rounded-xl border border-border bg-card">
            <AccordionTrigger className="flex w-full items-center justify-between p-4 text-card-foreground">
              <span className="flex items-center gap-3 text-base font-nunito font-semibold">
                Personal Information
              </span>
              <AccordionIndicator />
            </AccordionTrigger>
            <AccordionPanel>
              <AccordionBody className="border-t border-border px-4 pb-5 pt-4">
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <DetailField label="Full Name" value={personalInfo.fullName.trim() ? personalInfo.fullName : "—"} />
                  <DetailField label="Email" value={personalInfo.email.trim() ? personalInfo.email : "—"} />
                  <DetailField label="Date of Birth" value={formatBirthDate(personalInfo.dateOfBirth)} />
                  <DetailField label="Contact Number" value={personalInfo.contactNumber.trim() ? personalInfo.contactNumber : "—"} />
                  <div className="md:col-span-2">
                    <DetailField label="Current Address" value={personalInfo.currentAddress.trim() ? personalInfo.currentAddress : "—"} />
                  </div>
                </div>
                <Separator className="my-5" />
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <DetailField label="Occupation" value={application.occupation.trim() ? application.occupation : "—"} />
                  <DetailField label="Employer" value={application.employer_name.trim() ? application.employer_name : "—"} />
                  <DetailField label="Employment Type" value={application.employment_type || "—"} />
                  <DetailField label="Monthly Income" value={formatPesoDisplay(application.monthly_income)} />
                  <DetailField label="Previous Landlord Name" value={application.prev_landlord_name?.trim() ? application.prev_landlord_name : "—"} />
                  <DetailField label="Previous Landlord Contact" value={application.prev_landlord_contact?.trim() ? application.prev_landlord_contact : "—"} />
                </div>
              </AccordionBody>
            </AccordionPanel>
          </AccordionItem>

          <AccordionItem id="rental" className="overflow-hidden rounded-xl border border-border bg-card">
            <AccordionTrigger className="flex w-full items-center justify-between p-4 text-card-foreground">
              <span className="flex items-center gap-3 text-base font-nunito font-semibold">
                Rental Preferences
              </span>
              <AccordionIndicator />
            </AccordionTrigger>
            <AccordionPanel>
              <AccordionBody className="border-t border-border px-4 pb-5 pt-4">
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
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

          <AccordionItem id="docs" className="overflow-hidden rounded-xl border border-border bg-card">
            <AccordionTrigger className="flex w-full items-center justify-between p-4 text-card-foreground">
              <span className="flex items-center gap-3 text-base font-nunito font-semibold">
                Submitted Documents
              </span>
              <AccordionIndicator />
            </AccordionTrigger>
            <AccordionPanel>
              <AccordionBody className="border-t border-border px-4 pb-5 pt-4">
                <div className="flex flex-col gap-3">
                  {application.documents.map((doc) => (
                    <DocumentRow
                      key={doc.label}
                      label={doc.label}
                      path={doc.path}
                      signedUrl={doc.signedUrl}
                      emptyLabel={doc.emptyLabel}
                    />
                  ))}
                </div>
              </AccordionBody>
            </AccordionPanel>
          </AccordionItem>

          <AccordionItem id="status" className="overflow-hidden rounded-xl border border-border bg-card after:content-['']!">
            <AccordionTrigger className="flex w-full items-center justify-between p-4 text-card-foreground">
              <span className="flex items-center gap-3 text-base font-nunito font-semibold">
                Application Status
              </span>
              <AccordionIndicator />
            </AccordionTrigger>
            <AccordionPanel>
              <AccordionBody className="border-t border-border px-4 pb-5 pt-4">
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
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

        {application.status === "pending" && (
          <div className="mt-auto pt-6">
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
          </div>
        )}
      </Card>
        </div>
      </div>
    </div>
  );
}
