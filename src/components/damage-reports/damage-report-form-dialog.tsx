"use client";

import { useTranslations } from "next-intl";
import { useRef, useState, type FormEvent, type ReactElement } from "react";

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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "@/i18n/navigation";
import { getDamageSeverityLabels } from "@/lib/damage-reports";
import { createClient } from "@/lib/supabase/client";
import type { DamageSeverity } from "@/lib/supabase/types";

type VehicleOption = {
  id: string;
  make: string;
  model: string;
  license_plate: string;
};

const emptyForm = {
  vehicle_id: "",
  severity: "minor" as DamageSeverity,
  description: "",
};

type FormValues = typeof emptyForm;

export function DamageReportFormDialog({
  companyId,
  vehicles,
  reportedBy,
  defaultVehicleId,
  trigger,
}: {
  companyId: string;
  vehicles: VehicleOption[];
  reportedBy: string;
  defaultVehicleId?: string;
  trigger: ReactElement;
}) {
  const t = useTranslations("damageReports");
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<FormValues>({
    ...emptyForm,
    vehicle_id: defaultVehicleId ?? "",
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const severityLabels = getDamageSeverityLabels(t);
  const vehiclesById = new Map(vehicles.map((vehicle) => [vehicle.id, vehicle]));

  function set<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      setValues({ ...emptyForm, vehicle_id: defaultVehicleId ?? "" });
      setError(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (!values.vehicle_id) {
      setError(t("form.errors.chooseVehicle"));
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const supabase = createClient();

    const { data: report, error: insertError } = await supabase
      .from("damage_reports")
      .insert({
        company_id: companyId,
        vehicle_id: values.vehicle_id,
        severity: values.severity,
        description: values.description.trim() || null,
        reported_by: reportedBy,
      })
      .select()
      .single();

    if (insertError || !report) {
      setIsSubmitting(false);
      setError(insertError?.message ?? t("form.errors.generic"));
      return;
    }

    const files = fileInputRef.current?.files
      ? Array.from(fileInputRef.current.files)
      : [];

    for (const file of files) {
      const path = `${companyId}/${report.id}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("damage-reports")
        .upload(path, file);

      if (uploadError) {
        setError(
          t("form.errors.uploadFailed", {
            fileName: file.name,
            message: uploadError.message,
          })
        );
        continue;
      }

      const { error: photoError } = await supabase
        .from("damage_report_photos")
        .insert({
          company_id: companyId,
          damage_report_id: report.id,
          file_path: path,
          uploaded_by: reportedBy,
        });

      if (photoError) {
        setError(
          t("form.errors.attachFailed", {
            fileName: file.name,
            message: photoError.message,
          })
        );
      }
    }

    setIsSubmitting(false);
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={trigger} />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("form.title")}</DialogTitle>
          <DialogDescription>{t("form.description")}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label>{t("form.vehicleLabel")}</Label>
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
                      : t("form.vehiclePlaceholder");
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
            <Label>{t("form.severityLabel")}</Label>
            <Select
              value={values.severity}
              onValueChange={(value) =>
                set("severity", value as DamageSeverity)
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue>
                  {(value: DamageSeverity | null) =>
                    value ? severityLabels[value] : t("form.severityPlaceholder")
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {Object.entries(severityLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="description">{t("form.descriptionLabel")}</Label>
            <Textarea
              id="description"
              value={values.description}
              onChange={(event) => set("description", event.target.value)}
              placeholder={t("form.descriptionPlaceholder")}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="photos">{t("form.photosLabel")}</Label>
            <input
              ref={fileInputRef}
              id="photos"
              type="file"
              accept="image/*"
              multiple
              className="rounded-lg border border-input bg-transparent text-sm file:mr-3 file:h-8 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:text-sm file:font-medium"
            />
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t("form.submitting") : t("form.submit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
