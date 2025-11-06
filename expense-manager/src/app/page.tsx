import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { randomUUID } from "crypto";
import { ExpenseForm } from "@/components/ExpenseForm";
import { ExpenseList } from "@/components/ExpenseList";
import { SummaryCards } from "@/components/SummaryCards";
import { RoleSwitcher } from "@/components/RoleSwitcher";
import {
  CATEGORY_OPTIONS,
  ROLE_OPTIONS,
  type ExpenseCategory,
  type ProfileRole,
  getExpenseTypeOptions,
} from "@/lib/categories";
import {
  createServiceRoleSupabaseClient,
  isSupabaseConfigured,
} from "@/lib/supabase/server";
import type { ExpenseRecord } from "@/lib/types";

const ROLE_COOKIE_NAME = "bem-active-role";
const DOCUMENT_BUCKET =
  process.env.NEXT_PUBLIC_SUPABASE_EXPENSE_BUCKET ?? "expense-documents";

const parseRole = (role: string | undefined | null): ProfileRole => {
  return ROLE_OPTIONS.find((option) => option === role) ?? "Super Admin";
};

const getActiveRole = async (): Promise<ProfileRole> => {
  const cookieStore = await cookies();
  const storedRole = cookieStore.get(ROLE_COOKIE_NAME)?.value;
  return parseRole(storedRole);
};

const fetchExpenses = async (activeRole: ProfileRole): Promise<ExpenseRecord[]> => {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const supabase = createServiceRoleSupabaseClient();

  let query = supabase
    .from("business_expenses")
    .select(
      `
      id,
      expense_done_by,
      amount_in_inr,
      expense_category,
      expense_type,
      expense_type_detail,
      quantity,
      document_bucket,
      document_path,
      expense_date,
      created_at,
      profile_role
    `,
    )
    .order("expense_date", { ascending: false })
    .limit(200);

  if (activeRole !== "Super Admin") {
    query = query.eq("profile_role", activeRole);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Failed to fetch expenses", error);
    return [];
  }

  if (!data) {
    return [];
  }

  const withSignedUrls = await Promise.all(
    data.map(async (row) => {
      let documentSignedUrl: string | null = null;

      if (row.document_bucket && row.document_path) {
        const { data: signed, error: signedError } = await supabase.storage
          .from(row.document_bucket)
          .createSignedUrl(row.document_path, 60 * 60);

        if (!signedError && signed?.signedUrl) {
          documentSignedUrl = signed.signedUrl;
        }
      }

      return {
        ...row,
        document_signed_url: documentSignedUrl,
      } as ExpenseRecord;
    }),
  );

  return withSignedUrls;
};

const setActiveRole = async (role: ProfileRole) => {
  "use server";
  const cookieStore = await cookies();
  cookieStore.set(ROLE_COOKIE_NAME, role, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    httpOnly: false,
  });
  revalidatePath("/");
};

const createExpenseAction = async (formData: FormData) => {
  "use server";

  if (!isSupabaseConfigured()) {
    throw new Error("Supabase environment variables are not configured");
  }

  const supabase = createServiceRoleSupabaseClient();

  const profileRole = parseRole(formData.get("profile_role")?.toString());
  const rawCategory = formData.get("expense_category")?.toString() as ExpenseCategory;
  const expenseTypeValue = formData.get("expense_type")?.toString() ?? "";
  const amount = parseFloat(formData.get("amount_in_inr")?.toString() ?? "0");
  const expenseDoneBy = formData.get("expense_done_by")?.toString() ?? "";
  const expenseTypeDetail =
    formData.get("expense_type_detail")?.toString().trim() === ""
      ? null
      : formData.get("expense_type_detail")?.toString().trim() ?? null;
  const quantityRaw = formData.get("quantity")?.toString().trim();
  let quantity: number | null = null;
  if (quantityRaw) {
    const parsedQuantity = parseFloat(quantityRaw);
    quantity = Number.isNaN(parsedQuantity) ? null : parsedQuantity;
  }
  const expenseDateRaw = formData.get("expense_date")?.toString();
  const document = formData.get("document") as File | null;

  if (!expenseDoneBy || Number.isNaN(amount) || !expenseDateRaw) {
    throw new Error("Missing required fields to create expense");
  }

  if (!CATEGORY_OPTIONS.includes(rawCategory)) {
    throw new Error("Invalid expense category");
  }

  const expenseCategory = rawCategory;

  const expenseTypes = getExpenseTypeOptions(expenseCategory);
  const matchedType = expenseTypes.find((option) => option.value === expenseTypeValue);
  const expenseTypeLabel = matchedType?.label ?? expenseTypeValue;

  if (matchedType?.allowsDetail && !expenseTypeDetail) {
    throw new Error("Detail is required when selecting Others");
  }

  const expenseDate = new Date(expenseDateRaw);
  if (Number.isNaN(expenseDate.getTime())) {
    throw new Error("Invalid expense date");
  }

  let documentPath: string | null = null;
  let documentBucket: string | null = null;

  if (document && document.size > 0) {
    const extension = document.name.split(".").pop();
    const filePath = `${profileRole.toLowerCase().replace(/\s+/g, "-")}/${randomUUID()}${
      extension ? `.${extension}` : ""
    }`;
    const { error: uploadError } = await supabase.storage
      .from(DOCUMENT_BUCKET)
      .upload(filePath, document, {
        contentType: document.type || "application/octet-stream",
      });

    if (uploadError) {
      console.error("Failed to upload document", uploadError);
      throw new Error("Failed to upload document");
    }

    documentBucket = DOCUMENT_BUCKET;
    documentPath = filePath;
  }

  const { error } = await supabase.from("business_expenses").insert({
    expense_done_by: expenseDoneBy,
    amount_in_inr: amount,
    expense_category: expenseCategory,
    expense_type: expenseTypeLabel,
    expense_type_detail: expenseTypeDetail,
    quantity,
    expense_date: expenseDate.toISOString(),
    document_bucket: documentBucket,
    document_path: documentPath,
    profile_role: profileRole,
  });

  if (error) {
    console.error("Failed to insert expense record", error);
    throw new Error("Unable to save expense");
  }

  revalidatePath("/");
};

export default async function Home() {
  const activeRole = await getActiveRole();
  const expenses = await fetchExpenses(activeRole);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-zinc-50 to-white p-4 pb-16">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <header className="flex flex-col gap-4">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <p className="text-xs uppercase tracking-wide text-blue-600">
                Business Expense Manager
              </p>
              <h1 className="text-2xl font-semibold text-zinc-900">
                Snapshot of your operational spending
              </h1>
            </div>
            <RoleSwitcher activeRole={activeRole} onRoleChange={setActiveRole} />
          </div>
          <p className="max-w-2xl text-sm text-zinc-500">
            Track expenses across Materials, Chemicals, Logistics, Payroll, and more. Switch roles
            to reveal the context each team needs while keeping the data in sync with Supabase.
          </p>
        </header>

        <SummaryCards expenses={expenses} />
        <ExpenseForm key={expenses.length} action={createExpenseAction} activeRole={activeRole} />
        <ExpenseList expenses={expenses} activeRole={activeRole} />
      </div>
    </div>
  );
}
