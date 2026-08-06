"use client";

import { useTranslations } from "next-intl";
import { useState, type FormEvent, type ReactElement } from "react";

import { useRouter } from "@/i18n/navigation";
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
import {
  getMaintenanceStatusLabels,
  getMaintenanceTypeLabels,
} from "@/lib/maintenance";
import { createClient } from "@/lib/supabase/client";
import type {
  Database,
  MaintenanceStatus,
  MaintenanceType,
} from "@/lib/supabase/types";

type MaintenanceRecord =
  Database["public"]["Tables"]["maintenance_records"]["Row"];
type VehicleOption = { id: string; make: string; model: string; license_plate: string };
type StaffOption = { id: string; full_name: string | null };

const emptyForm = {
  vehicle_id: "",
  type: "other" as MaintenanceType,
  status: "scheduled" as MaintenanceStatus,
  title: "",
  description: "",
  scheduled_date: "",
  completed_date: "",
  odometer: "",
  cost: "",
  performed_by: "",
};

type FormValues = typeof emptyForm;

function toFormValues(record?: MaintenanceRecord, defaultVehicleId?: string): FormValues {
  if (!record) return { ...emptyForm, vehicle_id: defaultVehicleId ?? "" };
  return {
    vehicle_id: record.vehicle_id,
    type: record.type,
    status: record.status,
    title: record.title,
    description: record.description ?? "",
    scheduled_date: record.scheduled_date ?? "",
    completed_date: record.completed_date ?? "",
    odometer: record.odometer?.toString() ?? "",
    cost: record.cost?.toString() ?? "",
    performed_by: record.performed_by ?? "",
  };
}

export function MaintenanceFormDialog({
  companyId,
  vehicles,
  staff,
  record,
  defaultVehicleId,
  trigger,
}: {
  companyId: string;
  vehicles: VehicleOption[];
  staff: StaffOption[];
  record?: MaintenanceRecord;
  defaultVehicleId?: string;
  trigger: ReactElement;
}) {
  const router = useRouter();
  const t = useTranslations("maintenance");
  const tCommon = useTranslations("common");
  const maintenanceTypeLabels = getMaintenanceTypeLabels(t);
  const maintenanceStatusLabels = getMaintenanceStatusLabels(t);
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<FormValues>(() =>
    toFormValues(record, defaultVehicleId)
  );
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEdit = Boolean(record);
  const vehiclesById = new Map(vehicles.map((vehicle) => [vehicle.id, vehicle]));
  const staffById = new Map(staff.map((person) => [person.id, person]));

  function set<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      setValues(toFormValues(record, defaultVehicleId));
      setError(null);
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (!values.vehicle_id || !values.title.trim()) {
      setError(t("form.errors.vehicleAndTitleRequired"));
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const supabase = createClient();
    const payload = {
      vehicle_id: values.vehicle_id,
      type: values.type,
      status: values.status,
      title: values.title.trim(),
      description: values.description.trim() || null,
      scheduled_date: values.scheduled_date || null,
      completed_date: values.completed_date || null,
      odometer: values.odometer ? Number(values.odometer) : null,
      cost: values.cost ? Number(values.cost) : null,
      performed_by: values.performed_by || null,
    };

    const { error } = isEdit
      ? await supabase
          .from("maintenance_records")
          .update(payload)
          .eq("id", record!.id)
      : await supabase
          .from("maintenance_records")
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
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? t("form.editTitle") : t("form.addTitle")}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? t("form.editDescription") : t("form.addDescription")}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label>{t("form.vehicle.label")}</Label>
            <Select
              value={values.vehicle_id}
              onValueChange={(value) => set("vehicle_id", value ?? "")}
            >
              <SelectTrigger className="w-full">
                <SelectValue>
                  {(value: string | null) => {
                    const vehicle = value ? vehiclesById.get(value) : null;
                    return vehicle
                      ? `${vehicle.make} ${vehicle.model} (${vehicle.license_plate})`
                      : t("form.vehicle.placeholder");
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {vehicles.map((vehicle) => (
                  <SelectItem key={vehicle.id} value={vehicle.id}>
                    {vehicle.make} {vehicle.model} ({vehicle.license_plate})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="title">{t("form.title.label")}</Label>
            <Input
              id="title"
              value={values.title}
              onChange={(event) => set("title", event.target.value)}
              placeholder={t("form.title.placeholder")}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label>{t("form.type.label")}</Label>
              <Select
                value={values.type}
                onValueChange={(value) =>
                  set("type", value as MaintenanceType)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {(value: MaintenanceType | null) =>
                      value
                        ? maintenanceTypeLabels[value]
                        : t("form.type.placeholder")
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(maintenanceTypeLabels).map(
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
              <Label>{t("form.status.label")}</Label>
              <Select
                value={values.status}
                onValueChange={(value) =>
                  set("status", value as MaintenanceStatus)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {(value: MaintenanceStatus | null) =>
                      value
                        ? maintenanceStatusLabels[value]
                        : t("form.status.placeholder")
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(maintenanceStatusLabels).map(
                    ([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="scheduled_date">
                {t("form.scheduledDate.label")}
              </Label>
              <Input
                id="scheduled_date"
                type="date"
                value={values.scheduled_date}
                onChange={(event) =>
                  set("scheduled_date", event.target.value)
                }
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="completed_date">
                {t("form.completedDate.label")}
              </Label>
              <Input
                id="completed_date"
                type="date"
                value={values.completed_date}
                onChange={(event) =>
                  set("completed_date", event.target.value)
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="odometer">{t("form.odometer.label")}</Label>
              <Input
                id="odometer"
                type="number"
                value={values.odometer}
                onChange={(event) => set("odometer", event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="cost">{t("form.cost.label")}</Label>
              <Input
                id="cost"
                type="number"
                step="0.01"
                value={values.cost}
                onChange={(event) => set("cost", event.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label>{t("form.performedBy.label")}</Label>
            <Select
              value={values.performed_by || "none"}
              onValueChange={(value) =>
                set("performed_by", !value || value === "none" ? "" : value)
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue>
                  {(value: string | null) =>
                    value
                      ? (staffById.get(value)?.full_name ??
                        t("form.performedBy.unnamed"))
                      : t("form.performedBy.unassigned")
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">
                  {t("form.performedBy.unassigned")}
                </SelectItem>
                {staff.map((person) => (
                  <SelectItem key={person.id} value={person.id}>
                    {person.full_name ?? t("form.performedBy.unnamed")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="description">{t("form.description.label")}</Label>
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
                ? tCommon("actions.saving")
                : isEdit
                  ? tCommon("actions.saveChanges")
                  : t("form.submit.add")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
