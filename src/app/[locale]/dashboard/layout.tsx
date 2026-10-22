import { getLocale, getTranslations } from "next-intl/server";

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
import { getRoleLabels } from "@/lib/team";

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

  const [{ notifications, unreadCount }, searchItems, tTeam] =
    await Promise.all([
      getNotificationsSummary(),
      getSearchIndex(),
      getTranslations("team"),
    ]);
  const roleLabel = getRoleLabels(tTeam)[profile.role];

  return (
    <div className="flex min-h-svh">
      <Sidebar
        role={profile.role}
        roleLabel={roleLabel}
        companyName={profile.companyName}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur-md lg:px-8">
          <MobileNav
            role={profile.role}
            roleLabel={roleLabel}
            companyName={profile.companyName}
          />
          <div className="flex flex-1 items-center">
            <GlobalSearch items={searchItems} />
          </div>
          <div className="flex items-center gap-1">
            <NotificationsBell
              initialNotifications={notifications}
              initialUnreadCount={unreadCount}
            />
            <LanguageSelector variant="ghost" />
            <ThemeToggle variant="ghost" />
            <div className="mx-1.5 hidden h-5 w-px bg-border sm:block" />
            <UserMenu
              fullName={profile.full_name}
              email={profile.email}
              role={profile.role}
            />
          </div>
        </header>
        <main className="flex-1">
          <div className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
