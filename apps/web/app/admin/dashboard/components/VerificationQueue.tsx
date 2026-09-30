"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Chip, Table, Tabs } from "@heroui/react";
import { IconBuilding, IconChevronRight } from "@tabler/icons-react";
import type { VerificationRequest } from "../lib/get-dashboard-data";
import SharedUserAvatar from "@/app/components/profile/UserAvatar";

interface VerificationQueueProps {
  requests: VerificationRequest[];
}

function RequestImage({ request }: { request: VerificationRequest }) {
  if (request.kind === "apartments") {
    return request.image ? (
      <Image
        src={request.image}
        alt=""
        unoptimized
        className="size-11 shrink-0 rounded-lg object-cover"
        width={44}
        height={44}
      />
    ) : (
      <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <IconBuilding size={20} aria-hidden="true" />
      </span>
    );
  }
  return (
    <SharedUserAvatar
      src={request.image}
      initials={request.name
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join("")}
      alt={request.name}
      size="sm"
      className="shrink-0 bg-primary/10 text-primary"
      fallbackClassName="bg-primary/10 text-primary"
    />
  );
}

export default function VerificationQueue({
  requests,
}: VerificationQueueProps) {
  const router = useRouter();
  const [filter, setFilter] = useState<"all" | "users" | "apartments">("all");
  const filtered = requests
    .filter((request) => filter === "all" || request.kind === filter)
    .slice(0, 8);
  const date = (value: string) =>
    new Intl.DateTimeFormat("en-PH", {
      dateStyle: "medium",
      timeZone: "Asia/Manila",
    }).format(new Date(value));
  const role = (value: string | null) =>
    value ? `${value[0].toUpperCase()}${value.slice(1)}` : "—";
  const reviewRequest = (request: VerificationRequest) => {
    router.push(`/admin/verification/${request.kind}/${request.id}`);
  };

  return (
    <section
      className="flex h-full min-w-0 flex-col rounded-3xl border border-border bg-card p-4 sm:p-5"
      aria-labelledby="verification-heading"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2
            id="verification-heading"
            className="font-nunito text-lg font-bold"
          >
            Latest verification requests
          </h2>
          <p className="text-sm text-muted-foreground">
            Pending reviews from accounts and apartments · newest first
          </p>
        </div>
        <Link
          href="/admin/verification"
          className="rounded-md text-sm font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          View all
        </Link>
      </div>
      <Tabs
        selectedKey={filter}
        onSelectionChange={(key) =>
          setFilter(key as "all" | "users" | "apartments")
        }
        className="mt-4 w-fit"
      >
        <Tabs.ListContainer className="w-fit">
          <Tabs.List
            aria-label="Filter verification requests"
            className="w-fit *:text-muted-foreground"
          >
            {(
              [
                ["all", "All"],
                ["users", "Users"],
                ["apartments", "Apartments"],
              ] as const
            ).map(([value, label]) => (
              <Tabs.Tab
                key={value}
                id={value}
                className="text-xs data-[selected=true]:text-primary"
              >
                {label}
                <Tabs.Indicator />
              </Tabs.Tab>
            ))}
          </Tabs.List>
        </Tabs.ListContainer>
      </Tabs>
      {filtered.length ? (
        <>
          <div className="mt-4 hidden min-h-0 flex-1 md:flex">
            <Table className="h-full w-full">
              <Table.ScrollContainer className="h-full">
                <Table.Content
                  aria-label="Latest pending verification requests"
                  onRowAction={(key) => {
                    const request = filtered.find(
                      (item) => `${item.kind}-${item.id}` === String(key),
                    );
                    if (request) {
                      reviewRequest(request);
                    }
                  }}
                >
                  <Table.Header className="text-foreground! [&_th]:text-foreground!">
                    <Table.Column isRowHeader>Request</Table.Column>
                    <Table.Column>Type</Table.Column>
                    <Table.Column>Role</Table.Column>
                    <Table.Column>Submitted</Table.Column>
                    <Table.Column>Status</Table.Column>
                  </Table.Header>
                  <Table.Body>
                    {filtered.map((request) => (
                      <Table.Row
                        key={`${request.kind}-${request.id}`}
                        id={`${request.kind}-${request.id}`}
                        onClick={() => reviewRequest(request)}
                        className="cursor-pointer hover:bg-primary/10 data-[focus-visible=true]:outline-2 data-[focus-visible=true]:outline-primary"
                      >
                        <Table.Cell>
                          <div className="flex items-center gap-3">
                            <RequestImage request={request} />
                            <div className="min-w-0">
                              <p className="max-w-48 truncate font-nunito text-sm font-bold">
                                {request.name}
                              </p>
                              <p className="max-w-48 truncate text-xs text-muted-foreground">
                                {request.detail}
                              </p>
                            </div>
                          </div>
                        </Table.Cell>
                        <Table.Cell className="text-sm">
                          {request.kind === "users" ? "User" : "Apartment"}
                        </Table.Cell>
                        <Table.Cell className="text-sm">
                          {role(request.role)}
                        </Table.Cell>
                        <Table.Cell className="whitespace-nowrap text-sm text-muted-foreground">
                          {date(request.submittedAt)}
                        </Table.Cell>
                        <Table.Cell>
                          <Chip size="sm" variant="soft" color="warning">
                            Pending
                          </Chip>
                        </Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Content>
              </Table.ScrollContainer>
            </Table>
          </div>
          <ul className="mt-4 space-y-2 md:hidden">
            {filtered.map((request) => (
              <li key={`${request.kind}-${request.id}`}>
                <Link
                  href={`/admin/verification/${request.kind}/${request.id}`}
                  className="block rounded-xl border border-border p-3 hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <div className="flex items-center gap-3">
                    <RequestImage request={request} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-nunito font-bold">
                        {request.name}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {request.detail}
                      </p>
                    </div>
                    <IconChevronRight
                      size={18}
                      className="shrink-0 text-primary"
                      aria-hidden="true"
                    />
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                    <span>
                      {request.kind === "users" ? "User" : "Apartment"} ·{" "}
                      {date(request.submittedAt)}
                    </span>
                    <Chip size="sm" variant="soft" color="warning">
                      Pending
                    </Chip>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="py-12 text-center text-sm text-muted-foreground">
          No pending {filter === "all" ? "" : `${filter} `}verification
          requests.
        </p>
      )}
    </section>
  );
}
