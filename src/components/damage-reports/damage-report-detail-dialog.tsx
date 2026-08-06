"use client";

import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { useState, type ReactElement } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ExpenseFormDialog } from "@/components/expenses/expense-form-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  damageSeverityBadgeVariant,
  damageSeverityLabels,
  damageStatusBadgeVariant,
  damageStatusLabels,
} from "@/lib/damage-reports";
import { expenseCategoryLabels, formatCurrency } from "@/lib/expenses";
import { createClient } from "@/lib/supabase/client";
import type { Database, DamageReportStatus } from "@/lib/supabase/types";
import { formatDate } from "@/lib/vehicles";

type DamageReport = Database["public"]["Tables"]["damage_reports"]["Row"];
type Expense = Database["public"]["Tables"]["expenses"]["Row"];
type VehicleOption = {
  id: string;
  make: string;
  model: string;
  license_plate: string;
};

export type DamageReportWithDetails = DamageReport & {
  vehicle: VehicleOption | null;
  reportedByName: string | null;
  photos: { id: string; url: string | null; fileName: string }[];
  expense: Expense | null;
};

export function DamageReportDetailDialog({
  report,
  companyId,
  vehicles,
  canManage,
  trigger,
}: {
  report: DamageReportWithDetails;
  companyId: string;
  vehicles: VehicleOption[];
  canManage: boolean;
  trigger: ReactElement;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  async function updateStatus(status: DamageReportStatus) {
    setIsUpdating(true);
    setError(null);

    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("damage_reports")
      .update({
        status,
        resolved_at: status === "resolved" ? new Date().toISOString() : null,
      })
      .eq("id", report.id);

    setIsUpdating(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }
    router.refresh();
  }

  async function unlinkExpense() {
    setIsUpdating(true);
    setError(null);

    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("damage_reports")
      .update({ expense_id: null })
      .eq("id", report.id);

    setIsUpdating(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }
    router.refresh();
  }

  async function linkExpense(expense: Expense) {
    const supabase = createClient();
    await supabase
      .from("damage_reports")
      .update({
        expense_id: expense.id,
        status: report.status === "reported" ? "in_repair" : report.status,
      })
      .eq("id", report.id);
    router.refresh();
  }

  async function handleDelete() {
    const supabase = createClient();
    const { error: deleteError } = await supabase
      .from("damage_reports")
      .delete()
      .eq("id", report.id);
    return { error: deleteError?.message };
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {report.vehicle
              ? `${report.vehicle.make} ${report.vehicle.model}`
              : "Damage report"}
          </DialogTitle>
          <DialogDescription>
            Reported {formatDate(report.reported_at)}
            {report.reportedByName ? ` by ${report.reportedByName}` : ""}.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={damageSeverityBadgeVariant[report.severity]}>
              {damageSeverityLabels[report.severity]}
            </Badge>
            {canManage ? (
              <Select
                value={report.status}
                onValueChange={(value) =>
                  value && updateStatus(value as DamageReportStatus)
                }
              >
                <SelectTrigger className="h-7 w-36" disabled={isUpdating}>
                  <SelectValue>
                    {(value: DamageReportStatus | null) =>
                      value ? damageStatusLabels[value] : "Status"
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(damageStatusLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Badge variant={damageStatusBadgeVariant[report.status]}>
                {damageStatusLabels[report.status]}
              </Badge>
            )}
          </div>

          {report.description ? (
            <p className="text-sm whitespace-pre-wrap">{report.description}</p>
          ) : null}

          <div>
            <h3 className="mb-2 text-sm font-medium text-muted-foreground">
              Photos
            </h3>
            {report.photos.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No photos attached.
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {report.photos.map((photo) =>
                  photo.url ? (
                    <a
                      key={photo.id}
                      href={photo.url}
                      target="_blank"
                      rel="noreferrer"
                      className="block aspect-square overflow-hidden rounded-lg border bg-muted"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photo.url}
                        alt={photo.fileName}
                        className="size-full object-cover"
                      />
                    </a>
                  ) : null
                )}
              </div>
            )}
          </div>

          <div>
            <h3 className="mb-2 text-sm font-medium text-muted-foreground">
              Repair expense
            </h3>
            {report.expense ? (
              <div className="flex items-center justify-between rounded-lg border p-3 text-sm">
                <div className="flex flex-col">
                  <span className="font-medium">
                    {formatCurrency(report.expense.amount)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {expenseCategoryLabels[report.expense.category]} ·{" "}
                    {formatDate(report.expense.expense_date)}
                  </span>
                </div>
                {canManage ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={isUpdating}
                    onClick={unlinkExpense}
                  >
                    Unlink
                  </Button>
                ) : null}
              </div>
            ) : canManage ? (
              <ExpenseFormDialog
                companyId={companyId}
                vehicles={vehicles}
                defaultVehicleId={report.vehicle_id}
                defaultCategory="other"
                defaultDescription={
                  report.vehicle
                    ? `Damage repair — ${report.vehicle.make} ${report.vehicle.model}`
                    : "Damage repair"
                }
                onCreated={linkExpense}
                trigger={<Button variant="outline">Add repair expense</Button>}
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                No repair expense linked yet.
              </p>
            )}
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          {canManage ? (
            <ConfirmDeleteDialog
              title="Delete this damage report?"
              description="This removes the report and its photos. This can't be undone."
              onConfirm={handleDelete}
              trigger={
                <Button variant="outline" className="self-start text-destructive">
                  <Trash2 className="size-4" />
                  Delete report
                </Button>
              }
            />
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
