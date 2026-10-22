import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";

import { InviteMemberDialog } from "@/components/team/invite-member-dialog";
import { MembersTable } from "@/components/team/members-table";
import { PendingInvitations } from "@/components/team/pending-invitations";
import { redirect } from "@/i18n/navigation";
import { getInviteUrl } from "@/lib/invitations";
import { getCurrentProfile } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Team" };

export default async function TeamPage() {
  const locale = await getLocale();
  const t = await getTranslations("team");
  const profile = await getCurrentProfile();
  if (!profile) {
    redirect({ href: "/login", locale });
    return null;
  }
  if (profile.role !== "admin") {
    redirect({ href: "/dashboard", locale });
    return null;
  }

  const supabase = await createClient();

  const [{ data: members }, { data: invitations }] = await Promise.all([
    supabase.rpc("get_team_members"),
    supabase
      .from("company_invitations")
      .select("id, email, role, token, created_at, expires_at")
      .is("accepted_at", null)
      .order("created_at", { ascending: false }),
  ]);

  const now = new Date();
  const pendingInvitations = await Promise.all(
    (invitations ?? []).map(async ({ token, ...invitation }) => ({
      ...invitation,
      isExpired: new Date(invitation.expires_at) <= now,
      inviteUrl: await getInviteUrl(token, locale),
    }))
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("page.title")}
          </h1>
          <p className="text-muted-foreground">
            {t("page.memberCount", { count: members?.length ?? 0 })}
          </p>
        </div>
        <InviteMemberDialog />
      </div>

      <MembersTable members={members ?? []} currentUserId={profile.id} />

      {pendingInvitations.length > 0 ? (
        <PendingInvitations invitations={pendingInvitations} />
      ) : null}
    </div>
  );
}
