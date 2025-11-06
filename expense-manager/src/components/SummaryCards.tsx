"use client";

import type { ExpenseRecord } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { useMemo } from "react";

type SummaryCardsProps = {
  expenses: ExpenseRecord[];
};

export function SummaryCards({ expenses }: SummaryCardsProps) {
  const summary = useMemo(() => {
    const totalSpend = expenses.reduce((sum, expense) => sum + Number(expense.amount_in_inr ?? 0), 0);

    const now = new Date();
    const monthSpend = expenses.reduce((sum, expense) => {
      const date = new Date(expense.expense_date);
      const sameMonth = date.getUTCFullYear() === now.getUTCFullYear() && date.getUTCMonth() === now.getUTCMonth();
      return sameMonth ? sum + Number(expense.amount_in_inr ?? 0) : sum;
    }, 0);

    const categoryTotals = expenses.reduce<Record<string, number>>((accumulator, expense) => {
      accumulator[expense.expense_category] =
        (accumulator[expense.expense_category] ?? 0) + Number(expense.amount_in_inr ?? 0);
      return accumulator;
    }, {});

    const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];

    return {
      totalSpend,
      monthSpend,
      topCategory: topCategory ? { name: topCategory[0], amount: topCategory[1] } : null,
    };
  }, [expenses]);

  const cards = [
    {
      title: "Total Spend",
      value: formatCurrency(summary.totalSpend),
      hint: "Lifetime recorded expenses",
    },
    {
      title: "This Month",
      value: formatCurrency(summary.monthSpend),
      hint: "Current calendar month",
    },
    {
      title: "Top Category",
      value: summary.topCategory
        ? `${summary.topCategory.name} · ${formatCurrency(summary.topCategory.amount)}`
        : "No data yet",
      hint: "Most spent category",
    },
  ];

  return (
    <section className="grid gap-4 sm:grid-cols-3">
      {cards.map((card) => (
        <article
          key={card.title}
          className="flex flex-col gap-1 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm"
        >
          <p className="text-xs uppercase tracking-wide text-blue-600">{card.title}</p>
          <p className="text-lg font-semibold text-zinc-900">{card.value}</p>
          <p className="text-xs text-zinc-500">{card.hint}</p>
        </article>
      ))}
    </section>
  );
}
