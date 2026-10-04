"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { IconRefresh, IconUsers } from "@tabler/icons-react";
import {
  Button,
  Label,
  ListBox,
  Pagination,
  SearchField,
  Select,
  Spinner,
} from "@heroui/react";
import UsersTable from "./components/UsersTable";
import UserCardList from "./components/UserCardList";
import UsersEmptyState from "./components/UsersEmptyState";
import type { AdminUser } from "./lib/user-display";

interface UserFilters {
  q: string;
  role: string[];
  verification: string;
}

interface UsersClientProps {
  users: AdminUser[];
  error: boolean;
  filters: UserFilters;
  page: number;
  totalCount: number;
  pageSize: number;
}

const ROLE_OPTIONS = [
  { id: "tenant", label: "Tenant" },
  { id: "landlord", label: "Landlord" },
  { id: "admin", label: "Administrator" },
];

const VERIFICATION_OPTIONS = [
  { id: "all", label: "All verification statuses" },
  { id: "unverified", label: "Unverified" },
  { id: "pending", label: "Pending" },
  { id: "verified", label: "Verified" },
  { id: "rejected", label: "Rejected" },
];

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
  const [roles, setRoles] = useState<string[]>(filters.role);
  const [verification, setVerification] = useState(
    filters.verification || "all",
  );
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const firstVisiblePage = Math.max(1, Math.min(page - 2, totalPages - 4));
  const visiblePages = Array.from(
    { length: Math.min(5, totalPages) },
    (_, index) => firstVisiblePage + index,
  );

  function navigate(nextFilters: UserFilters, nextPage: number) {
    const params = new URLSearchParams();
    if (nextFilters.q.trim()) params.set("q", nextFilters.q.trim());
    if (nextFilters.role.length) params.set("role", nextFilters.role.join(","));
    if (nextFilters.verification)
      params.set("verification", nextFilters.verification);
    params.set("page", String(nextPage));
    startTransition(() => {
      router.push(`/admin/users?${params.toString()}`);
    });
  }

  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    navigate(
      {
        q: search,
        role: roles,
        verification: verification === "all" ? "" : verification,
      },
      1,
    );
  }

  function changePage(nextPage: number) {
    navigate(filters, nextPage);
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

      <form onSubmit={applyFilters} className="flex flex-wrap items-end gap-3">
        <SearchField
          name="q"
          value={search}
          onChange={setSearch}
          onClear={() => {
            setSearch("");
            navigate(
              {
                q: "",
                role: roles,
                verification: verification === "all" ? "" : verification,
              },
              1,
            );
          }}
          className="w-full sm:w-80"
        >
          <Label>Search users</Label>
          <SearchField.Group className="border border-border bg-card shadow-none focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15">
            <SearchField.SearchIcon className="text-muted-foreground" />
            <SearchField.Input placeholder="Search name or email…" />
            <SearchField.ClearButton className="text-white" />
          </SearchField.Group>
        </SearchField>
        <Button
          isIconOnly
          variant="tertiary"
          aria-label="Refresh users"
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
            value={roles}
            onChange={(value) => {
              setRoles(Array.isArray(value) ? value.map(String) : []);
            }}
            placeholder="All roles"
          >
            <Label>Role</Label>
            <Select.Trigger className="bg-card! text-foreground! focus:border-primary focus:ring-2 focus:ring-primary/15 data-[focus-visible=true]:border-primary aria-expanded:border-primary aria-expanded:ring-2 aria-expanded:ring-primary/15">
              <Select.Value className="min-w-0 truncate" />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
              <ListBox selectionMode="multiple">
                {ROLE_OPTIONS.map((option) => (
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
            <Select.Trigger className="bg-card! text-foreground! focus:border-primary focus:ring-2 focus:ring-primary/15 data-[focus-visible=true]:border-primary aria-expanded:border-primary aria-expanded:ring-2 aria-expanded:ring-primary/15">
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

          <Button type="submit" variant="primary">
            Apply
          </Button>
        </div>
      </form>

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
                  onSelectUser={(id) => router.push(`/admin/users/${id}`)}
                />
                <UserCardList users={users} />
              </>
            ) : (
              <UsersEmptyState />
            )}
          </div>

          <nav aria-label="User pagination" className="flex justify-center">
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
  );
}
