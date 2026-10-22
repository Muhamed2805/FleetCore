import type { ExpenseCategory } from "@/lib/supabase/types";

type Translate = (key: string) => string;

export function getExpenseCategoryLabels(
  t: Translate
): Record<ExpenseCategory, string> {
  return {
    fuel: t("enums.expenseCategory.fuel"),
    toll: t("enums.expenseCategory.toll"),
    fine: t("enums.expenseCategory.fine"),
    parking: t("enums.expenseCategory.parking"),
    registration_fee: t("enums.expenseCategory.registrationFee"),
    insurance_premium: t("enums.expenseCategory.insurancePremium"),
    repair: t("enums.expenseCategory.repair"),
    other: t("enums.expenseCategory.other"),
  };
}

// Every amount in the app is in this currency.
export const CURRENCY = "USD";

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: CURRENCY,
  }).format(amount);
}

// "all" (or nothing) means no filter. Used by the Expenses table and the CSV
// export, so both filter the same way.
export type ExpenseFilters = { category?: string };

export function filterExpenses<E extends { category: ExpenseCategory }>(
  expenses: E[],
  { category = "all" }: ExpenseFilters
) {
  return expenses.filter(
    (expense) => category === "all" || expense.category === category
  );
}
