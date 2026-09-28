"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { IconUsers } from "@tabler/icons-react";
import {
  Avatar,
  Button,
  Label,
  ListBox,
  Pagination,
  SearchField,
  Select,
  Spinner,
  Table,
} from "@heroui/react";

export interface AdminUser {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  avatar_url: string | null;
  roles: string[];
  account_status: string;
  created_at: string;
}

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

function getUserName(user: AdminUser) {
  return (
    `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim() || "Unnamed user"
  );
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
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
    if (nextFilters.role.length)
      params.set("role", nextFilters.role.join(","));
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
            <Select.Trigger className="focus:border-primary focus:ring-2 focus:ring-primary/15 data-[focus-visible=true]:border-primary aria-expanded:border-primary aria-expanded:ring-2 aria-expanded:ring-primary/15">
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
            <Select.Trigger className="focus:border-primary focus:ring-2 focus:ring-primary/15 data-[focus-visible=true]:border-primary aria-expanded:border-primary aria-expanded:ring-2 aria-expanded:ring-primary/15">
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
          <div
            aria-busy={isNavigating}
            className="relative overflow-hidden rounded-xl border border-border bg-card"
          >
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
            <Table className="bg-card">
              <Table.ScrollContainer>
                <Table.Content aria-label="Users" className="bg-card">
                  <Table.Header className="bg-muted text-[11px] uppercase tracking-wider text-muted-foreground">
                    <Table.Column isRowHeader>User</Table.Column>
                    <Table.Column>Role</Table.Column>
                    <Table.Column>Verification</Table.Column>
                    <Table.Column>Access</Table.Column>
                    <Table.Column>
                      <span className="sr-only">Details</span>
                    </Table.Column>
                  </Table.Header>
                  <Table.Body>
                    {users.length ? (
                      users.map((user) => {
                        const name = getUserName(user);
                        return (
                          <Table.Row key={user.id} id={user.id}>
                            <Table.Cell>
                              <div className="flex items-center gap-3">
                                <Avatar
                                  size="sm"
                                  className="shrink-0 bg-primary/10 text-primary"
                                >
                                  {user.avatar_url ? (
                                    <Avatar.Image
                                      src={user.avatar_url}
                                      alt=""
                                    />
                                  ) : null}
                                  <Avatar.Fallback className="bg-primary/10 text-primary">
                                    {getInitials(name)}
                                  </Avatar.Fallback>
                                </Avatar>
                                <div className="min-w-0">
                                  <p className="font-medium">{name}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {user.email}
                                  </p>
                                </div>
                              </div>
                            </Table.Cell>
                            <Table.Cell className="capitalize">
                              {user.roles.join(", ")}
                            </Table.Cell>
                            <Table.Cell className="capitalize">
                              {user.account_status}
                            </Table.Cell>
                            <Table.Cell>Active</Table.Cell>
                            <Table.Cell>
                              <Button
                                variant="tertiary"
                                size="sm"
                                onPress={() =>
                                  router.push(`/admin/users/${user.id}`)
                                }
                                aria-label={`View ${name}`}
                              >
                                View
                              </Button>
                            </Table.Cell>
                          </Table.Row>
                        );
                      })
                    ) : (
                      <Table.Row id="empty">
                        <Table.Cell
                          colSpan={5}
                          className="py-8 text-center text-muted-foreground"
                        >
                          No users match these filters.
                        </Table.Cell>
                      </Table.Row>
                    )}
                  </Table.Body>
                </Table.Content>
              </Table.ScrollContainer>
            </Table>
          </div>

          <nav aria-label="User pagination" className="flex justify-center">
            <Pagination>
              <Pagination.Content>
                <Pagination.Item>
                  <Pagination.Previous
                    isDisabled={page <= 1}
                    onPress={() => changePage(page - 1)}
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
