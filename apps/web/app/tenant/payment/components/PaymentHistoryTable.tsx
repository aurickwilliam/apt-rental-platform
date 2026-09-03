"use client";

import Link from "next/link";
import { Card, Chip, Table } from "@heroui/react";
import { Receipt } from "lucide-react";
import type { PaymentRecord } from "../types";
import { formatDateShort, formatPesoDisplay, methodLabel, paymentStatusLabel } from "../utils";

interface PaymentHistoryTableProps {
  payments: PaymentRecord[];
  limit?: number;
  showHeader?: boolean;
}

function statusColor(status: string): "success" | "warning" | "danger" | "default" {
  const v = paymentStatusLabel(status);
  if (v === "Paid") return "success";
  if (v === "Pending") return "warning";
  return "danger";
}

export default function PaymentHistoryTable({ payments, limit, showHeader = true }: PaymentHistoryTableProps) {
  const rows = limit ? payments.slice(0, limit) : payments;

  if (rows.length === 0) {
    return (
      <Card className="rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <Card.Content className="py-14 flex flex-col items-center gap-3 text-center">
          <span className="rounded-full bg-zinc-100 dark:bg-zinc-800 p-4">
            <Receipt size={28} className="text-zinc-400" />
          </span>
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">No payments found</p>
          <p className="text-xs text-zinc-500 max-w-xs">Try adjusting your filters or check back after your next rent payment.</p>
        </Card.Content>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
      {showHeader && (
        <Card.Header className="px-4 pt-4 pb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Payment history</h3>
          <span className="text-xs text-zinc-400">{rows.length} records</span>
        </Card.Header>
      )}
      <Table>
        <Table.ScrollContainer>
          <Table.Content aria-label="Payment history" className="w-full">
            <Table.Header className="bg-zinc-50 dark:bg-zinc-800/60 text-[11px] tracking-wider font-medium text-zinc-500 dark:text-zinc-300">
              <Table.Column isRowHeader className="px-4 py-2 text-left">Date</Table.Column>
              <Table.Column className="px-4 py-2 text-left">Description</Table.Column>
              <Table.Column className="px-4 py-2 text-right">Amount</Table.Column>
              <Table.Column className="px-4 py-2 text-right">Status</Table.Column>
            </Table.Header>
            <Table.Body>
              {rows.map((row) => {
                const label = row.period_start
                  ? `${new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(new Date(row.period_start))} — Monthly rent`
                  : "Monthly rent";
                return (
                  <Table.Row key={row.id} id={row.id} className="border-t border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40 transition">
                    <Table.Cell className="px-4 py-3 text-xs text-zinc-500 whitespace-nowrap">
                      <Link href={`/tenant/payment/history/${row.id}`} className="hover:underline">
                        {formatDateShort(row.date)}
                      </Link>
                    </Table.Cell>
                    <Table.Cell className="px-4 py-3 text-xs text-zinc-700 dark:text-zinc-300">
                      <Link href={`/tenant/payment/history/${row.id}`} className="hover:text-primary transition">
                        {label}
                      </Link>
                      <span className="block text-[11px] text-zinc-400">via {methodLabel(row.method)}</span>
                    </Table.Cell>
                    <Table.Cell className="px-4 py-3 text-right text-sm font-medium text-zinc-900 dark:text-zinc-100 whitespace-nowrap">
                      {formatPesoDisplay(row.amount)}
                    </Table.Cell>
                    <Table.Cell className="px-4 py-3 text-right">
                      <Chip size="sm" variant="soft" color={statusColor(row.status)} className="text-[11px]">
                        {paymentStatusLabel(row.status)}
                      </Chip>
                    </Table.Cell>
                  </Table.Row>
                );
              })}
            </Table.Body>
          </Table.Content>
        </Table.ScrollContainer>
      </Table>
    </Card>
  );
}



