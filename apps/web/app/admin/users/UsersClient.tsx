"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { IconUsers } from "@tabler/icons-react";
import { Spinner } from "@heroui/react";
import {
  buildListHref,
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
import SortDropdown from "../_components/filters/SortDropdown";
import type { ActiveFilterTag } from "../_components/filters/types";
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
  filters,
  page,
  totalCount,
  pageSize,
}: UsersClientProps) {
  const router = useRouter();
  const [isNavigating, startTransition] = useTransition();
  const [search, setSearch] = useState(filters.q);
  const [draft, setDraft] = useState<PopoverDraft>(() =>
    draftFromFilters(filters),
  );
  const activeTags = buildActiveTags(filters);
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  function navigate(nextFilters: UserFilters, nextPage = 1) {
    startTransition(() => {
      router.push(
        buildListHref("/admin/users", userFilterParams(nextFilters, nextPage)),
      );
    });
  }

  function applyDraft(nextDraft: PopoverDraft) {
    const range = nextDraft.joined === "custom" ? nextDraft.range : null;
    navigate({
      ...filters,
      q: search,
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
    const next = { ...filters, q: search };
    if (ids.includes("verifications")) next.verifications = [];
    if (ids.includes("roles")) next.roles = [];
    if (ids.includes("access")) next.access = "all";
    if (ids.includes("joined")) {
      next.joined = "any";
      next.from = null;
      next.to = null;
    }
    navigate(next);
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 p-4">
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
          searchValue={search}
          onSearchChange={setSearch}
          onSearchSubmit={() => navigate({ ...filters, q: search })}
          onSearchClear={() => {
            setSearch("");
            navigate({ ...filters, q: "" });
          }}
          refreshLabel="Refresh users"
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
            onChange={(sort) => navigate({ ...filters, q: search, sort }, page)}
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
          <div aria-busy={isNavigating} className="relative">
            {isNavigating ? (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-card/70">
                <Spinner
                  size="lg"
                  color="current"
                  className="text-primary"
                  aria-label="Loading users"
                />
              </div>
            ) : null}
            {users.length ? (
              <>
                <UsersTable
                  users={users}
                  sort={filters.sort}
                  onSortChange={(sort) =>
                    navigate({ ...filters, q: search, sort }, page)
                  }
                  onSelectUser={(id) => router.push(`/admin/users/${id}`)}
                />
                <UserCardList users={users} />
              </>
            ) : (
              <UsersEmptyState />
            )}
          </div>

          <AdminListFooter
            ariaLabel="User pagination"
            page={page}
            totalPages={totalPages}
            onPageChange={(nextPage) => navigate(filters, nextPage)}
            summary={formatResultRange(page, pageSize, totalCount, "users")}
          />
        </>
      )}
    </div>
  );
}
