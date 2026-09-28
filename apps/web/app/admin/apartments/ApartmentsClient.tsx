"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { IconRefresh } from "@tabler/icons-react";
import {
  Button,
  Label,
  ListBox,
  Pagination,
  SearchField,
  Select,
  Spinner,
} from "@heroui/react";
import ApartmentsTable from "./components/ApartmentsTable";
import ApartmentCardList from "./components/ApartmentCardList";
import type { AdminApartment } from "./lib/apartment-display";

interface ApartmentFilters {
  q: string;
  status: string[];
  verification: string;
  visibility: string;
}

interface ApartmentsClientProps {
  filters: ApartmentFilters;
  apartments: AdminApartment[];
  error: boolean;
  page: number;
  totalCount: number;
  pageSize: number;
}

const STATUS_OPTIONS = [
  { id: "available", label: "Available" },
  { id: "occupied", label: "Occupied" },
  { id: "under_maintenance", label: "Under maintenance" },
  { id: "unverified", label: "Unverified" },
];

const VERIFICATION_OPTIONS = [
  { id: "all", label: "All verification statuses" },
  { id: "verified", label: "Verified" },
  { id: "unverified", label: "Unverified" },
];

const VISIBILITY_OPTIONS = [
  { id: "all", label: "All visibility" },
  { id: "visible", label: "Visible" },
  { id: "hidden", label: "Hidden" },
];

