"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import type { Database, NotificationCategory } from "@/lib/supabase/types";
import { formatDate } from "@/lib/vehicles";
import { Bell } from "lucide-react";

type NotificationWithVehicle =
  Database["public"]["Tables"]["notifications"]["Row"] & {
    vehicle: { make: string; model: string; license_plate: string } | null;
  };

export function RemindersList({
  notifications: initialNotifications,
}: {
  notifications: NotificationWithVehicle[];
}) {
  const t = useTranslations("reminders");
  const categoryLabels: Record<NotificationCategory, string> = {
    registration: t("list.categories.registration"),
    insurance: t("list.categories.insurance"),
    inspection: t("list.categories.inspection"),
  };
  const [notifications, setNotifications] = useState(initialNotifications);

  async function markAsRead(id: string) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    const supabase = createClient();
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
  }

  if (notifications.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-muted">
            <Bell className="size-6 text-muted-foreground" />
          </div>
          <div>
            <h2 className="font-medium">{t("list.empty.title")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("list.empty.description")}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <ul className="flex flex-col divide-y rounded-xl border">
      {notifications.map((notification) => (
        <li
          key={notification.id}
          className="flex items-center justify-between gap-3 px-4 py-3"
        >
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-medium">
              {notification.vehicle
                ? `${notification.vehicle.make} ${notification.vehicle.model} (${notification.vehicle.license_plate})`
                : t("list.unknownVehicle")}{" "}
              · {categoryLabels[notification.category]}
            </span>
            <span className="text-xs text-muted-foreground">
              {t("list.expiresOn", { date: formatDate(notification.due_date) })}{" "}
              · {t("list.dayReminder", { days: notification.threshold_days })}
              {notification.email_sent_at ? ` · ${t("list.emailed")}` : ""}
            </span>
          </div>
          {notification.is_read ? (
            <Badge variant="outline">{t("list.readBadge")}</Badge>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAsRead(notification.id)}
            >
              {t("list.markAsRead")}
            </Button>
          )}
        </li>
      ))}
    </ul>
  );
}
