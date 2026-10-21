"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IconUsers } from "@tabler/icons-react";
import {
  formatOptionLabels,
  formatResultRange,
  type JoinedPreset,
} from "@/lib/admin-filters";
import AdminFilterToolbar from "../_components/filters/AdminFilterToolbar";
import ActiveFilterTags from "../_components/filters/ActiveFilterTags";
import AdminListFooter from "../_components/filters/AdminListFooter";
import DateRangeFilter, {
  DATE_PRESET_OPTIONS,
  type IsoDateRange,
} from "../_components/filters/DateRangeFilter";
import FilterPillGroup from "../_components/filters/FilterPillGroup";
import FilterPopover from "../_components/filters/FilterPopover";
import PendingList from "../_components/filters/PendingList";
import SortDropdown from "../_components/filters/SortDropdown";
import type { ActiveFilterTag } from "../_components/filters/types";
import { useListFilters } from "../_components/filters/use-list-filters";
import UsersTable from "./components/UsersTable";
import UserCardList from "./components/UserCardList";
import UsersEmptyState from "./components/UsersEmptyState";
import type { AdminUser } from "./lib/user-display";
import {
  ACCESS_OPTIONS,
  ROLE_OPTIONS,
  USER_SORT_OPTIONS,
  VERIFICATION_OPTIONS,
  userFilterParams,
  type AccessFilter,
  type UserFilters,
  type UserRole,
  type VerificationStatus,
} from "./lib/user-filters";

interface UsersClientProps {
  users: AdminUser[];
  error: boolean;
  filters: UserFilters;
  page: number;
  totalCount: number;
  pageSize: number;
}

interface PopoverDraft {
  verifications: VerificationStatus[];
  roles: UserRole[];
  access: AccessFilter;
  joined: JoinedPreset;
  range: IsoDateRange | null;
}

const EMPTY_DRAFT: PopoverDraft = {
  verifications: [],
  roles: [],
  access: "all",
  joined: "any",
  range: null,
};

const shortDateFormatter = new Intl.DateTimeFormat("en-PH", {
  dateStyle: "medium",
  timeZone: "UTC",
});

function draftFromFilters(filters: UserFilters): PopoverDraft {
  return {
    verifications: filters.verifications,
    roles: filters.roles,
    access: filters.access,
    joined: filters.joined,
    range:
      filters.from && filters.to ? { from: filters.from, to: filters.to } : null,
  };
}

function formatIsoDate(value: string) {
  return shortDateFormatter.format(new Date(`${value}T00:00:00Z`));
}

function joinedTagLabel(filters: UserFilters) {
  if (filters.joined === "custom" && filters.from && filters.to)
    return `Joined: ${formatIsoDate(filters.from)} – ${formatIsoDate(filters.to)}`;
  const preset = DATE_PRESET_OPTIONS.find(
    (option) => option.id === filters.joined,
  );
  return `Joined: ${preset?.label.toLowerCase() ?? filters.joined}`;
}

function buildActiveTags(filters: UserFilters): ActiveFilterTag[] {
  const tags: ActiveFilterTag[] = [];
  if (filters.verifications.length)
    tags.push({
      id: "verifications",
      label: `Verification: ${formatOptionLabels(VERIFICATION_OPTIONS, filters.verifications)}`,
    });
  if (filters.roles.length)
    tags.push({
      id: "roles",
      label: `Role: ${formatOptionLabels(ROLE_OPTIONS, filters.roles)}`,
    });
  if (filters.access !== "all")
    tags.push({
      id: "access",
      label: `Access: ${filters.access === "suspended" ? "Suspended" : "Active"}`,
    });
  if (filters.joined !== "any")
    tags.push({ id: "joined", label: joinedTagLabel(filters) });
  return tags;
}

