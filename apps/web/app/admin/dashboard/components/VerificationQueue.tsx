"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Avatar, Button, Chip, Table } from "@heroui/react";
import { Building2, ChevronRight } from "lucide-react";
import type { VerificationRequest } from "../lib/get-dashboard-data";

interface VerificationQueueProps {
  requests: VerificationRequest[];
}

function RequestImage({ request }: { request: VerificationRequest }) {
  if (request.kind === "apartments") {
    return request.image ? (
      <Image src={request.image} alt="" unoptimized className="size-11 shrink-0 rounded-lg object-cover" width={44} height={44} />
    ) : (
      <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><Building2 size={20} aria-hidden="true" /></span>
    );
  }
  return (
    <Avatar size="sm" className="shrink-0 bg-primary/10 text-primary">
      {request.image ? <Avatar.Image src={request.image} alt="" /> : null}
      <Avatar.Fallback className="bg-primary/10 text-primary">{request.name.split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("")}</Avatar.Fallback>
    </Avatar>
  );
}

export default function VerificationQueue({ requests }: VerificationQueueProps) {
  const [filter, setFilter] = useState<"all" | "users" | "apartments">("all");
  const filtered = requests.filter((request) => filter === "all" || request.kind === filter).slice(0, 8);
  const date = (value: string) => new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeZone: "Asia/Manila" }).format(new Date(value));

  return (
    <section className="min-w-0 rounded-xl border border-border bg-card p-4 sm:p-5" aria-labelledby="verification-heading">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="verification-heading" className="font-nunito text-lg font-bold">Latest verification requests</h2>
          <p className="text-sm text-muted-foreground">Pending reviews from accounts and apartments · newest first</p>
        </div>
        <Link href="/admin/verification" className="rounded-md text-sm font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">View all</Link>
      </div>
      <div className="mt-4 flex gap-2" role="group" aria-label="Filter verification requests">
        {([ ["all", "All"], ["users", "Users"], ["apartments", "Apartments"] ] as const).map(([value, label]) => (
          <Button key={value} size="sm" variant={filter === value ? "primary" : "tertiary"} onPress={() => setFilter(value)} aria-pressed={filter === value}>
            {label}
          </Button>
        ))}
      </div>
      {filtered.length ? (
        <>
          <div className="mt-4 hidden md:block">
            <Table>
              <Table.ScrollContainer>
                <Table.Content aria-label="Latest pending verification requests">
                  <Table.Header>
                    <Table.Column isRowHeader>Request</Table.Column>
                    <Table.Column>Type</Table.Column>
                    <Table.Column>Submitted</Table.Column>
                    <Table.Column>Status</Table.Column>
                    <Table.Column><span className="sr-only">Action</span></Table.Column>
                  </Table.Header>
                  <Table.Body>
                    {filtered.map((request) => (
                      <Table.Row key={`${request.kind}-${request.id}`} id={`${request.kind}-${request.id}`} className="hover:bg-primary/5">
                        <Table.Cell><div className="flex items-center gap-3"><RequestImage request={request} /><div className="min-w-0"><p className="max-w-48 truncate font-nunito text-sm font-bold">{request.name}</p><p className="max-w-48 truncate text-xs text-muted-foreground">{request.detail}</p></div></div></Table.Cell>
                        <Table.Cell className="text-sm">{request.kind === "users" ? "User" : "Apartment"}</Table.Cell>
                        <Table.Cell className="whitespace-nowrap text-sm text-muted-foreground">{date(request.submittedAt)}</Table.Cell>
                        <Table.Cell><Chip size="sm" variant="soft" color="warning">Pending</Chip></Table.Cell>
                        <Table.Cell><Link href={`/admin/verification/${request.kind}/${request.id}`} className="font-nunito text-sm font-bold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">Review</Link></Table.Cell>
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
                <Link href={`/admin/verification/${request.kind}/${request.id}`} className="block rounded-xl border border-border p-3 hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                  <div className="flex items-center gap-3"><RequestImage request={request} /><div className="min-w-0 flex-1"><p className="truncate font-nunito font-bold">{request.name}</p><p className="truncate text-xs text-muted-foreground">{request.detail}</p></div><ChevronRight size={18} className="shrink-0 text-primary" aria-hidden="true" /></div>
                  <div className="mt-3 flex items-center justify-between gap-2 text-xs text-muted-foreground"><span>{request.kind === "users" ? "User" : "Apartment"} · {date(request.submittedAt)}</span><Chip size="sm" variant="soft" color="warning">Pending</Chip></div>
                </Link>
              </li>
            ))}
          </ul>
        </>
      ) : <p className="py-12 text-center text-sm text-muted-foreground">No pending {filter === "all" ? "" : `${filter} `}verification requests.</p>}
    </section>
  );
}
