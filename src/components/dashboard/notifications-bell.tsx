"use client";

import { Bell } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link, useRouter } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Database, NotificationCategory } from "@/lib/supabase/types";
import { formatDate } from "@/lib/vehicles";

type NotificationWithVehicle =
  Database["public"]["Tables"]["notifications"]["Row"] & {
    vehicle: { make: string; model: string; license_plate: string } | null;
  };

export function NotificationsBell({
  initialNotifications,
  initialUnreadCount,
}: {
  initialNotifications: NotificationWithVehicle[];
  initialUnreadCount: number;
}) {
  const t = useTranslations("dashboardShell");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [notifications, setNotifications] = useState(initialNotifications);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);

  const categoryLabels: Record<NotificationCategory, string> = {
    registration: t("notifications.categories.registration"),
    insurance: t("notifications.categories.insurance"),
    inspection: t("notifications.categories.inspection"),
  };

  async function markAsRead(id: string) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    const supabase = createClient();
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    router.refresh();
  }

  async function markAllRead() {
    const unreadIds = notifications
      .filter((n) => !n.is_read)
      .map((n) => n.id);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);

    if (unreadIds.length === 0) return;
    const supabase = createClient();
    await supabase.from("notifications").update({ is_read: true }).in("id", unreadIds);
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="outline" size="icon" className="relative" />}
      >
        <Bell className="size-4" />
        {unreadCount > 0 ? (
          <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
        <span className="sr-only">{t("notifications.srLabel")}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuGroup>
          <div className="flex items-center justify-between px-1.5 py-1">
            <DropdownMenuLabel className="p-0">
              {t("notifications.heading")}
            </DropdownMenuLabel>
            {unreadCount > 0 ? (
              <button
                type="button"
                onClick={markAllRead}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                {t("notifications.markAllRead")}
              </button>
            ) : null}
          </div>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <p className="px-1.5 py-4 text-center text-sm text-muted-foreground">
            {t("notifications.empty")}
          </p>
        ) : (
          notifications.map((notification) => (
            <DropdownMenuItem
              key={notification.id}
              onClick={() =>
                !notification.is_read && markAsRead(notification.id)
              }
              className={notification.is_read ? "opacity-60" : ""}
            >
              <div className="flex flex-col gap-0.5 py-0.5">
                <span className="text-sm">
                  {t("notifications.itemTitle", {
                    vehicle: notification.vehicle
                      ? `${notification.vehicle.make} ${notification.vehicle.model}`
                      : t("notifications.vehicleFallback"),
                    category: categoryLabels[notification.category],
                  })}
                </span>
                <span className="text-xs text-muted-foreground">
                  {t("notifications.expiresLabel", {
                    date: formatDate(notification.due_date),
                    days: notification.threshold_days,
                  })}
                </span>
              </div>
            </DropdownMenuItem>
          ))
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href="/dashboard/reminders" />}>
          {tCommon("actions.viewAll")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
