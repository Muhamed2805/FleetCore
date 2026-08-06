import { getLocale } from "next-intl/server";

import { GlobalSearch } from "@/components/dashboard/global-search";
import { MobileNav } from "@/components/dashboard/mobile-nav";
import { NotificationsBell } from "@/components/dashboard/notifications-bell";
import { Sidebar } from "@/components/dashboard/sidebar";
import { UserMenu } from "@/components/dashboard/user-menu";
import { LanguageSelector } from "@/components/language-selector";
import { ThemeToggle } from "@/components/theme-toggle";
import { redirect } from "@/i18n/navigation";
import {
  getCurrentProfile,
  getNotificationsSummary,
  getSearchIndex,
} from "@/lib/supabase/queries";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentProfile();

  if (!profile) {
    const locale = await getLocale();
    redirect({ href: "/login", locale });
    return null;
  }

  const { notifications, unreadCount } = await getNotificationsSummary();
  const searchItems = await getSearchIndex();

  return (
    <div className="flex min-h-screen">
      <Sidebar role={profile.role} />
      <div className="flex flex-1 flex-col">
        <header className="flex h-14 items-center justify-between gap-4 border-b px-4">
          <div className="flex items-center gap-2">
            <MobileNav role={profile.role} />
            <span className="hidden text-sm font-medium text-muted-foreground sm:inline">
              {profile.companyName}
            </span>
          </div>
          <div className="flex flex-1 justify-center px-2">
            <GlobalSearch items={searchItems} />
          </div>
          <div className="flex items-center gap-2">
            <NotificationsBell
              initialNotifications={notifications}
              initialUnreadCount={unreadCount}
            />
            <LanguageSelector />
            <ThemeToggle />
            <UserMenu
              fullName={profile.full_name}
              email={profile.email}
              role={profile.role}
            />
          </div>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
