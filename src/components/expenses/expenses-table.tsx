"use client";

import { Pencil, Plus, Receipt, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

import { ExpenseFormDialog } from "@/components/expenses/expense-form-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { expenseCategoryLabels, formatCurrency } from "@/lib/expenses";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";
import { formatDate } from "@/lib/vehicles";

type Expense = Database["public"]["Tables"]["expenses"]["Row"];
type VehicleOption = {
  id: string;
  make: string;
  model: string;
  license_plate: string;
};

export function ExpensesTable({
  expenses,
  vehicles,
  companyId,
  canManage,
}: {
  expenses: Expense[];
  vehicles: VehicleOption[];
  companyId: string;
  canManage: boolean;
}) {
  const [categoryFilter, setCategoryFilter] = useState("all");

  const vehicleById = useMemo(
    () => new Map(vehicles.map((vehicle) => [vehicle.id, vehicle])),
    [vehicles]
  );

  const filtered = useMemo(
    () =>
      expenses.filter(
        (expense) =>
          categoryFilter === "all" || expense.category === categoryFilter
      ),
    [expenses, categoryFilter]
  );

  const total = useMemo(
    () => filtered.reduce((sum, expense) => sum + expense.amount, 0),
    [filtered]
  );

  async function handleDelete(id: string) {
    const supabase = createClient();
    const { error } = await supabase.from("expenses").delete().eq("id", id);
    return { error: error?.message };
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Expenses</h1>
          <p className="text-muted-foreground">
            {filtered.length} expense{filtered.length === 1 ? "" : "s"} ·{" "}
            {formatCurrency(total)} total
          </p>
        </div>
        {canManage ? (
          <ExpenseFormDialog
            companyId={companyId}
            vehicles={vehicles}
            trigger={
              <Button>
                <Plus className="size-4" />
                Add expense
              </Button>
            }
          />
        ) : null}
      </div>

      <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v ?? "all")}>
        <SelectTrigger className="sm:w-56">
          <SelectValue>
            {(value: string | null) =>
              value && value !== "all"
                ? expenseCategoryLabels[value as keyof typeof expenseCategoryLabels]
                : "All categories"
            }
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All categories</SelectItem>
          {Object.entries(expenseCategoryLabels).map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted">
              <Receipt className="size-6 text-muted-foreground" />
            </div>
            <div>
              <h2 className="font-medium">
                {expenses.length === 0
                  ? "No expenses yet"
                  : "No expenses match this filter"}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {expenses.length === 0
                  ? "Track fuel, tolls, fines and other fleet costs."
                  : "Try a different category."}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Amount</TableHead>
                {canManage ? <TableHead className="w-20" /> : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((expense) => {
                const vehicle = expense.vehicle_id
                  ? vehicleById.get(expense.vehicle_id)
                  : null;

                return (
                  <TableRow key={expense.id}>
                    <TableCell>{formatDate(expense.expense_date)}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {expenseCategoryLabels[expense.category]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {vehicle ? `${vehicle.make} ${vehicle.model}` : "—"}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {expense.description ?? "—"}
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(expense.amount)}
                    </TableCell>
                    {canManage ? (
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <ExpenseFormDialog
                            companyId={companyId}
                            vehicles={vehicles}
                            expense={expense}
                            trigger={
                              <Button variant="ghost" size="icon-sm">
                                <Pencil className="size-4" />
                                <span className="sr-only">Edit</span>
                              </Button>
                            }
                          />
                          <ConfirmDeleteDialog
                            title="Delete this expense?"
                            description="This can't be undone."
                            onConfirm={() => handleDelete(expense.id)}
                            trigger={
                              <Button variant="ghost" size="icon-sm">
                                <Trash2 className="size-4" />
                                <span className="sr-only">Delete</span>
                              </Button>
                            }
                          />
                        </div>
                      </TableCell>
                    ) : null}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
