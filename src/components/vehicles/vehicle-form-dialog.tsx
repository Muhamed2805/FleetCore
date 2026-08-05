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
import { createClient } from "@/lib/supabase/client";
import type {
  Database,
  VehicleStatus,
  VehicleType,
} from "@/lib/supabase/types";
import { vehicleStatusLabels, vehicleTypeLabels } from "@/lib/vehicles";

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
      setError("Make, model and license plate are required.");
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
          <DialogTitle>{isEdit ? "Edit vehicle" : "Add vehicle"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update this vehicle's details."
              : "Add a car, van, truck, machine or forklift to your fleet."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label>Type</Label>
              <Select
                value={values.type}
                onValueChange={(value) => set("type", value as VehicleType)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {(value: VehicleType | null) =>
                      value ? vehicleTypeLabels[value] : "Select type"
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
              <Label>Status</Label>
              <Select
                value={values.status}
                onValueChange={(value) =>
                  set("status", value as VehicleStatus)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {(value: VehicleStatus | null) =>
                      value ? vehicleStatusLabels[value] : "Select status"
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
              <Label htmlFor="make">Make</Label>
              <Input
                id="make"
                value={values.make}
                onChange={(event) => set("make", event.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="model">Model</Label>
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
              <Label htmlFor="license_plate">License plate</Label>
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
              <Label htmlFor="year">Year</Label>
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
              <Label htmlFor="vin">VIN</Label>
              <Input
                id="vin"
                value={values.vin}
                onChange={(event) => set("vin", event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="odometer">Odometer</Label>
              <Input
                id="odometer"
                type="number"
                value={values.odometer}
                onChange={(event) => set("odometer", event.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Assigned driver</Label>
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
                    value ? (driversById.get(value)?.full_name ?? "Unnamed") : "Unassigned"
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Unassigned</SelectItem>
                {drivers.map((driver) => (
                  <SelectItem key={driver.id} value={driver.id}>
                    {driver.full_name ?? "Unnamed"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="registration_expiry">Registration exp.</Label>
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
              <Label htmlFor="insurance_expiry">Insurance exp.</Label>
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
              <Label htmlFor="inspection_expiry">Inspection exp.</Label>
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
            <Label htmlFor="notes">Notes</Label>
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
                ? "Saving…"
                : isEdit
                  ? "Save changes"
                  : "Add vehicle"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
