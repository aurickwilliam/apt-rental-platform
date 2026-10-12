"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatOptionLabels, formatResultRange } from "@/lib/admin-filters";
import AdminFilterToolbar from "../_components/filters/AdminFilterToolbar";
import ActiveFilterTags from "../_components/filters/ActiveFilterTags";
import AdminListFooter from "../_components/filters/AdminListFooter";
import FilterPillGroup from "../_components/filters/FilterPillGroup";
import FilterPopover from "../_components/filters/FilterPopover";
import PendingList from "../_components/filters/PendingList";
import SortDropdown from "../_components/filters/SortDropdown";
import type { ActiveFilterTag } from "../_components/filters/types";
import { useListFilters } from "../_components/filters/use-list-filters";
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
  filters: appliedFilters,
  apartments,
  error,
  page: appliedPage,
  totalCount,
  pageSize,
}: ApartmentsClientProps) {
  const router = useRouter();
  const list = useListFilters({
    pathname: "/admin/apartments",
    filters: appliedFilters,
    page: appliedPage,
    toParams: apartmentFilterParams,
  });
  const { filters, page } = list;
  const [draft, setDraft] = useState<PopoverDraft>(() =>
    draftFromFilters(filters),
  );
  const activeTags = buildActiveTags(filters);
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  function removeTags(ids: string[]) {
    const patch: Partial<ApartmentFilters> = {};
    if (ids.includes("statuses")) patch.statuses = [];
    if (ids.includes("locations")) patch.locations = [];
    if (ids.includes("verification")) patch.verification = "all";
    if (ids.includes("visibility")) patch.visibility = "all";
    list.apply(patch);
  }

  return (
    <>
      <div className="space-y-3">
        <AdminFilterToolbar
          searchLabel="Search apartments or landlords"
          searchPlaceholder="Search name, landlord, or email…"
          searchValue={list.search}
          onSearchChange={list.changeSearch}
          onSearchSubmit={list.submitSearch}
          onSearchClear={list.clearSearch}
          refreshLabel="Refresh apartments"
          onRefresh={list.refresh}
        >
          <FilterPopover
            activeCount={activeTags.length}
            onOpen={() => setDraft(draftFromFilters(filters))}
            onReset={() => setDraft(EMPTY_DRAFT)}
            onApply={() => list.apply(draft)}
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
            onChange={(sort) => list.apply({ sort })}
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
            <PendingList
              isPending={list.isPending}
              label="Loading apartments"
            >
              {apartments.length ? (
                <>
                  <ApartmentsTable
                    apartments={apartments}
                    sort={filters.sort}
                    onSortChange={(sort) => list.apply({ sort })}
                    onSelectApartment={(id) =>
                      router.push(`/admin/apartments/${id}`)
                    }
                  />
                  <ApartmentCardList apartments={apartments} />
                </>
              ) : (
                <ApartmentsEmptyState />
              )}
            </PendingList>

            <AdminListFooter
              ariaLabel="Apartment pagination"
              page={page}
              totalPages={totalPages}
              onPageChange={list.goToPage}
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
