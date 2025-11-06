"use client";

import { useMemo, useState } from "react";
import type { ExpenseRecord } from "@/lib/types";
import { CATEGORY_OPTIONS, type ExpenseCategory, type ProfileRole } from "@/lib/categories";
import { formatCurrency } from "@/lib/utils";

type ExpenseListProps = {
  expenses: ExpenseRecord[];
  activeRole: ProfileRole;
};

const categoryFilterOptions: (ExpenseCategory | "All")[] = ["All", ...CATEGORY_OPTIONS];

export function ExpenseList({ expenses, activeRole }: ExpenseListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<(typeof categoryFilterOptions)[number]>("All");

  const filtered = useMemo(() => {
    return expenses.filter((expense) => {
      const matchesCategory =
        categoryFilter === "All" || expense.expense_category === categoryFilter;

      const haystack = `${expense.expense_done_by} ${expense.expense_type} ${expense.expense_type_detail ?? ""}`.toLowerCase();
      const matchesSearch = haystack.includes(searchTerm.trim().toLowerCase());

      return matchesCategory && matchesSearch;
    });
  }, [expenses, categoryFilter, searchTerm]);

  if (!expenses.length) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-white px-6 py-12 text-center">
        <p className="text-lg font-semibold text-zinc-700">No expenses recorded yet</p>
        <p className="mt-2 max-w-sm text-sm text-zinc-500">
          Switch to the appropriate profile using the selector above and log your first expense to
          begin tracking.
        </p>
      </div>
    );
  }

  return (
    <section className="flex flex-col gap-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-blue-600">Expenses</p>
          <h2 className="text-lg font-semibold text-zinc-900">
            {activeRole} view · {filtered.length} record{filtered.length === 1 ? "" : "s"}
          </h2>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            type="search"
            placeholder="Search by name or type"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 sm:w-56"
          />
          <select
            value={categoryFilter}
            onChange={(event) =>
              setCategoryFilter(event.target.value as (typeof categoryFilterOptions)[number])
            }
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 sm:w-40"
          >
            {categoryFilterOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </div>

      <ul className="flex flex-col divide-y divide-zinc-100">
        {filtered.map((expense) => (
          <li key={expense.id} className="py-4 first:pt-0 last:pb-0">
            <article className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-1">
                <p className="text-sm font-semibold text-zinc-900">
                  {expense.expense_done_by}
                </p>
                <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                  <span className="rounded-full bg-blue-50 px-2 py-1 font-medium text-blue-700">
                    {expense.expense_category}
                  </span>
                  <span className="rounded-full bg-zinc-100 px-2 py-1">
                    {expense.expense_type}
                  </span>
                  {expense.expense_type_detail && (
                    <span className="rounded-full bg-zinc-100 px-2 py-1">
                      {expense.expense_type_detail}
                    </span>
                  )}
                  {expense.quantity !== null && (
                    <span className="rounded-full bg-amber-100 px-2 py-1 text-amber-700">
                      Qty: {expense.quantity}
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-400">
                  {new Date(expense.expense_date).toLocaleString()} · Logged by {expense.profile_role}
                </p>
              </div>
              <div className="flex flex-col items-start gap-2 sm:items-end">
                <p className="text-lg font-semibold text-zinc-900">
                  {formatCurrency(expense.amount_in_inr)}
                </p>
                {expense.document_signed_url && (
                  <a
                    href={expense.document_signed_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-blue-600 underline-offset-4 hover:underline"
                  >
                    View Document
                  </a>
                )}
              </div>
            </article>
          </li>
        ))}
      </ul>
    </section>
  );
}
