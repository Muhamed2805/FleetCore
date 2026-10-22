import { hasLocale } from "next-intl";
import type { NextRequest } from "next/server";

import { routing } from "@/i18n/routing";
import { isExportDataset } from "@/lib/export";
import { buildExport } from "@/lib/export-datasets";
import { createClient } from "@/lib/supabase/server";

// CSV download of a dashboard list, e.g. /dashboard/export/expenses?category=fuel.
// The proxy already sends signed-out visitors to /login; the session is
// checked again here, and RLS scopes the data to the user's company.
export async function GET(
  request: NextRequest,
  ctx: RouteContext<"/[locale]/dashboard/export/[dataset]">
) {
  const { locale: requested, dataset } = await ctx.params;
  if (!isExportDataset(dataset)) {
    return new Response("Not found", { status: 404 });
  }
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  let csv: string | null;
  try {
    csv = await buildExport(dataset, {
      supabase,
      locale,
      params: request.nextUrl.searchParams,
    });
  } catch (error) {
    console.error(`CSV export of ${dataset} failed`, error);
    return new Response("Export failed", { status: 500 });
  }
  if (csv === null) {
    return new Response("Invalid filter", { status: 400 });
  }

  const date = new Date().toISOString().slice(0, 10);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="fleetcore-${dataset}-${date}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}
