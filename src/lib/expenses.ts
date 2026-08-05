import type { ExpenseCategory } from "@/lib/supabase/types";

export const expenseCategoryLabels: Record<ExpenseCategory, string> = {
  fuel: "Fuel",
  toll: "Toll",
  fine: "Fine",
  parking: "Parking",
  registration_fee: "Registration fee",
  insurance_premium: "Insurance premium",
  other: "Other",
};

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
  }).format(amount);
}
