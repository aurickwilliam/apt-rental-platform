"use client";

import Link from "next/link";
import { IconChevronRight } from "@tabler/icons-react";
import {
  financeCategoryLabel,
  type FinanceCategory,
  type FinanceData,
} from "@repo/utils";

import { financeCategoryHref } from "@/lib/landlord-finance-params";

import FinanceCard from "./FinanceCard";
import FinanceMeter from "./FinanceMeter";
import { financeMoney } from "./FinanceMoneyRow";

interface CategorySummaryCardsProps {
  categories: FinanceData["categories"];
  /** The open category; unknown categories only get the category list. */
  category: FinanceCategory | null;
  month: string;
  apartmentId: string | null;
}

/**
 * Right column of the category page. Every figure is read from the report's
 * category rows — the same ones behind "Where expenses go" — so the totals
 * never depend on how many transactions have been paged in.
 */
export default function CategorySummaryCards({
  categories,
  category,
  month,
  apartmentId,
}: CategorySummaryCardsProps) {
  const total = categories.reduce((sum, row) => sum + (row.amount ?? 0), 0);
  const current = category
    ? categories.find((row) => row.category === category)
    : undefined;
  const amount = current?.amount ?? 0;
  const share = total > 0 ? (amount / total) * 100 : 0;
  const others = categories
    .filter(
      (row) =>
        row.category !== category &&
        ((row.amount ?? 0) > 0 || row.previous_amount > 0),
    )
    .sort((a, b) => (b.amount ?? 0) - (a.amount ?? 0));
  return (
    <>
      {category ? (
        <section
          aria-label="Category total"
          data-finance-category={category}
          className="finance-category-summary"
        >
          <p className="text-sm opacity-70">Total this month</p>
          <p className="font-nunito text-3xl font-bold tabular-nums">
            {financeMoney(amount)}
          </p>
          <p className="text-sm opacity-70">
            {share.toFixed(0)}% of recorded spending
          </p>
          <FinanceMeter
            className="mt-3"
            label={`${financeCategoryLabel(category)} share of recorded spending`}
            value={share}
          />
          <p className="mt-3 flex justify-between gap-3 text-sm">
            <span className="opacity-70">Previous comparable period</span>
            <span className="font-semibold tabular-nums">
              {financeMoney(current?.previous_amount ?? 0)}
            </span>
          </p>
        </section>
      ) : null}
      {others.length ? (
        <FinanceCard title="Other categories">
          <ul className="-mx-2 space-y-1">
            {others.map((row) => (
              <li key={row.category}>
                <Link
                  href={financeCategoryHref(month, apartmentId, row.category)}
                  className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm hover:bg-muted focus-visible:outline-2 focus-visible:outline-primary"
                >
                  <span
                    aria-hidden
                    data-finance-category={row.category}
                    className="size-3 shrink-0 rounded-full border border-border bg-(--finance-row-solid)"
                  />
                  <span className="min-w-0 flex-1 truncate">
                    {financeCategoryLabel(row.category)}
                  </span>
                  <span className="font-semibold tabular-nums">
                    {financeMoney(row.amount ?? 0)}
                  </span>
                  <IconChevronRight
                    size={16}
                    className="text-muted-foreground"
                    aria-hidden
                  />
                </Link>
              </li>
            ))}
          </ul>
        </FinanceCard>
      ) : null}
    </>
  );
}
