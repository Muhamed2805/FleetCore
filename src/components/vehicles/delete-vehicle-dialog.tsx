"use client";

import { useRouter } from "next/navigation";
import { useState, type ReactElement } from "react";

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
import { createClient } from "@/lib/supabase/client";

export function DeleteVehicleDialog({
  vehicleId,
  vehicleLabel,
  trigger,
  onDeleted,
}: {
  vehicleId: string;
  vehicleLabel: string;
  trigger: ReactElement;
  onDeleted?: () => void;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setIsDeleting(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase
      .from("vehicles")
      .delete()
      .eq("id", vehicleId);

    setIsDeleting(false);

    if (error) {
      setError(error.message);
      return;
    }

    setOpen(false);
    if (onDeleted) {
      onDeleted();
    } else {
      router.refresh();
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger render={trigger} />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {vehicleLabel}?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently deletes the vehicle and its documents. This
            can&apos;t be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={isDeleting}
            onClick={handleDelete}
          >
            {isDeleting ? "Deleting…" : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
