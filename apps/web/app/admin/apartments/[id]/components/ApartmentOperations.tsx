import type { ReactNode } from "react";
import { formatPesoDisplay } from "@repo/utils";
import {
  IconCalendarEvent,
  IconClipboardList,
  IconHistory,
  IconKey,
  IconStar,
  IconTools,
} from "@tabler/icons-react";
import type {
  Activity,
  Application,
  Maintenance,
  Payment,
  Review,
  Summary,
  Tenancy,
  Visit,
} from "../types";
import {
  dateOnly,
  dateTime,
  Metric,
  Section,
  SectionError,
  StatusChip,
} from "./DetailPrimitives";

function OperationalEmptyState({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-h-40 flex-col items-center justify-center gap-2 px-3 py-5 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary" aria-hidden="true">
        {icon}
      </span>
      <p className="font-nunito font-semibold text-foreground">{title}</p>
      <p className="max-w-xs text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

export function CurrentTenancyCard({
  tenancy,
  payment,
  error,
  paymentError,
  occupied,
}: {
  tenancy: Tenancy | null;
  payment: Payment | null;
  error: boolean;
  paymentError: boolean;
  occupied: boolean;
}) {
  return (
    <Section
      title="Current tenancy"
      icon={<IconKey size={20} />}
      className="order-4 xl:order-0"
    >
      {error ? (
        <SectionError />
      ) : tenancy ? (
        <>
          {!occupied ? (
            <p className="mb-3 text-sm text-warning">
              Active tenancy found while the listing is not marked occupied.
            </p>
          ) : null}
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-nunito font-bold">
              {tenancy.tenant_name ?? "Tenant unavailable"}
            </span>
            <StatusChip status={tenancy.status} />
          </div>
          <dl className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            {[
              ["Lease start", dateOnly.format(new Date(tenancy.lease_start))],
              [
                "Lease end",
                tenancy.lease_end
                  ? dateOnly.format(new Date(tenancy.lease_end))
                  : "Not set",
              ],
              [
                "Monthly rent",
                tenancy.monthly_rent == null
                  ? "—"
                  : formatPesoDisplay(tenancy.monthly_rent),
              ],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs text-muted-foreground">{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
            <div>
              <dt className="text-xs text-muted-foreground">Latest payment</dt>
              <dd>
                {paymentError ? (
                  "Unavailable"
                ) : payment ? (
                  <StatusChip status={payment.status} />
                ) : (
                  "No payment recorded"
                )}
              </dd>
            </div>
          </dl>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">
          {occupied
            ? "Marked occupied, but no active tenancy was found. Check the tenancy record."
            : "No active tenancy; the unit is vacant."}
        </p>
      )}
    </Section>
  );
}

export function ApartmentPipelineSummary({
  applications,
  visits,
}: {
  applications: Summary<Application>;
  visits: Summary<Visit>;
}) {
  return (
    <div className="order-6 grid min-w-0 gap-4 md:grid-cols-2 xl:order-0">
      <Section title="Applications" icon={<IconClipboardList size={20} />}>
        {applications.error ? (
          <SectionError />
        ) : !applications.items.length && (applications.counts.total ?? 0) === 0 ? (
          <OperationalEmptyState
            icon={<IconClipboardList size={24} />}
            title="No applications yet"
            description="Rental applications for this property will appear here."
          />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2 2xl:grid-cols-4">
              <Metric label="Total" value={applications.counts.total ?? 0} />
              <Metric label="Pending" value={applications.counts.pending ?? 0} />
              <Metric label="Approved" value={applications.counts.approved ?? 0} />
              <Metric label="Rejected" value={applications.counts.rejected ?? 0} />
            </div>
            {applications.items.length ? (
              <ul className="mt-3 divide-y divide-border text-sm">
                {applications.items.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center justify-between gap-2 py-2"
                  >
                    <span>{dateOnly.format(new Date(item.created_at))}</span>
                    <StatusChip status={item.status} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">
                No recent applications to display.
              </p>
            )}
          </>
        )}
      </Section>
      <Section title="Visit requests" icon={<IconCalendarEvent size={20} />}>
        {visits.error ? (
          <SectionError />
        ) : !visits.items.length && (visits.counts.total ?? 0) === 0 ? (
          <OperationalEmptyState
            icon={<IconCalendarEvent size={24} />}
            title="No visit requests yet"
            description="Visit requests for this property will appear here."
          />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2 2xl:grid-cols-4">
              <Metric label="Total" value={visits.counts.total ?? 0} />
              <Metric label="Pending" value={visits.counts.pending ?? 0} />
              <Metric label="Approved" value={visits.counts.approved ?? 0} />
              <Metric label="Rescheduled" value={visits.counts.rescheduled ?? 0} />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Cancelled: {visits.counts.cancelled ?? 0} · Rejected:{" "}
              {visits.counts.rejected ?? 0}
            </p>
            {visits.items.length ? (
              <ul className="mt-3 divide-y divide-border text-sm">
                {visits.items.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center justify-between gap-2 py-2"
                  >
                    <span>
                      {dateOnly.format(
                        new Date(item.confirmed_visit_date ?? item.visit_date),
                      )}
                    </span>
                    <StatusChip status={item.status} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">
                No recent visit requests to display.
              </p>
            )}
          </>
        )}
      </Section>
    </div>
  );
}

export function ApartmentMaintenanceSummary({
  summary,
}: {
  summary: Summary<Maintenance>;
}) {
  return (
    <Section
      title="Maintenance"
      icon={<IconTools size={20} />}
      className="order-7 xl:order-0"
    >
      {summary.error ? (
        <SectionError />
      ) : !summary.items.length && Object.values(summary.counts).every((count) => count === 0) ? (
        <OperationalEmptyState
          icon={<IconTools size={24} />}
          title="No maintenance requests"
          description="Reported maintenance issues for this property will appear here."
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            <Metric
              label="Open"
              value={
                (summary.counts.pending ?? 0) +
                (summary.counts.in_progress ?? 0)
              }
            />
            <Metric
              label="High urgency open"
              value={summary.counts.high ?? 0}
            />
            <Metric label="Pending" value={summary.counts.pending ?? 0} />
            <Metric
              label="In progress"
              value={summary.counts.in_progress ?? 0}
            />
            <Metric label="Resolved" value={summary.counts.resolved ?? 0} />
          </div>
          {summary.items.length ? (
            <ul className="mt-3 divide-y divide-border text-sm">
              {summary.items.map((item) => (
                <li
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-2 py-2"
                >
                  <span className="min-w-0 font-medium wrap-break-word">
                    {item.title}{" "}
                    <span className="font-normal text-muted-foreground">
                      · {dateOnly.format(new Date(item.created_at))}
                    </span>
                  </span>
                  <span className="flex gap-1">
                    <StatusChip status={item.urgency} />
                    <StatusChip status={item.status} />
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">
              No recent maintenance requests to display.
            </p>
          )}
        </>
      )}
    </Section>
  );
}

export function ApartmentReviewsSummary({
  reviews,
  rating,
  total,
  error,
}: {
  reviews: Review[];
  rating: number | null;
  total: number | null;
  error: boolean;
}) {
  return (
    <Section
      title="Reviews"
      icon={<IconStar size={20} />}
      className="order-8 xl:order-0"
    >
      {error ? (
        <SectionError />
      ) : !reviews.length && (total ?? 0) === 0 && (rating == null || rating === 0) ? (
        <OperationalEmptyState
          icon={<IconStar size={24} />}
          title="No reviews yet"
          description="Tenant reviews for this property will appear here."
        />
      ) : (
        <>
          <div className="flex items-baseline gap-3">
            <strong className="font-nunito text-xl">
              {rating == null ? "—" : `${rating.toFixed(1)} / 5`}
            </strong>
            <span className="text-sm text-muted-foreground">
              {total ?? 0} reviews
            </span>
          </div>
          {reviews.length ? (
            <ul className="mt-2 divide-y divide-border">
              {reviews.map((review) => (
                <li key={review.id} className="py-2 text-sm">
                  <strong>{review.rating}/5</strong>
                  {review.created_at ? (
                    <span className="ml-2 text-xs text-muted-foreground">
                      {dateOnly.format(new Date(review.created_at))}
                    </span>
                  ) : null}
                  {review.comment ? (
                    <p className="mt-1 line-clamp-2 text-muted-foreground wrap-break-word">
                      {review.comment}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">
              No recent reviews to display.
            </p>
          )}
        </>
      )}
    </Section>
  );
}

export function ApartmentActivityTimeline({
  events,
  createdAt,
  error,
}: {
  events: Activity[];
  createdAt: string;
  error: boolean;
}) {
  return (
    <Section
      title="Admin activity & history"
      icon={<IconHistory size={20} />}
      className="order-9 xl:order-0"
    >
      {error ? (
        <SectionError />
      ) : (
        <>
          <p className="text-xs text-muted-foreground">
            Landlord edits and rent changes are not recorded in this audit log.
          </p>
          <div className="mt-3 rounded-3xl border border-border bg-muted/30 px-4">
            <ol className="divide-y divide-border text-sm">
              {events.map((event) => (
                <li key={event.id} className="py-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium capitalize">
                      {event.action.replaceAll("_", " ").toLowerCase()}
                    </span>
                    <time
                      dateTime={event.created_at}
                      className="text-xs text-muted-foreground"
                    >
                      {dateTime.format(new Date(event.created_at))}
                    </time>
                  </div>
                  <p className="text-muted-foreground">
                    {event.admin_name
                      ? `By ${event.admin_name}`
                      : "Administrator"}
                    {event.reason ? ` · ${event.reason}` : ""}
                  </p>
                </li>
              ))}
              <li className="py-3">
                <div className="flex flex-wrap justify-between gap-2">
                  <span className="font-medium">Apartment created</span>
                  <time
                    dateTime={createdAt}
                    className="text-xs text-muted-foreground"
                  >
                    {dateTime.format(new Date(createdAt))}
                  </time>
                </div>
              </li>
            </ol>
          </div>
        </>
      )}
    </Section>
  );
}
