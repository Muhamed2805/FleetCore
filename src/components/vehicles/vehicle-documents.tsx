"use client";

import { useRouter } from "next/navigation";
import { FileText, Trash2, Upload } from "lucide-react";
import { useRef, useState, type FormEvent } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Database, DocumentCategory } from "@/lib/supabase/types";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/vehicles";

type VehicleDocument = Database["public"]["Tables"]["vehicle_documents"]["Row"] & {
  url: string | null;
};

const categoryLabels: Record<DocumentCategory, string> = {
  registration: "Registration",
  insurance: "Insurance",
  inspection: "Inspection",
  other: "Other",
};

export function VehicleDocuments({
  vehicleId,
  companyId,
  uploadedBy,
  documents,
  canManage,
}: {
  vehicleId: string;
  companyId: string;
  uploadedBy: string;
  documents: VehicleDocument[];
  canManage: boolean;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [category, setCategory] = useState<DocumentCategory>("registration");
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpload(event: FormEvent) {
    event.preventDefault();
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setError("Choose a file first.");
      return;
    }

    setIsUploading(true);
    setError(null);

    const supabase = createClient();
    const path = `${companyId}/${vehicleId}/${Date.now()}-${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from("vehicle-documents")
      .upload(path, file);

    if (uploadError) {
      setIsUploading(false);
      setError(uploadError.message);
      return;
    }

    const { error: insertError } = await supabase
      .from("vehicle_documents")
      .insert({
        company_id: companyId,
        vehicle_id: vehicleId,
        category,
        file_path: path,
        file_name: file.name,
        uploaded_by: uploadedBy,
      });

    setIsUploading(false);

    if (insertError) {
      await supabase.storage.from("vehicle-documents").remove([path]);
      setError(insertError.message);
      return;
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    router.refresh();
  }

  async function handleDelete(doc: VehicleDocument) {
    const supabase = createClient();
    await supabase.storage.from("vehicle-documents").remove([doc.file_path]);
    await supabase.from("vehicle_documents").delete().eq("id", doc.id);
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm text-muted-foreground">
          Documents
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {canManage ? (
          <form
            onSubmit={handleUpload}
            className="flex flex-col gap-3 sm:flex-row sm:items-end"
          >
            <div className="flex flex-col gap-2">
              <span className="text-xs text-muted-foreground">Category</span>
              <Select
                value={category}
                onValueChange={(value) =>
                  setCategory(value as DocumentCategory)
                }
              >
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue>
                    {(value: DocumentCategory | null) =>
                      value ? categoryLabels[value] : "Category"
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(categoryLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              className="flex-1 rounded-lg border border-input bg-transparent text-sm file:mr-3 file:h-8 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:text-sm file:font-medium"
            />
            <Button type="submit" disabled={isUploading}>
              <Upload className="size-4" />
              {isUploading ? "Uploading…" : "Upload"}
            </Button>
          </form>
        ) : null}

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        {documents.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No documents uploaded yet.
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
                  <AlertDialog>
                    <AlertDialogTrigger
                      render={<Button variant="ghost" size="icon-sm" />}
                    >
                      <Trash2 className="size-4" />
                      <span className="sr-only">Delete</span>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Delete {doc.file_name}?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          This can&apos;t be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          variant="destructive"
                          onClick={() => handleDelete(doc)}
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
