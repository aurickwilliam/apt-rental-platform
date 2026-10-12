"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@heroui/react";
import {
  buildListHref,
  formatOptionLabels,
  formatResultRange,
} from "@/lib/admin-filters";
import AdminFilterToolbar from "../_components/filters/AdminFilterToolbar";
import ActiveFilterTags from "../_components/filters/ActiveFilterTags";
import AdminListFooter from "../_components/filters/AdminListFooter";
import FilterPillGroup from "../_components/filters/FilterPillGroup";
import FilterPopover from "../_components/filters/FilterPopover";
import SortDropdown from "../_components/filters/SortDropdown";
import type { ActiveFilterTag } from "../_components/filters/types";
import ApartmentsTable from "./components/ApartmentsTable";
import ApartmentCardList from "./components/ApartmentCardList";
import ApartmentsEmptyState from "./components/ApartmentsEmptyState";
import type { AdminApartment } from "./lib/apartment-display";
import {
  APARTMENT_SORT_OPTIONS,
  LOCATION_OPTIONS,
  STATUS_OPTIONS,
  VERIFICATION_OPTIONS,
  VISIBILITY_OPTIONS,
  apartmentFilterParams,
  type ApartmentFilters,
  type ListingStatus,
  type LocationFilter,
  type VerificationFilter,
  type VisibilityFilter,
} from "./lib/apartment-filters";

interface ApartmentsClientProps {
  filters: ApartmentFilters;
  apartments: AdminApartment[];
  error: boolean;
  page: number;
  totalCount: number;
  pageSize: number;
}

interface PopoverDraft {
  statuses: ListingStatus[];
  locations: LocationFilter[];
  verification: VerificationFilter;
  visibility: VisibilityFilter;
}

const EMPTY_DRAFT: PopoverDraft = {
  statuses: [],
  locations: [],
  verification: "all",
  visibility: "all",
};

function draftFromFilters(filters: ApartmentFilters): PopoverDraft {
  return {
    statuses: filters.statuses,
    locations: filters.locations,
    verification: filters.verification,
    visibility: filters.visibility,
  };
}

function buildActiveTags(filters: ApartmentFilters): ActiveFilterTag[] {
  const tags: ActiveFilterTag[] = [];
  if (filters.statuses.length)
    tags.push({
      id: "statuses",
      label: `Status: ${formatOptionLabels(STATUS_OPTIONS, filters.statuses)}`,
    });
  if (filters.locations.length)
    tags.push({
      id: "locations",
      label: `Location: ${formatOptionLabels(LOCATION_OPTIONS, filters.locations)}`,
    });
  if (filters.verification !== "all")
    tags.push({
      id: "verification",
      label: `Verification: ${filters.verification === "verified" ? "Verified" : "Unverified"}`,
    });
  if (filters.visibility !== "all")
    tags.push({
      id: "visibility",
      label: `Visibility: ${filters.visibility === "hidden" ? "Hidden" : "Visible"}`,
    });
  return tags;
}

export default function ApartmentsClient({
  filters,
  apartments,
  error,
  page,
  totalCount,
  pageSize,
}: ApartmentsClientProps) {
  const router = useRouter();
  const [isNavigating, startTransition] = useTransition();
  const [search, setSearch] = useState(filters.q);
  const [draft, setDraft] = useState<PopoverDraft>(() =>
    draftFromFilters(filters),
  );
  const activeTags = buildActiveTags(filters);
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  function navigate(nextFilters: ApartmentFilters, nextPage = 1) {
    startTransition(() => {
      router.push(
        buildListHref(
          "/admin/apartments",
          apartmentFilterParams(nextFilters, nextPage),
        ),
      );
    });
  }

  function removeTags(ids: string[]) {
    const next = { ...filters, q: search };
    if (ids.includes("statuses")) next.statuses = [];
    if (ids.includes("locations")) next.locations = [];
    if (ids.includes("verification")) next.verification = "all";
    if (ids.includes("visibility")) next.visibility = "all";
    navigate(next);
  }

  return (
    <>
      <div className="space-y-3">
        <AdminFilterToolbar
          searchLabel="Search apartments or landlords"
          searchPlaceholder="Search name, landlord, or email…"
          searchValue={search}
          onSearchChange={setSearch}
          onSearchSubmit={() => navigate({ ...filters, q: search })}
          onSearchClear={() => {
            setSearch("");
            navigate({ ...filters, q: "" });
          }}
          refreshLabel="Refresh apartments"
          onRefresh={() => {
            startTransition(() => {
              router.refresh();
            });
          }}
        >
          <FilterPopover
            activeCount={activeTags.length}
            onOpen={() => setDraft(draftFromFilters(filters))}
            onReset={() => setDraft(EMPTY_DRAFT)}
            onApply={() => navigate({ ...filters, q: search, ...draft })}
          >
            <FilterPillGroup
              selectionMode="multiple"
              label="Listing status"
              options={STATUS_OPTIONS}
              value={draft.statuses}
              onChange={(statuses) =>
                setDraft((current) => ({ ...current, statuses }))
              }
            />
            <FilterPillGroup
              selectionMode="multiple"
              label="Location"
              options={LOCATION_OPTIONS}
              value={draft.locations}
              onChange={(locations) =>
                setDraft((current) => ({ ...current, locations }))
              }
            />
            <FilterPillGroup
              selectionMode="single"
              label="Verification"
              options={VERIFICATION_OPTIONS}
              value={draft.verification}
              onChange={(verification) =>
                setDraft((current) => ({ ...current, verification }))
              }
            />
            <FilterPillGroup
              selectionMode="single"
              label="Visibility"
              options={VISIBILITY_OPTIONS}
              value={draft.visibility}
              onChange={(visibility) =>
                setDraft((current) => ({ ...current, visibility }))
              }
            />
          </FilterPopover>
          <SortDropdown
            options={APARTMENT_SORT_OPTIONS}
            value={filters.sort}
            onChange={(sort) => navigate({ ...filters, q: search, sort }, page)}
          />
        </AdminFilterToolbar>

        <ActiveFilterTags
          tags={activeTags}
          onRemove={removeTags}
          onClearAll={() => removeTags(activeTags.map((tag) => tag.id))}
        />
      </div>

      <div className="space-y-5">
        {error ? (
          <p role="alert" className="text-sm text-danger">
            Unable to load apartments. Refresh and try again.
          </p>
        ) : (
          <>
            <div aria-busy={isNavigating} className="relative">
              {isNavigating ? (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-card/70">
                  <Spinner
                    size="lg"
                    color="current"
                    className="text-primary"
                    aria-label="Loading apartments"
                  />
                </div>
              ) : null}
              {apartments.length ? (
                <>
                  <ApartmentsTable
                    apartments={apartments}
                    sort={filters.sort}
                    onSortChange={(sort) =>
                      navigate({ ...filters, q: search, sort }, page)
                    }
                    onSelectApartment={(id) =>
                      router.push(`/admin/apartments/${id}`)
                    }
                  />
                  <ApartmentCardList apartments={apartments} />
                </>
              ) : (
                <ApartmentsEmptyState />
              )}
            </div>

            <AdminListFooter
              ariaLabel="Apartment pagination"
              page={page}
              totalPages={totalPages}
              onPageChange={(nextPage) => navigate(filters, nextPage)}
              summary={formatResultRange(
                page,
                pageSize,
                totalCount,
                "apartments",
              )}
            />
          </>
        )}
      </div>
    </>
  );
}
