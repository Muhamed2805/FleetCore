import { Receipt } from "lucide-react";

import { ComingSoon } from "@/components/dashboard/coming-soon";

export default function ExpensesPage() {
  return (
    <ComingSoon
      icon={Receipt}
      title="Expenses"
      description="Track fuel, repairs and other fleet costs. Coming in a later phase."
    />
  );
}
