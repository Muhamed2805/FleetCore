import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";

import { DamageReportsTable } from "@/components/damage-reports/damage-reports-table";
import { redirect } from "@/i18n/navigation";
import { getCurrentProfile } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

type Expense = Database["public"]["Tables"]["expenses"]["Row"];
type DamageReportPhoto =
  Database["public"]["Tables"]["damage_report_photos"]["Row"];

export const metadata: Metadata = { title: "Damage reports" };

export default async function DamageReportsPage() {
  const t = await getTranslations("damageReports");
  const profile = await getCurrentProfile();
  if (!profile) {
    redirect({ href: "/login", locale: await getLocale() });
    return null;
  }

  const supabase = await createClient();

  const [{ data: reports }, { data: photos }, { data: vehicles }, { data: profiles }] =
    await Promise.all([
      supabase
        .from("damage_reports")
        .select("*")
        .order("reported_at", { ascending: false }),
      supabase
        .from("damage_report_photos")
        .select("*")
        .order("created_at", { ascending: true }),
      supabase
        .from("vehicles")
        .select("id, make, model, license_plate")
        .order("make"),
      supabase.from("profiles").select("id, full_name"),
    ]);

  const expenseIds = (reports ?? [])
    .map((report) => report.expense_id)
    .filter((id): id is string => Boolean(id));

  const { data: expenses } =
    expenseIds.length > 0
      ? await supabase.from("expenses").select("*").in("id", expenseIds)
      : { data: [] as Expense[] };

  const photoPaths = (photos ?? []).map((photo) => photo.file_path);
  const { data: signedUrls } =
    photoPaths.length > 0
      ? await supabase.storage
          .from("damage-reports")
          .createSignedUrls(photoPaths, 3600)
      : { data: [] as { path: string | null; signedUrl: string }[] };

  const urlByPath = new Map(
    (signedUrls ?? []).map((entry) => [entry.path, entry.signedUrl])
  );
  const vehiclesById = new Map((vehicles ?? []).map((v) => [v.id, v]));
  const profilesById = new Map((profiles ?? []).map((p) => [p.id, p]));
  const expensesById = new Map((expenses ?? []).map((e) => [e.id, e]));
  const photosByReport = new Map<string, DamageReportPhoto[]>();
  for (const photo of photos ?? []) {
    const list = photosByReport.get(photo.damage_report_id) ?? [];
    list.push(photo);
    photosByReport.set(photo.damage_report_id, list);
  }

  const reportsWithDetails = (reports ?? []).map((report) => ({
    ...report,
    vehicle: vehiclesById.get(report.vehicle_id) ?? null,
    reportedByName: report.reported_by
      ? (profilesById.get(report.reported_by)?.full_name ??
        t("table.unnamedReporter"))
      : null,
    expense: report.expense_id
      ? (expensesById.get(report.expense_id) ?? null)
      : null,
    photos: (photosByReport.get(report.id) ?? []).map((photo) => ({
      id: photo.id,
      url: urlByPath.get(photo.file_path) ?? null,
      fileName: photo.file_path.split("/").pop() ?? "photo",
    })),
  }));

  const canManage =
    profile.role === "admin" ||
    profile.role === "fleet_manager" ||
    profile.role === "mechanic";

  return (
    <DamageReportsTable
      reports={reportsWithDetails}
      vehicles={vehicles ?? []}
      companyId={profile.company_id}
      reportedBy={profile.id}
      canManage={canManage}
    />
  );
}
