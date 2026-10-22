"use client";

import { FileText, FileWarning, Search, Trash2, Upload } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import { Link } from "@/i18n/navigation";
import { UploadDocumentDialog } from "@/components/documents/upload-document-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import { Input } from "@/components/ui/input";
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
import { ExpiryBadge } from "@/components/vehicles/expiry-badge";
import {
  deleteVehicleDocument,
  documentCategories,
  getDocumentCategoryLabels,
  normalizePlate,
  vehicleLabel,
  type DocumentVehicle,
  type ExpiringCategory,
} from "@/lib/documents";
import { createClient } from "@/lib/supabase/client";
import type { DocumentCategory } from "@/lib/supabase/types";
import { formatDate } from "@/lib/vehicles";

type VehicleSummary = {
  id: string;
  make: string;
  model: string;
  license_plate: string;
};

export type DocumentRow = {
  id: string;
  file_name: string;
  file_path: string;
  category: DocumentCategory;
  created_at: string;
  vehicle_id: string;
  url: string | null;
  vehicle: VehicleSummary | null;
  uploadedByName: string | null;
  // The vehicle's expiry for this category, on its current document only.
  expiry: string | null;
  // A newer document of the same tracked category exists for the vehicle.
  isReplaced: boolean;
};

export type MissingDocument = {
  vehicle: DocumentVehicle;
  category: ExpiringCategory;
  expiry: string | null;
};

