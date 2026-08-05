"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent, type ReactElement } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { expenseCategoryLabels } from "@/lib/expenses";
import { createClient } from "@/lib/supabase/client";
import type { Database, ExpenseCategory } from "@/lib/supabase/types";

type Expense = Database["public"]["Tables"]["expenses"]["Row"];
type VehicleOption = {
  id: string;
  make: string;
  model: string;
  license_plate: string;
};

const emptyForm = {
  vehicle_id: "",
  category: "fuel" as ExpenseCategory,
  amount: "",
  expense_date: new Date().toISOString().slice(0, 10),
  description: "",
};

type FormValues = typeof emptyForm;

function toFormValues(expense?: Expense): FormValues {
  if (!expense) return emptyForm;
  return {
    vehicle_id: expense.vehicle_id ?? "",
    category: expense.category,
    amount: expense.amount.toString(),
    expense_date: expense.expense_date,
    description: expense.description ?? "",
  };
}

export function ExpenseFormDialog({
  companyId,
  vehicles,
  expense,
  trigger,
}: {
  companyId: string;
  vehicles: VehicleOption[];
  expense?: Expense;
  trigger: ReactElement;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<FormValues>(() => toFormValues(expense));
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEdit = Boolean(expense);
  const vehiclesById = new Map(vehicles.map((vehicle) => [vehicle.id, vehicle]));

  function set<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      setValues(toFormValues(expense));
      setError(null);
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const amount = Number(values.amount);
    if (!values.amount || Number.isNaN(amount) || amount <= 0) {
      setError("Enter a valid amount.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const supabase = createClient();
    const payload = {
      vehicle_id: values.vehicle_id || null,
      category: values.category,
      amount,
      expense_date: values.expense_date,
      description: values.description.trim() || null,
    };

    const { error } = isEdit
      ? await supabase.from("expenses").update(payload).eq("id", expense!.id)
      : await supabase
          .from("expenses")
          .insert({ ...payload, company_id: companyId });

    setIsSubmitting(false);

    if (error) {
      setError(error.message);
      return;
    }

    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={trigger} />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit expense" : "Add expense"}</DialogTitle>
          <DialogDescription>
            Track fuel, tolls, fines and other fleet costs.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label>Category</Label>
              <Select
                value={values.category}
                onValueChange={(value) =>
                  set("category", value as ExpenseCategory)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {(value: ExpenseCategory | null) =>
                      value ? expenseCategoryLabels[value] : "Select category"
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(expenseCategoryLabels).map(
                    ([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={values.amount}
                onChange={(event) => set("amount", event.target.value)}
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="expense_date">Date</Label>
            <Input
              id="expense_date"
              type="date"
              value={values.expense_date}
              onChange={(event) => set("expense_date", event.target.value)}
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label>Vehicle</Label>
            <Select
              value={values.vehicle_id || "none"}
              onValueChange={(value) =>
                set("vehicle_id", !value || value === "none" ? "" : value)
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue>
                  {(value: string | null) => {
                    const vehicle = value ? vehiclesById.get(value) : null;
                    return vehicle
                      ? `${vehicle.make} ${vehicle.model} (${vehicle.license_plate})`
                      : "No vehicle";
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No vehicle</SelectItem>
                {vehicles.map((vehicle) => (
                  <SelectItem key={vehicle.id} value={vehicle.id}>
                    {vehicle.make} {vehicle.model} ({vehicle.license_plate})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={values.description}
              onChange={(event) => set("description", event.target.value)}
            />
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? "Saving…"
                : isEdit
                  ? "Save changes"
                  : "Add expense"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
