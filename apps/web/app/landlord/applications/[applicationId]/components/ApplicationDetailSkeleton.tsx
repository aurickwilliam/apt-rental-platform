import { Skeleton } from "@heroui/react";
import { IconHome, IconUser, IconClipboardList, IconBriefcase, IconAdjustments, IconAddressBook, IconFileText, IconMessage } from "@tabler/icons-react";
import ApplicationDetailSection from "./ApplicationDetailSection";

const DOCUMENT_COUNT = 5;
const INFORMATION_SECTIONS = [
  { title: "Application Details", subtitle: "Submitted dates, rent and household size.", icon: IconClipboardList, count: 4 },
  { title: "Employment", subtitle: "Employment and income information provided by the tenant.", icon: IconBriefcase, count: 4 },
  { title: "Preferences", subtitle: "Household preferences and parking needs.", icon: IconAdjustments, count: 3 },
  { title: "Previous Landlord", subtitle: "Previous rental contact information, when provided.", icon: IconAddressBook, count: 2 },
];

function Sk({ className }: { className: string }) {
  return <Skeleton className={`bg-grey-300! ${className}`} />;
}

function ApplicationFieldSkeleton() {
  return (
    <div className="min-w-0 rounded-xl bg-muted/40 px-3 py-3 space-y-2">
      <Sk className="h-4 w-24 max-w-full rounded-lg" />
      <Sk className="h-6 w-32 max-w-full rounded-lg" />
    </div>
  );
}

export default function ApplicationDetailSkeleton() {
  return (
    <div className="w-full min-w-0 p-4 md:p-6 flex flex-col gap-4 bg-card min-h-0" aria-busy="true" aria-label="Loading application details">
      <div>
        <Sk className="h-8 w-44 rounded-lg" />
        <h1 className="mt-2 text-2xl font-nunito font-bold text-card-foreground">Application Details</h1>
        <p className="mt-1 text-sm text-muted-foreground">Review the tenant&apos;s information and supporting documents.</p>
      </div>
      <div className="flex flex-col gap-4" aria-hidden="true">
        <div className="grid grid-cols-1 items-stretch gap-4 xl:grid-cols-2">
          <ApplicationDetailSection title="Property" subtitle="Tenant application for this property." icon={IconHome}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <Sk className="h-36 w-full shrink-0 rounded-xl sm:h-28 sm:w-40" />
              <div className="min-w-0 flex-1 space-y-3">
                <Sk className="h-7 w-52 max-w-full rounded-lg" />
                <Sk className="h-10 w-full rounded-lg" />
                <Sk className="h-6 w-32 rounded-lg" />
              </div>
            </div>
          </ApplicationDetailSection>
          <ApplicationDetailSection title="Applicant" subtitle="Tenant contact information and application status." icon={IconUser}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex min-w-0 flex-1 gap-3">
                <Sk className="size-12 shrink-0 rounded-full" />
                <div className="min-w-0 flex-1 space-y-3">
                  <Sk className="h-7 w-44 max-w-full rounded-lg" />
                  <Sk className="h-5 w-full rounded-lg" />
                  <Sk className="h-5 w-24 rounded-lg" />
                  <Sk className="h-5 w-32 max-w-full rounded-lg" />
                </div>
              </div>
              <Sk className="h-6 w-20 rounded-full" />
            </div>
          </ApplicationDetailSection>
        </div>
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {INFORMATION_SECTIONS.map(({ title, subtitle, icon, count }) => (
            <ApplicationDetailSection key={title} title={title} subtitle={subtitle} icon={icon}>
              <div className={`grid grid-cols-1 gap-3 ${title === "Preferences" ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
                {Array.from({ length: count }, (_, index) => <ApplicationFieldSkeleton key={index} />)}
              </div>
            </ApplicationDetailSection>
          ))}
        </div>
        <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-2">
          <ApplicationDetailSection title="Documents" subtitle="Private supporting documents attached to this application." icon={IconFileText}>
            <div className="flex flex-col gap-3">
              {Array.from({ length: DOCUMENT_COUNT }, (_, index) => (
                <div key={index} className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 p-3">
                  <Sk className="size-10 shrink-0 rounded-xl" />
                  <div className="min-w-0 flex-1 space-y-2"><Sk className="h-5 w-40 max-w-full rounded-lg" /><Sk className="h-4 w-32 max-w-full rounded-lg" /></div>
                  <Sk className="h-8 w-20 rounded-full" />
                </div>
              ))}
            </div>
          </ApplicationDetailSection>
          <ApplicationDetailSection title="Message" subtitle="A note from the applicant." icon={IconMessage}>
            <div className="rounded-xl bg-muted/40 p-4 space-y-3"><Sk className="h-5 w-full rounded-lg" /><Sk className="h-5 w-5/6 rounded-lg" /><Sk className="h-5 w-2/3 rounded-lg" /></div>
          </ApplicationDetailSection>
        </div>
      </div>
    </div>
  );
}