export function DocumentsTable({
  documents,
  missing,
  vehicles,
  uploadVehicles,
  companyId,
  uploadedBy,
  canManage,
}: {
  documents: DocumentRow[];
  missing: MissingDocument[];
  // Every vehicle, for the filter.
  vehicles: VehicleSummary[];
  // Vehicles documents can be uploaded for (sold ones left out).
  uploadVehicles: DocumentVehicle[];
  companyId: string;
  uploadedBy: string;
  canManage: boolean;
}) {
  const t = useTranslations("documents");
  const tVehicles = useTranslations("vehicles");
  const tCommon = useTranslations("common");
  const categoryLabels = getDocumentCategoryLabels(tVehicles);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [vehicleFilter, setVehicleFilter] = useState("all");

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    // Lets "sa123" find "SA-123-AB".
    const plateQuery = normalizePlate(query);

    return documents.filter((doc) => {
      if (categoryFilter !== "all" && doc.category !== categoryFilter)
        return false;
      if (vehicleFilter !== "all" && doc.vehicle_id !== vehicleFilter)
        return false;
      if (!query) return true;

      const text = [doc.file_name, doc.vehicle ? vehicleLabel(doc.vehicle) : ""]
        .join(" ")
        .toLowerCase();
      return (
        text.includes(query) ||
        (plateQuery !== "" &&
          normalizePlate(doc.vehicle?.license_plate).includes(plateQuery))
      );
    });
  }, [documents, search, categoryFilter, vehicleFilter]);

  const canUpload = canManage && uploadVehicles.length > 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("page.title")}
          </h1>
          <p className="text-muted-foreground">
            {t("page.documentCount", { count: documents.length })}
          </p>
        </div>
        {canUpload ? (
          <UploadDocumentDialog
            companyId={companyId}
            uploadedBy={uploadedBy}
            vehicles={uploadVehicles}
            trigger={
              <Button>
                <Upload className="size-4" />
                {t("actions.upload")}
              </Button>
            }
          />
        ) : null}
      </div>

      {missing.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileWarning className="size-4 text-amber-700 dark:text-amber-400" />
              {t("missing.title")}
            </CardTitle>
            <CardDescription>{t("missing.description")}</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="flex max-h-72 flex-col divide-y overflow-y-auto">
              {missing.map((item) => (
                <li
                  key={`${item.vehicle.id}:${item.category}`}
                  className="flex flex-wrap items-center justify-between gap-3 py-2.5"
                >
                  <div className="flex min-w-0 flex-col">
                    <Link
                      href={`/dashboard/vehicles/${item.vehicle.id}`}
                      className="truncate text-sm font-medium hover:underline"
                    >
                      {vehicleLabel(item.vehicle)}
                    </Link>
                    <span className="text-xs text-muted-foreground">
                      {categoryLabels[item.category]}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <ExpiryBadge date={item.expiry} />
                    <UploadDocumentDialog
                      companyId={companyId}
                      uploadedBy={uploadedBy}
                      vehicles={uploadVehicles}
                      defaultVehicleId={item.vehicle.id}
                      defaultCategory={item.category}
                      trigger={
                        <Button variant="outline" size="sm">
                          <Upload className="size-4" />
                          {t("missing.upload")}
                        </Button>
                      }
                    />
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t("filters.searchPlaceholder")}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="pl-8"
          />
        </div>
        <Select
          value={categoryFilter}
          onValueChange={(value) => setCategoryFilter(value ?? "all")}
        >
          <SelectTrigger className="sm:w-48">
            <SelectValue>
              {(value: string | null) =>
                value && value !== "all"
                  ? categoryLabels[value as DocumentCategory]
                  : t("filters.allCategories")
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("filters.allCategories")}</SelectItem>
            {documentCategories.map((category) => (
              <SelectItem key={category} value={category}>
                {categoryLabels[category]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={vehicleFilter}
          onValueChange={(value) => setVehicleFilter(value ?? "all")}
        >
          <SelectTrigger className="sm:w-56">
            <SelectValue>
              {(value: string | null) => {
                const vehicle = value
                  ? vehicles.find((v) => v.id === value)
                  : null;
                return vehicle ? vehicleLabel(vehicle) : t("filters.allVehicles");
              }}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("filters.allVehicles")}</SelectItem>
            {vehicles.map((vehicle) => (
              <SelectItem key={vehicle.id} value={vehicle.id}>
                {vehicleLabel(vehicle)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted">
              <FileText className="size-6 text-muted-foreground" />
            </div>
            <div>
              <h2 className="font-medium">
                {documents.length === 0
                  ? t("emptyState.noDocumentsTitle")
                  : t("emptyState.noMatchTitle")}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {documents.length === 0
                  ? vehicles.length === 0
                    ? t("emptyState.addVehicleFirst")
                    : t("emptyState.noDocumentsDescription")
                  : t("emptyState.tryDifferentFilter")}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("table.headers.document")}</TableHead>
                <TableHead>{t("table.headers.vehicle")}</TableHead>
                <TableHead>{t("table.headers.category")}</TableHead>
                <TableHead>{t("table.headers.expires")}</TableHead>
                <TableHead>{t("table.headers.uploaded")}</TableHead>
                <TableHead>{t("table.headers.uploadedBy")}</TableHead>
                {canManage ? <TableHead className="w-12" /> : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell className="max-w-64">
                    <div className="flex items-center gap-2">
                      <FileText className="size-4 shrink-0 text-muted-foreground" />
                      {doc.url ? (
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noreferrer"
                          className="truncate font-medium hover:underline"
                        >
                          {doc.file_name}
                        </a>
                      ) : (
                        <span className="truncate font-medium">
                          {doc.file_name}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {doc.vehicle ? (
                      <Link
                        href={`/dashboard/vehicles/${doc.vehicle.id}`}
                        className="hover:underline"
                      >
                        {doc.vehicle.make} {doc.vehicle.model}
                        <span className="ml-1 text-muted-foreground">
                          {doc.vehicle.license_plate}
                        </span>
                      </Link>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {categoryLabels[doc.category]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {doc.isReplaced ? (
                      <span
                        className="text-sm text-muted-foreground"
                        title={t("table.replacedHint")}
                      >
                        {t("table.replaced")}
                      </span>
                    ) : (
                      <ExpiryBadge date={doc.expiry} />
                    )}
                  </TableCell>
                  <TableCell>{formatDate(doc.created_at)}</TableCell>
                  <TableCell>{doc.uploadedByName ?? "—"}</TableCell>
                  {canManage ? (
                    <TableCell>
                      <ConfirmDeleteDialog
                        title={t("deleteConfirm.title", { name: doc.file_name })}
                        description={t("deleteConfirm.description")}
                        onConfirm={() =>
                          deleteVehicleDocument(createClient(), doc)
                        }
                        trigger={
                          <Button variant="ghost" size="icon-sm">
                            <Trash2 className="size-4" />
                            <span className="sr-only">
                              {tCommon("actions.delete")}
                            </span>
                          </Button>
                        }
                      />
                    </TableCell>
                  ) : null}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