const TRIGGER_FOCUS_CLASSES =
  "focus:border-primary focus:ring-2 focus:ring-primary/15 data-[focus-visible=true]:border-primary aria-expanded:border-primary aria-expanded:ring-2 aria-expanded:ring-primary/15";

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
  const [statuses, setStatuses] = useState<string[]>(filters.status);
  const [verification, setVerification] = useState(
    filters.verification || "all",
  );
  const [visibility, setVisibility] = useState(filters.visibility || "all");
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const firstVisiblePage = Math.max(1, Math.min(page - 2, totalPages - 4));
  const visiblePages = Array.from(
    { length: Math.min(5, totalPages) },
    (_, index) => firstVisiblePage + index,
  );

  function currentFilters(nextSearch: string): ApartmentFilters {
    return {
      q: nextSearch,
      status: statuses,
      verification: verification === "all" ? "" : verification,
      visibility: visibility === "all" ? "" : visibility,
    };
  }

  function navigate(nextFilters: ApartmentFilters, nextPage: number) {
    const params = new URLSearchParams();
    if (nextFilters.q.trim()) params.set("q", nextFilters.q.trim());
    if (nextFilters.status.length)
      params.set("status", nextFilters.status.join(","));
    if (nextFilters.verification)
      params.set("verification", nextFilters.verification);
    if (nextFilters.visibility) params.set("visibility", nextFilters.visibility);
    params.set("page", String(nextPage));
    startTransition(() => {
      router.push(`/admin/apartments?${params.toString()}`);
    });
  }

  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    navigate(currentFilters(search), 1);
  }

  function changePage(nextPage: number) {
    navigate(
      {
        q: filters.q,
        status: filters.status,
        verification: filters.verification,
        visibility: filters.visibility,
      },
      nextPage,
    );
  }

  return (
    <>
    <form onSubmit={applyFilters} className="flex flex-wrap items-end gap-3">
      <SearchField
        name="q"
        value={search}
        onChange={setSearch}
        onClear={() => {
          setSearch("");
          navigate(currentFilters(""), 1);
        }}
        className="w-full sm:w-80"
      >
        <Label>Search apartments or landlords</Label>
        <SearchField.Group className="border border-border bg-card shadow-none focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15">
          <SearchField.SearchIcon className="text-muted-foreground" />
          <SearchField.Input placeholder="Search name, landlord, or email…" />
          <SearchField.ClearButton className="text-white" />
        </SearchField.Group>
      </SearchField>
      <Button
        isIconOnly
        variant="tertiary"
        aria-label="Refresh apartments"
        onPress={() => {
          startTransition(() => {
            router.refresh();
          });
        }}
      >
        <IconRefresh size={18} aria-hidden="true" />
      </Button>

      <div className="ml-auto flex flex-wrap items-end gap-3">
        <Select
          className="w-full sm:w-60"
          selectionMode="multiple"
          value={statuses}
          onChange={(value) => {
            setStatuses(Array.isArray(value) ? value.map(String) : []);
          }}
          placeholder="All listing statuses"
        >
          <Label>Listing status</Label>
          <Select.Trigger className={TRIGGER_FOCUS_CLASSES}>
            <Select.Value className="min-w-0 truncate" />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox selectionMode="multiple">
              {STATUS_OPTIONS.map((option) => (
                <ListBox.Item
                  key={option.id}
                  id={option.id}
                  textValue={option.label}
                >
                  {option.label}
                  <ListBox.ItemIndicator />
                </ListBox.Item>
              ))}
            </ListBox>
          </Select.Popover>
        </Select>

        <Select
          className="w-full sm:w-60"
          value={verification}
          onChange={(key) => setVerification(key ? String(key) : "all")}
          placeholder="Select a status"
        >
          <Label>Verification status</Label>
          <Select.Trigger className={TRIGGER_FOCUS_CLASSES}>
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              {VERIFICATION_OPTIONS.map((option) => (
                <ListBox.Item
                  key={option.id}
                  id={option.id}
                  textValue={option.label}
                >
                  {option.label}
                  <ListBox.ItemIndicator />
                </ListBox.Item>
              ))}
            </ListBox>
          </Select.Popover>
        </Select>

        <Select
          className="w-full sm:w-48"
          value={visibility}
          onChange={(key) => setVisibility(key ? String(key) : "all")}
          placeholder="Select visibility"
        >
          <Label>Visibility</Label>
          <Select.Trigger className={TRIGGER_FOCUS_CLASSES}>
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              {VISIBILITY_OPTIONS.map((option) => (
                <ListBox.Item
                  key={option.id}
                  id={option.id}
                  textValue={option.label}
                >
                  {option.label}
                  <ListBox.ItemIndicator />
                </ListBox.Item>
              ))}
            </ListBox>
          </Select.Popover>
        </Select>

        <Button type="submit" variant="primary">
          Apply
        </Button>
      </div>
    </form>

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
                  onSelectApartment={(id) =>
                    router.push(`/admin/apartments/${id}`)
                  }
                />
                <ApartmentCardList apartments={apartments} />
              </>
            ) : (
              <p className="py-12 text-center text-sm text-muted-foreground">
                No apartments match these filters.
              </p>
            )}
          </div>

          <nav aria-label="Apartment pagination" className="flex justify-center">
            <Pagination>
              <Pagination.Content>
                <Pagination.Item>
                  <Pagination.Previous
                    isDisabled={page <= 1}
                    onPress={() => changePage(page - 1)}
                    className="font-nunito text-primary"
                  >
                    <Pagination.PreviousIcon />
                    <span>Previous</span>
                  </Pagination.Previous>
                </Pagination.Item>
                {visiblePages.map((number) => (
                  <Pagination.Item key={number}>
                    <Pagination.Link
                      isActive={number === page}
                      onPress={() => changePage(number)}
                    >
                      {number}
                    </Pagination.Link>
                  </Pagination.Item>
                ))}
                <Pagination.Item>
                  <Pagination.Next
                    isDisabled={page >= totalPages}
                    onPress={() => changePage(page + 1)}
                    className="font-nunito text-primary"
                  >
                    <span>Next</span>
                    <Pagination.NextIcon />
                  </Pagination.Next>
                </Pagination.Item>
              </Pagination.Content>
            </Pagination>
          </nav>
        </>
      )}
    </div>
    </>
  );
}
