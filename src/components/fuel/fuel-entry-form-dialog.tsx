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
import { formatCurrency } from "@/lib/expenses";
import { formatKm, type FuelEntry } from "@/lib/fuel";
import { createClient } from "@/lib/supabase/client";
import { vehicleLabel } from "@/lib/vehicles";

export type FuelVehicleOption = {
  id: string;
  make: string;
  model: string;
  license_plate: string;
  odometer: number | null;
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

function toFormValues(entry?: FuelEntry, defaultVehicleId?: string) {
  if (!entry) {
    return {
      vehicle_id: defaultVehicleId ?? "",
      filled_on: today(),
      odometer: "",
      liters: "",
      total_cost: "",
      full_tank: true,
      station: "",
      notes: "",
    };
  }
  return {
    vehicle_id: entry.vehicle_id,
    filled_on: entry.filled_on,
    odometer: entry.odometer.toString(),
    liters: entry.liters.toString(),
    total_cost: entry.total_cost.toString(),
    full_tank: entry.full_tank,
    station: entry.station ?? "",
    notes: entry.notes ?? "",
  };
}

type FormValues = ReturnType<typeof toFormValues>;

export function FuelEntryFormDialog({
  companyId,
  createdBy,
  vehicles,
  entry,
  defaultVehicleId,
  trigger,
}: {
  companyId: string;
  createdBy: string;
  // The vehicles this user may log fuel for.
  vehicles: FuelVehicleOption[];
  entry?: FuelEntry;
  defaultVehicleId?: string;
  trigger: ReactElement;
}) {
  const router = useRouter();
  const t = useTranslations("fuel");
  const tCommon = useTranslations("common");
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<FormValues>(() =>
    toFormValues(entry, defaultVehicleId)
  );
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEdit = Boolean(entry);
  const vehiclesById = new Map(vehicles.map((vehicle) => [vehicle.id, vehicle]));
  const selectedVehicle = vehiclesById.get(values.vehicle_id);

  const liters = Number(values.liters);
  const totalCost = Number(values.total_cost);
  const unitPrice =
    values.liters && values.total_cost && liters > 0 && totalCost >= 0
      ? totalCost / liters
      : null;

  function set<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      setValues(
        toFormValues(
          entry,
          defaultVehicleId ?? (vehicles.length === 1 ? vehicles[0].id : undefined)
        )
      );
      setError(null);
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const odometer = Number(values.odometer);
    if (!values.vehicle_id) {
      setError(t("form.errors.vehicleRequired"));
      return;
    }
    if (!values.odometer || !Number.isInteger(odometer) || odometer < 0) {
      setError(t("form.errors.invalidOdometer"));
      return;
    }
    if (!values.liters || Number.isNaN(liters) || liters <= 0) {
      setError(t("form.errors.invalidLiters"));
      return;
    }
    if (!values.total_cost || Number.isNaN(totalCost) || totalCost < 0) {
      setError(t("form.errors.invalidCost"));
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const supabase = createClient();
    const payload = {
      vehicle_id: values.vehicle_id,
      filled_on: values.filled_on,
      odometer,
      liters,
      total_cost: totalCost,
      full_tank: values.full_tank,
      station: values.station.trim() || null,
      notes: values.notes.trim() || null,
    };

    // The linked fuel expense and the vehicle's odometer are kept up to date
    // by a database trigger.
    const { error } = isEdit
      ? await supabase.from("fuel_entries").update(payload).eq("id", entry!.id)
      : await supabase
          .from("fuel_entries")
          .insert({ ...payload, company_id: companyId, created_by: createdBy });

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
          <DialogTitle>
            {isEdit ? t("form.editTitle") : t("form.addTitle")}
          </DialogTitle>
          <DialogDescription>{t("form.dialogDescription")}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label>{t("form.vehicle.label")}</Label>
            <Select
              value={values.vehicle_id || null}
              onValueChange={(value) => set("vehicle_id", value ?? "")}
            >
              <SelectTrigger className="w-full">
                <SelectValue>
                  {(value: string | null) => {
                    const vehicle = value ? vehiclesById.get(value) : null;
                    return vehicle
                      ? vehicleLabel(vehicle)
                      : t("form.vehicle.placeholder");
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {vehicles.map((vehicle) => (
                  <SelectItem key={vehicle.id} value={vehicle.id}>
                    {vehicleLabel(vehicle)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="filled_on">{t("form.date.label")}</Label>
              <Input
                id="filled_on"
                type="date"
                value={values.filled_on}
                onChange={(event) => set("filled_on", event.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="odometer">{t("form.odometer.label")}</Label>
              <Input
                id="odometer"
                type="number"
                inputMode="numeric"
                min={0}
                step={1}
                value={values.odometer}
                onChange={(event) => set("odometer", event.target.value)}
                required
              />
            </div>
          </div>
          {selectedVehicle?.odometer != null ? (
            <p className="-mt-2 text-xs text-muted-foreground">
              {t("form.odometer.current", {
                value: formatKm(selectedVehicle.odometer),
              })}
            </p>
          ) : null}

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="liters">{t("form.liters.label")}</Label>
              <Input
                id="liters"
                type="number"
                inputMode="decimal"
                min={0}
                step="0.01"
                value={values.liters}
                onChange={(event) => set("liters", event.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="total_cost">{t("form.totalCost.label")}</Label>
              <Input
                id="total_cost"
                type="number"
                inputMode="decimal"
                min={0}
                step="0.01"
                value={values.total_cost}
                onChange={(event) => set("total_cost", event.target.value)}
                required
              />
            </div>
          </div>
          {unitPrice != null ? (
            <p className="-mt-2 text-xs text-muted-foreground">
              {t("form.pricePerLiter", { price: formatCurrency(unitPrice) })}
            </p>
          ) : null}

          <div className="flex items-start gap-3">
            <input
              id="full_tank"
              type="checkbox"
              checked={values.full_tank}
              onChange={(event) => set("full_tank", event.target.checked)}
              className="mt-0.5 size-4 shrink-0 accent-primary"
            />
            <div className="flex flex-col gap-1">
              <Label htmlFor="full_tank">{t("form.fullTank.label")}</Label>
              <p className="text-xs text-muted-foreground">
                {t("form.fullTank.hint")}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="station">{t("form.station.label")}</Label>
            <Input
              id="station"
              value={values.station}
              onChange={(event) => set("station", event.target.value)}
              maxLength={200}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="fuel_notes">{t("form.notes.label")}</Label>
            <Textarea
              id="fuel_notes"
              value={values.notes}
              onChange={(event) => set("notes", event.target.value)}
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
