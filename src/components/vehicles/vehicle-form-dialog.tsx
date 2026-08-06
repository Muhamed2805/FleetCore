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
import { DocumentScanButton } from "@/components/ui/document-scan-button";
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
  extractVehicleRegistration,
  type ExtractedVehicleRegistration,
} from "@/lib/extraction";
import { createClient } from "@/lib/supabase/client";
import type {
  Database,
  VehicleStatus,
  VehicleType,
} from "@/lib/supabase/types";
import { getVehicleStatusLabels, getVehicleTypeLabels } from "@/lib/vehicles";

type Vehicle = Database["public"]["Tables"]["vehicles"]["Row"];
type Driver = { id: string; full_name: string | null };

const emptyForm = {
  type: "car" as VehicleType,
  status: "active" as VehicleStatus,
  make: "",
  model: "",
  year: "",
  license_plate: "",
  vin: "",
  assigned_driver_id: "",
  odometer: "",
  registration_expiry: "",
  insurance_expiry: "",
  inspection_expiry: "",
  notes: "",
};

type FormValues = typeof emptyForm;

function toFormValues(vehicle?: Vehicle): FormValues {
  if (!vehicle) return emptyForm;
  return {
    type: vehicle.type,
    status: vehicle.status,
    make: vehicle.make,
    model: vehicle.model,
    year: vehicle.year?.toString() ?? "",
    license_plate: vehicle.license_plate,
    vin: vehicle.vin ?? "",
    assigned_driver_id: vehicle.assigned_driver_id ?? "",
    odometer: vehicle.odometer?.toString() ?? "",
    registration_expiry: vehicle.registration_expiry ?? "",
    insurance_expiry: vehicle.insurance_expiry ?? "",
    inspection_expiry: vehicle.inspection_expiry ?? "",
    notes: vehicle.notes ?? "",
  };
}

export function VehicleFormDialog({
  companyId,
  drivers,
  vehicle,
  trigger,
}: {
  companyId: string;
  drivers: Driver[];
  vehicle?: Vehicle;
  trigger: ReactElement;
}) {
  const t = useTranslations("vehicles");
  const tCommon = useTranslations("common");
  const vehicleTypeLabels = getVehicleTypeLabels(t);
  const vehicleStatusLabels = getVehicleStatusLabels(t);
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<FormValues>(() => toFormValues(vehicle));
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEdit = Boolean(vehicle);
  const driversById = new Map(drivers.map((driver) => [driver.id, driver]));

  function set<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function handleExtracted(extracted: ExtractedVehicleRegistration) {
    setValues((prev) => ({
      ...prev,
      make: extracted.make ?? prev.make,
      model: extracted.model ?? prev.model,
      year: extracted.year != null ? String(extracted.year) : prev.year,
      vin: extracted.vin ?? prev.vin,
      license_plate: extracted.license_plate ?? prev.license_plate,
      registration_expiry:
        extracted.registration_expiry ?? prev.registration_expiry,
    }));
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      setValues(toFormValues(vehicle));
      setError(null);
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (
      !values.make.trim() ||
      !values.model.trim() ||
      !values.license_plate.trim()
    ) {
      setError(t("form.validationError"));
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const supabase = createClient();
    const payload = {
      type: values.type,
      status: values.status,
      make: values.make.trim(),
      model: values.model.trim(),
      year: values.year ? Number(values.year) : null,
      license_plate: values.license_plate.trim(),
      vin: values.vin.trim() || null,
      assigned_driver_id: values.assigned_driver_id || null,
      odometer: values.odometer ? Number(values.odometer) : null,
      registration_expiry: values.registration_expiry || null,
      insurance_expiry: values.insurance_expiry || null,
      inspection_expiry: values.inspection_expiry || null,
      notes: values.notes.trim() || null,
    };

    const { error } = isEdit
      ? await supabase.from("vehicles").update(payload).eq("id", vehicle!.id)
      : await supabase
          .from("vehicles")
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
          {!isEdit ? (
            <DocumentScanButton
              label={t("scanRegistration")}
              action={extractVehicleRegistration}
              onExtracted={handleExtracted}
            />
          ) : null}

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label>{t("form.type")}</Label>
              <Select
                value={values.type}
                onValueChange={(value) => set("type", value as VehicleType)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {(value: VehicleType | null) =>
                      value ? vehicleTypeLabels[value] : t("form.selectType")
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(vehicleTypeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label>{t("form.status")}</Label>
              <Select
                value={values.status}
                onValueChange={(value) =>
                  set("status", value as VehicleStatus)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {(value: VehicleStatus | null) =>
                      value
                        ? vehicleStatusLabels[value]
                        : t("form.selectStatus")
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(vehicleStatusLabels).map(
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
              <Label htmlFor="make">{t("form.make")}</Label>
              <Input
                id="make"
                value={values.make}
                onChange={(event) => set("make", event.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="model">{t("form.model")}</Label>
              <Input
                id="model"
                value={values.model}
                onChange={(event) => set("model", event.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="license_plate">{t("form.licensePlate")}</Label>
              <Input
                id="license_plate"
                value={values.license_plate}
                onChange={(event) =>
                  set("license_plate", event.target.value)
                }
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="year">{t("form.year")}</Label>
              <Input
                id="year"
                type="number"
                value={values.year}
                onChange={(event) => set("year", event.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="vin">{t("form.vin")}</Label>
              <Input
                id="vin"
                value={values.vin}
                onChange={(event) => set("vin", event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="odometer">{t("form.odometer")}</Label>
              <Input
                id="odometer"
                type="number"
                value={values.odometer}
                onChange={(event) => set("odometer", event.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label>{t("form.assignedDriver")}</Label>
            <Select
              value={values.assigned_driver_id || "none"}
              onValueChange={(value) =>
                set(
                  "assigned_driver_id",
                  !value || value === "none" ? "" : value
                )
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue>
                  {(value: string | null) =>
                    value
                      ? (driversById.get(value)?.full_name ??
                        t("form.unnamedDriver"))
                      : t("form.unassigned")
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t("form.unassigned")}</SelectItem>
                {drivers.map((driver) => (
                  <SelectItem key={driver.id} value={driver.id}>
                    {driver.full_name ?? t("form.unnamedDriver")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="registration_expiry">
                {t("form.registrationExpiry")}
              </Label>
              <Input
                id="registration_expiry"
                type="date"
                value={values.registration_expiry}
                onChange={(event) =>
                  set("registration_expiry", event.target.value)
                }
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="insurance_expiry">
                {t("form.insuranceExpiry")}
              </Label>
              <Input
                id="insurance_expiry"
                type="date"
                value={values.insurance_expiry}
                onChange={(event) =>
                  set("insurance_expiry", event.target.value)
                }
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="inspection_expiry">
                {t("form.inspectionExpiry")}
              </Label>
              <Input
                id="inspection_expiry"
                type="date"
                value={values.inspection_expiry}
                onChange={(event) =>
                  set("inspection_expiry", event.target.value)
                }
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="notes">{t("form.notes")}</Label>
            <Textarea
              id="notes"
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
                  : t("form.addVehicle")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
