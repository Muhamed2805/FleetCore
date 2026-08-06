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

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
  }).format(amount);
}
