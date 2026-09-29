"use client";

import { useRouter } from "next/navigation";
import { Chip, Table } from "@heroui/react";
import VerificationImage from "./VerificationImage";
import {
  submittedFormatter,
  type VerificationRow,
} from "../lib/verification-display";

interface VerificationTableProps {
  rows: VerificationRow[];
  selected: "users" | "apartments";
}

export default function VerificationTable({
  rows,
  selected,
}: VerificationTableProps) {
  const router = useRouter();
  const review = (id: string) =>
    router.push(`/admin/verification/${selected}/${id}`);
  return (
    <div className="hidden md:block">
      <Table>
        <Table.ScrollContainer>
          <Table.Content
            aria-label="Pending verification requests"
            onRowAction={(key) => {
              const row = rows.find((item) => item.id === String(key));
              if (row) {
                review(row.id);
              }
            }}
          >
            <Table.Header className="text-foreground! [&_th]:text-foreground!">
              <Table.Column isRowHeader>Submission</Table.Column>
              <Table.Column>Submitted</Table.Column>
              <Table.Column>Status</Table.Column>
            </Table.Header>
            <Table.Body>
              {rows.map((row) => (
                <Table.Row
                  key={row.id}
                  id={row.id}
                  onClick={() => review(row.id)}
                  className="cursor-pointer hover:bg-primary/10 data-[focus-visible=true]:outline-2 data-[focus-visible=true]:outline-primary"
                >
                  <Table.Cell>
                    <div className="flex items-center gap-3">
                      <VerificationImage
                        kind={selected}
                        image={row.image}
                        name={row.label}
                      />
                      <div className="min-w-0">
                        <p className="font-nunito text-sm font-bold">
                          {row.label}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {row.detail}
                        </p>
                      </div>
                    </div>
                  </Table.Cell>
                  <Table.Cell className="whitespace-nowrap text-sm text-muted-foreground">
                    {submittedFormatter.format(new Date(row.submittedAt))}
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
  );
}
