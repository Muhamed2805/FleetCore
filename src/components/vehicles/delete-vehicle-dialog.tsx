"use client";

import { useTranslations } from "next-intl";
import { useState, type ReactElement } from "react";

import { useRouter } from "@/i18n/navigation";
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
import { deleteVehicleWithFiles } from "@/lib/storage";
import { createClient } from "@/lib/supabase/client";

export function DeleteVehicleDialog({
  vehicleId,
  vehicleLabel,
  trigger,
  redirectTo,
}: {
  vehicleId: string;
  vehicleLabel: string;
  trigger: ReactElement;
  // Where to go once deleted, e.g. from the vehicle's own page, which
  // would otherwise refresh into a 404.
  redirectTo?: string;
}) {
  const t = useTranslations("vehicles");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setIsDeleting(true);
    setError(null);

    const { error } = await deleteVehicleWithFiles(createClient(), vehicleId);

    setIsDeleting(false);

    if (error) {
      setError(error);
      return;
    }

    setOpen(false);
    if (redirectTo) {
      router.push(redirectTo);
    }
    router.refresh();
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger render={trigger} />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t("deleteDialog.title", { name: vehicleLabel })}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t("deleteDialog.description")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <AlertDialogFooter>
          <AlertDialogCancel>{tCommon("actions.cancel")}</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={isDeleting}
            onClick={handleDelete}
          >
            {isDeleting ? tCommon("actions.deleting") : tCommon("actions.delete")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
