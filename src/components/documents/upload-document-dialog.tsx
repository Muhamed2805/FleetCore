"use client";

import { AlertTriangle, Loader2, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  useId,
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactElement,
} from "react";

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
import { MAX_SCAN_FILE_MB, scanFileProblem } from "@/lib/document-scan";
import {
  documentCategories,
  expiryUpdate,
  getDocumentCategoryLabels,
  isExpiringCategory,
  normalizePlate,
  uploadVehicleDocument,
  vehicleExpiry,
  vehicleLabel,
  type DocumentVehicle,
} from "@/lib/documents";
import {
  extractVehicleDocument,
  type ExtractedVehicleDocument,
} from "@/lib/extraction";
import { createClient } from "@/lib/supabase/client";
import type { DocumentCategory } from "@/lib/supabase/types";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function UploadDocumentDialog({
  companyId,
  uploadedBy,
  vehicles,
  defaultVehicleId,
  defaultCategory = "registration",
  trigger,
}: {
  companyId: string;
  uploadedBy: string;
  vehicles: DocumentVehicle[];
  // Set from a vehicle's own page: the vehicle is fixed and its picker hidden.
  defaultVehicleId?: string;
  defaultCategory?: DocumentCategory;
  trigger: ReactElement;
}) {
  const router = useRouter();
  const t = useTranslations("documents.upload");
  const tVehicles = useTranslations("vehicles");
  const tScan = useTranslations("common.documentScan");
  const categoryLabels = getDocumentCategoryLabels(tVehicles);
  const fileInputId = useId();
  const expiryInputId = useId();
  const vehiclesById = new Map(vehicles.map((vehicle) => [vehicle.id, vehicle]));
  const fixedVehicle = defaultVehicleId
    ? vehiclesById.get(defaultVehicleId)
    : undefined;

  const [open, setOpen] = useState(false);
  const [vehicleId, setVehicleId] = useState(defaultVehicleId ?? "");
  const [category, setCategory] = useState<DocumentCategory>(defaultCategory);
  const [file, setFile] = useState<File | null>(null);
  // Bumped to clear the file input, which can't be controlled.
  const [fileInputKey, setFileInputKey] = useState(0);
  const [expiry, setExpiry] = useState("");
  const [scan, setScan] = useState<ExtractedVehicleDocument | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const vehicle = vehiclesById.get(vehicleId);
  const tracksExpiry = isExpiringCategory(category);
  const scannedPlate = normalizePlate(scan?.license_plate);
  const plateMismatch =
    scannedPlate && vehicle && scannedPlate !== normalizePlate(vehicle.license_plate)
      ? scan?.license_plate
      : null;

  // The expiry already on file, which the date field starts from.
  function savedExpiry(id: string, forCategory: DocumentCategory) {
    const target = vehiclesById.get(id);
    return target ? (vehicleExpiry(target, forCategory) ?? "") : "";
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) return;
    const id = defaultVehicleId ?? "";
    setVehicleId(id);
    setCategory(defaultCategory);
    setFile(null);
    setExpiry(savedExpiry(id, defaultCategory));
    setScan(null);
    setScanError(null);
    setError(null);
  }

  function handleVehicleChange(id: string) {
    setVehicleId(id);
    // A date read from the document belongs to the document, not the vehicle.
    if (!scan?.expiry_date) setExpiry(savedExpiry(id, category));
  }

  function handleCategoryChange(next: DocumentCategory) {
    setCategory(next);
    setScan(null);
    setScanError(null);
    setExpiry(savedExpiry(vehicleId, next));
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    setFile(event.target.files?.[0] ?? null);
    if (scan) setExpiry(savedExpiry(vehicleId, category));
    setScan(null);
    setScanError(null);
  }

  async function handleScan() {
    if (!file || !isExpiringCategory(category)) return;

    const problem = scanFileProblem(file);
    if (problem) {
      setScanError(tScan(problem, { max: MAX_SCAN_FILE_MB }));
      return;
    }

    setIsScanning(true);
    setScanError(null);

    const formData = new FormData();
    formData.set("file", file);
    formData.set("category", category);

    let result: Awaited<ReturnType<typeof extractVehicleDocument>>;
    try {
      result = await extractVehicleDocument(formData);
    } catch {
      result = { error: tScan("genericError") };
    }

    setIsScanning(false);

    if (!result.data) {
      setScanError(result.error ?? tScan("couldNotRead"));
      return;
    }

    const found: ExtractedVehicleDocument = {
      license_plate: result.data.license_plate?.trim() || null,
      expiry_date:
        result.data.expiry_date && ISO_DATE.test(result.data.expiry_date)
          ? result.data.expiry_date
          : null,
    };
    setScan(found);

    // With no vehicle chosen yet, pick the one the document is for.
    let targetId = vehicleId;
    const plate = normalizePlate(found.license_plate);
    if (!targetId && plate) {
      const match = vehicles.find(
        (candidate) => normalizePlate(candidate.license_plate) === plate
      );
      if (match) {
        targetId = match.id;
        setVehicleId(match.id);
      }
    }

    setExpiry(found.expiry_date ?? savedExpiry(targetId, category));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (!vehicleId) {
      setError(t("errors.vehicleRequired"));
      return;
    }
    if (!file) {
      setError(t("errors.fileRequired"));
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const supabase = createClient();
    const uploaded = await uploadVehicleDocument(supabase, {
      companyId,
      vehicleId,
      category,
      file,
      uploadedBy,
    });

    if (uploaded.error) {
      setIsSubmitting(false);
      setError(uploaded.error);
      return;
    }

    // Reminders and the calendar read the vehicle's expiry columns, so a
    // renewed document should move the date there too.
    if (
      isExpiringCategory(category) &&
      expiry &&
      expiry !== savedExpiry(vehicleId, category)
    ) {
      const { error: updateError } = await supabase
        .from("vehicles")
        .update(expiryUpdate(category, expiry))
        .eq("id", vehicleId);

      if (updateError) {
        // The document is saved. Clear the file so it isn't uploaded twice,
        // and keep the dialog open to say what failed.
        setIsSubmitting(false);
        setFile(null);
        setFileInputKey((key) => key + 1);
        setError(t("errors.expiryNotSaved", { message: updateError.message }));
        router.refresh();
        return;
      }
    }

    setIsSubmitting(false);
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={trigger} />
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>
            {fixedVehicle
              ? t("descriptionForVehicle", { vehicle: vehicleLabel(fixedVehicle) })
              : t("description")}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {fixedVehicle ? null : (
            <div className="flex flex-col gap-2">
              <Label>{t("vehicleLabel")}</Label>
              <Select
                value={vehicleId}
                onValueChange={(value) => handleVehicleChange(value ?? "")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {(value: string | null) => {
                      const selected = value ? vehiclesById.get(value) : null;
                      return selected
                        ? vehicleLabel(selected)
                        : t("vehiclePlaceholder");
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {vehicles.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      {vehicleLabel(option)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Label>{t("categoryLabel")}</Label>
            <Select
              value={category}
              onValueChange={(value) =>
                handleCategoryChange(value as DocumentCategory)
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue>
                  {(value: DocumentCategory | null) =>
                    value ? categoryLabels[value] : t("categoryLabel")
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {documentCategories.map((value) => (
                  <SelectItem key={value} value={value}>
                    {categoryLabels[value]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor={fileInputId}>{t("fileLabel")}</Label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                key={fileInputKey}
                id={fileInputId}
                type="file"
                onChange={handleFileChange}
                className="sm:flex-1"
              />
              {tracksExpiry ? (
                <Button
                  type="button"
                  variant="outline"
                  disabled={!file || isScanning}
                  onClick={handleScan}
                >
                  {isScanning ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Sparkles className="size-4" />
                  )}
                  {isScanning ? t("scanning") : t("scan")}
                </Button>
              ) : null}
            </div>
            {scanError ? (
              <p className="text-xs text-destructive">{scanError}</p>
            ) : null}
          </div>

          {tracksExpiry ? (
            <div className="flex flex-col gap-2">
              <Label htmlFor={expiryInputId}>{t("expiryLabel")}</Label>
              <Input
                id={expiryInputId}
                type="date"
                value={expiry}
                onChange={(event) => setExpiry(event.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                {scan
                  ? scan.expiry_date
                    ? t("scanFoundExpiry")
                    : t("scanNoExpiry")
                  : t(`expiryHint.${category}`)}
              </p>
            </div>
          ) : null}

          {plateMismatch ? (
            <p className="flex items-start gap-2 text-sm text-amber-700 dark:text-amber-400">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              {t("plateMismatch", { plate: plateMismatch })}
            </p>
          ) : null}

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting || isScanning}>
              {isSubmitting ? t("uploading") : t("submit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
