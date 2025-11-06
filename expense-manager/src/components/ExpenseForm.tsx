"use client";

import { useMemo, useState } from "react";
import {
  CATEGORY_OPTIONS,
  getExpenseTypeOptions,
  type ExpenseCategory,
  type ProfileRole,
} from "@/lib/categories";
import { useFormStatus } from "react-dom";

type ExpenseFormProps = {
  action: (formData: FormData) => void;
  activeRole: ProfileRole;
};

const formatLocalDateTime = (date: Date) => {
  const pad = (v: number) => v.toString().padStart(2, "0");
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      className="inline-flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
      disabled={pending}
    >
      {pending ? "Saving..." : "Record Expense"}
    </button>
  );
}

const MATERIAL_DEFAULT_OPTION = getExpenseTypeOptions("Material")[0]?.value ?? "";

export function ExpenseForm({ action, activeRole }: ExpenseFormProps) {
  const [category, setCategory] = useState<ExpenseCategory>("Material");
  const [expenseType, setExpenseType] = useState<string>(MATERIAL_DEFAULT_OPTION);
  const [otherDetail, setOtherDetail] = useState("");

  const typeOptions = useMemo(() => getExpenseTypeOptions(category), [category]);

  const showOtherDetail = useMemo(() => {
    const selected = typeOptions.find((option) => option.value === expenseType);
    return selected?.allowsDetail ?? false;
  }, [expenseType, typeOptions]);

  const defaultDateTime = useMemo(() => formatLocalDateTime(new Date()), []);

  return (
    <form
      action={action}
      encType="multipart/form-data"
      className="flex flex-col gap-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
    >
      <input type="hidden" name="profile_role" value={activeRole} />
      <div className="grid gap-6 sm:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm font-medium text-zinc-800">
          Expense Done By
          <input
            required
            name="expense_done_by"
            placeholder="Person or Department"
            className="rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-zinc-800">
          Amount (INR)
          <input
            required
            min="0"
            step="0.01"
            type="number"
            name="amount_in_inr"
            placeholder="0.00"
            className="rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-zinc-800">
          Expense Category
          <select
            name="expense_category"
            value={category}
            onChange={(event) => {
              const nextCategory = event.target.value as ExpenseCategory;
              setCategory(nextCategory);
              const nextOptions = getExpenseTypeOptions(nextCategory);
              setExpenseType(nextOptions[0]?.value ?? "");
              setOtherDetail("");
            }}
            className="rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            {CATEGORY_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-zinc-800">
          Expense Type
          <select
            name="expense_type"
            value={expenseType}
            onChange={(event) => {
              const nextType = event.target.value;
              setExpenseType(nextType);
              const selectedOption = typeOptions.find((option) => option.value === nextType);
              if (!(selectedOption?.allowsDetail ?? false)) {
                setOtherDetail("");
              }
            }}
            className="rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            required
          >
            {typeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        {showOtherDetail && (
          <label className="flex flex-col gap-2 text-sm font-medium text-zinc-800 sm:col-span-2">
            Detail for Others
            <input
              name="expense_type_detail"
              value={otherDetail}
              onChange={(event) => setOtherDetail(event.target.value)}
              placeholder="Add description for the selected Others option"
              className="rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              required
            />
          </label>
        )}
        {!showOtherDetail && (
          <input type="hidden" name="expense_type_detail" value="" />
        )}
        <label className="flex flex-col gap-2 text-sm font-medium text-zinc-800">
          Quantity
          <input
            type="number"
            step="0.01"
            min="0"
            name="quantity"
            placeholder="Optional"
            className="rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-zinc-800">
          Expense Date &amp; Time
          <input
            type="datetime-local"
            name="expense_date"
            defaultValue={defaultDateTime}
            className="rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            required
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-zinc-800 sm:col-span-2">
          Upload Document
          <input
            type="file"
            name="document"
            accept="image/*,application/pdf"
            className="rounded-lg border border-dashed border-zinc-300 px-3 py-2 text-sm file:mr-4 file:rounded-lg file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-blue-700"
          />
        </label>
      </div>
      <SubmitButton />
    </form>
  );
}
