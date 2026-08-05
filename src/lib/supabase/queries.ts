import { cache } from "react";

import { createClient } from "@/lib/supabase/server";

export const getCurrentProfile = cache(async function getCurrentProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, role, company_id")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return null;
  }

  const { data: company } = await supabase
    .from("companies")
    .select("name")
    .eq("id", profile.company_id)
    .single();

  return { ...profile, email: user.email, companyName: company?.name ?? null };
});

export async function getNotificationsSummary() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { notifications: [], unreadCount: 0 };
  }

  const [{ data: notifications }, { count: unreadCount }] = await Promise.all([
    supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("is_read", false),
  ]);

  const vehicleIds = [...new Set((notifications ?? []).map((n) => n.vehicle_id))];
  const { data: vehicles } =
    vehicleIds.length > 0
      ? await supabase
          .from("vehicles")
          .select("id, make, model, license_plate")
          .in("id", vehicleIds)
      : { data: [] };
  const vehicleById = new Map((vehicles ?? []).map((v) => [v.id, v]));

  return {
    notifications: (notifications ?? []).map((notification) => ({
      ...notification,
      vehicle: vehicleById.get(notification.vehicle_id) ?? null,
    })),
    unreadCount: unreadCount ?? 0,
  };
}
