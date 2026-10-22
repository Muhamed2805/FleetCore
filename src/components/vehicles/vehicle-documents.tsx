"use client";

import { FileText, Trash2, Upload } from "lucide-react";
import { useTranslations } from "next-intl";

import { UploadDocumentDialog } from "@/components/documents/upload-document-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import {
  deleteVehicleDocument,
  getDocumentCategoryLabels,
  type DocumentVehicle,
} from "@/lib/documents";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";
import { formatDate } from "@/lib/vehicles";

type VehicleDocument = Database["public"]["Tables"]["vehicle_documents"]["Row"] & {
  url: string | null;
};

export function VehicleDocuments({
  vehicle,
  companyId,
  uploadedBy,
  documents,
  canManage,
}: {
  vehicle: DocumentVehicle;
  companyId: string;
  uploadedBy: string;
  documents: VehicleDocument[];
  canManage: boolean;
}) {
  const t = useTranslations("vehicles");
  const tDocuments = useTranslations("documents");
  const tCommon = useTranslations("common");
  const categoryLabels = getDocumentCategoryLabels(t);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm text-muted-foreground">
          {t("documents.title")}
        </CardTitle>
        {canManage ? (
          <CardAction>
            <UploadDocumentDialog
              companyId={companyId}
              uploadedBy={uploadedBy}
              vehicles={[vehicle]}
              defaultVehicleId={vehicle.id}
              trigger={
                <Button variant="outline" size="sm">
                  <Upload className="size-4" />
                  {tDocuments("actions.upload")}
                </Button>
              }
            />
          </CardAction>
        ) : null}
      </CardHeader>
      <CardContent>
        {documents.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t("documents.empty")}
          </p>
        ) : (
          <ul className="flex flex-col divide-y">
            {documents.map((doc) => (
              <li
                key={doc.id}
                className="flex items-center justify-between gap-3 py-3"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <FileText className="size-4 shrink-0 text-muted-foreground" />
                  <div className="flex min-w-0 flex-col">
                    {doc.url ? (
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noreferrer"
                        className="truncate text-sm font-medium hover:underline"
                      >
                        {doc.file_name}
                      </a>
                    ) : (
                      <span className="truncate text-sm font-medium">
                        {doc.file_name}
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {categoryLabels[doc.category]} · {formatDate(doc.created_at)}
                    </span>
                  </div>
                </div>
                {canManage ? (
                  <ConfirmDeleteDialog
                    title={tDocuments("deleteConfirm.title", {
                      name: doc.file_name,
                    })}
                    description={tDocuments("deleteConfirm.description")}
                    onConfirm={() => deleteVehicleDocument(createClient(), doc)}
                    trigger={
                      <Button variant="ghost" size="icon-sm">
                        <Trash2 className="size-4" />
                        <span className="sr-only">
                          {tCommon("actions.delete")}
                        </span>
                      </Button>
                    }
                  />
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
