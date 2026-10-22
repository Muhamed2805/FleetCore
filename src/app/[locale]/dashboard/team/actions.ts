"use server";

import { randomUUID } from "node:crypto";

import { revalidatePath } from "next/cache";
import { getLocale, getTranslations } from "next-intl/server";
import { z } from "zod";

import { sendInvitationEmail } from "@/lib/email";
import { getInviteUrl } from "@/lib/invitations";
import { getCurrentProfile } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/supabase/types";
import { getRoleLabels, INVITATION_TTL_DAYS, userRoles } from "@/lib/team";

const TEAM_PAGE = "/[locale]/dashboard/team";

const roleSchema = z.enum(userRoles as [UserRole, ...UserRole[]]);

const inviteSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email()),
  role: roleSchema,
});

type CurrentProfile = NonNullable<Awaited<ReturnType<typeof getCurrentProfile>>>;

// Every action re-checks the caller server-side: server actions are
// reachable by direct POST, not only through the Team page UI. The
// database functions and RLS enforce the same rules again.
async function requireAdmin() {
  const profile = await getCurrentProfile();
  return profile?.role === "admin" ? profile : null;
}

async function deliverInvitation(
  profile: CurrentProfile,
  invitation: { email: string; role: UserRole; token: string }
) {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "team" });
  const inviteUrl = await getInviteUrl(invitation.token, locale);
  const company = profile.companyName ?? "FleetCore";

  const result = await sendInvitationEmail({
    to: invitation.email,
    subject: t("email.subject", { company }),
    text: t("email.body", {
      inviter: profile.full_name ?? profile.email ?? company,
      company,
      role: getRoleLabels(t)[invitation.role],
      url: inviteUrl,
      days: INVITATION_TTL_DAYS,
    }),
  });

  return { inviteUrl, emailed: !result.skipped && !result.error };
}

export async function inviteMember(input: { email: string; role: UserRole }) {
  const t = await getTranslations("team");
  const profile = await requireAdmin();
  if (!profile) return { error: t("errors.notAllowed") };

  const parsed = inviteSchema.safeParse(input);
  if (!parsed.success) return { error: t("errors.invalidEmail") };
  const { email, role } = parsed.data;

  const supabase = await createClient();

  const { data: members } = await supabase.rpc("get_team_members");
  if ((members ?? []).some((member) => member.email.toLowerCase() === email)) {
    return { error: t("errors.alreadyMember") };
  }

  // Re-inviting the same email replaces the open invitation, so only the
  // newest link works.
  const { error: deleteError } = await supabase
    .from("company_invitations")
    .delete()
    .eq("company_id", profile.company_id)
    .eq("email", email)
    .is("accepted_at", null);
  if (deleteError) return { error: deleteError.message };

  const { data: invitation, error } = await supabase
    .from("company_invitations")
    .insert({
      company_id: profile.company_id,
      email,
      role,
      invited_by: profile.id,
    })
    .select("email, role, token")
    .single();

  if (error || !invitation) {
    return { error: error?.message ?? t("errors.generic") };
  }

  const delivery = await deliverInvitation(profile, invitation);
  revalidatePath(TEAM_PAGE, "page");
  return delivery;
}

// Issues a fresh token (the old link stops working) and a new expiry,
// then sends the email again.
export async function resendInvitation(invitationId: string) {
  const t = await getTranslations("team");
  const profile = await requireAdmin();
  if (!profile) return { error: t("errors.notAllowed") };

  const supabase = await createClient();
  const expiresAt = new Date(
    Date.now() + INVITATION_TTL_DAYS * 24 * 60 * 60 * 1000
  ).toISOString();

  const { data: invitation, error } = await supabase
    .from("company_invitations")
    .update({ token: randomUUID(), expires_at: expiresAt })
    .eq("id", invitationId)
    .is("accepted_at", null)
    .select("email, role, token")
    .single();

  if (error || !invitation) {
    return { error: error?.message ?? t("errors.generic") };
  }

  const delivery = await deliverInvitation(profile, invitation);
  revalidatePath(TEAM_PAGE, "page");
  return delivery;
}

export async function revokeInvitation(invitationId: string) {
  const t = await getTranslations("team");
  const profile = await requireAdmin();
  if (!profile) return { error: t("errors.notAllowed") };

  const supabase = await createClient();
  const { error } = await supabase
    .from("company_invitations")
    .delete()
    .eq("id", invitationId);

  if (error) return { error: error.message };

  revalidatePath(TEAM_PAGE, "page");
  return {};
}

export async function updateMemberRole(memberId: string, role: UserRole) {
  const t = await getTranslations("team");
  const profile = await requireAdmin();
  if (!profile) return { error: t("errors.notAllowed") };
  if (memberId === profile.id) return { error: t("errors.ownRole") };

  const parsedRole = roleSchema.safeParse(role);
  if (!parsedRole.success) return { error: t("errors.generic") };

  const supabase = await createClient();
  const { error } = await supabase.rpc("update_member_role", {
    member_id: memberId,
    new_role: parsedRole.data,
  });

  if (error) return { error: error.message };

  revalidatePath(TEAM_PAGE, "page");
  return {};
}

export async function removeMember(memberId: string) {
  const t = await getTranslations("team");
  const profile = await requireAdmin();
  if (!profile) return { error: t("errors.notAllowed") };
  if (memberId === profile.id) return { error: t("errors.removeSelf") };

  const supabase = await createClient();
  const { error } = await supabase.rpc("remove_member", {
    member_id: memberId,
  });

  if (error) return { error: error.message };

  revalidatePath(TEAM_PAGE, "page");
  return {};
}