export default function UsersClient({
  users,
  error,
  filters: appliedFilters,
  page: appliedPage,
  totalCount,
  pageSize,
}: UsersClientProps) {
  const router = useRouter();
  const list = useListFilters({
    pathname: "/admin/users",
    filters: appliedFilters,
    page: appliedPage,
    toParams: userFilterParams,
  });
  const { filters, page } = list;
  const [draft, setDraft] = useState<PopoverDraft>(() =>
    draftFromFilters(filters),
  );
  const activeTags = buildActiveTags(filters);
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  function applyDraft(nextDraft: PopoverDraft) {
    const range = nextDraft.joined === "custom" ? nextDraft.range : null;
    list.apply({
      verifications: nextDraft.verifications,
      roles: nextDraft.roles,
      access: nextDraft.access,
      // An unfinished custom range applies as "any time" instead of failing.
      joined: nextDraft.joined === "custom" && !range ? "any" : nextDraft.joined,
      from: range?.from ?? null,
      to: range?.to ?? null,
    });
  }

  function removeTags(ids: string[]) {
    const patch: Partial<UserFilters> = {};
    if (ids.includes("verifications")) patch.verifications = [];
    if (ids.includes("roles")) patch.roles = [];
    if (ids.includes("access")) patch.access = "all";
    if (ids.includes("joined")) {
      patch.joined = "any";
      patch.from = null;
      patch.to = null;
    }
    list.apply(patch);
  }

  return (
    <div className="w-full space-y-5 p-4">
      <div>
        <h1 className="flex items-center gap-2 font-nunito text-3xl text-primary font-bold">
          <div className="flex size-11 items-center justify-center rounded-lg bg-primary/10">
            <IconUsers size={28} className="text-primary" aria-hidden="true" />
          </div>
          Users
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Search tenant, landlord, and administrator accounts.
        </p>
      </div>

      <div className="space-y-3">
        <AdminFilterToolbar
          searchLabel="Search users"
          searchPlaceholder="Search name or email…"
          searchValue={list.search}
          onSearchChange={list.changeSearch}
          onSearchSubmit={list.submitSearch}
          onSearchClear={list.clearSearch}
          refreshLabel="Refresh users"
          onRefresh={list.refresh}
        >
          <FilterPopover
            activeCount={activeTags.length}
            onOpen={() => setDraft(draftFromFilters(filters))}
            onReset={() => setDraft(EMPTY_DRAFT)}
            onApply={() => applyDraft(draft)}
          >
            <FilterPillGroup
              selectionMode="multiple"
              label="Verification status"
              options={VERIFICATION_OPTIONS}
              value={draft.verifications}
              onChange={(verifications) =>
                setDraft((current) => ({ ...current, verifications }))
              }
            />
            <FilterPillGroup
              selectionMode="multiple"
              label="Role"
              options={ROLE_OPTIONS}
              value={draft.roles}
              onChange={(roles) => setDraft((current) => ({ ...current, roles }))}
            />
            <FilterPillGroup
              selectionMode="single"
              label="Account access"
              options={ACCESS_OPTIONS}
              value={draft.access}
              onChange={(access) =>
                setDraft((current) => ({ ...current, access }))
              }
            />
            <DateRangeFilter
              label="Joined"
              preset={draft.joined}
              onPresetChange={(joined) =>
                setDraft((current) => ({ ...current, joined }))
              }
              range={draft.range}
              onRangeChange={(range) =>
                setDraft((current) => ({ ...current, range }))
              }
            />
          </FilterPopover>
          <SortDropdown
            options={USER_SORT_OPTIONS}
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

      {error ? (
        <p role="alert" className="text-sm text-danger">
          Unable to load users. Refresh and try again.
        </p>
      ) : (
        <>
          <PendingList isPending={list.isPending} label="Loading users">
            {users.length ? (
              <>
                <UsersTable
                  users={users}
                  sort={filters.sort}
                  onSortChange={(sort) => list.apply({ sort })}
                  onSelectUser={(id) => router.push(`/admin/users/${id}`)}
                />
                <UserCardList users={users} />
              </>
            ) : (
              <UsersEmptyState />
            )}
          </PendingList>

          <AdminListFooter
            ariaLabel="User pagination"
            page={page}
            totalPages={totalPages}
            onPageChange={list.goToPage}
            summary={formatResultRange(page, pageSize, totalCount, "users")}
          />
        </>
      )}
    </div>
  );
}
