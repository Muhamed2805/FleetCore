import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import {
  AcceptInviteForm,
  SignOutToAcceptButton,
} from "@/components/team/accept-invite-form";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { getRoleLabels } from "@/lib/team";

export const metadata: Metadata = { title: "Invitation" };

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function MessageCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        {children ? <CardContent>{children}</CardContent> : null}
      </Card>
    </div>
  );
}

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const t = await getTranslations("team");
  const supabase = await createClient();

  const { data } = UUID_PATTERN.test(token)
    ? await supabase.rpc("get_invitation", { invite_token: token })
    : { data: null };
  const invitation = data?.[0] ?? null;

  const loginLink = (
    <Link href="/login" className={buttonVariants({ variant: "outline" })}>
      {t("invite.goToLogin")}
    </Link>
  );

  if (!invitation) {
    return (
      <MessageCard
        title={t("invite.invalid.title")}
        description={t("invite.invalid.description")}
      />
    );
  }

  if (invitation.accepted) {
    return (
      <MessageCard
        title={t("invite.accepted.title")}
        description={t("invite.accepted.description")}
      >
        {loginLink}
      </MessageCard>
    );
  }

  if (new Date(invitation.expires_at) <= new Date()) {
    return (
      <MessageCard
        title={t("invite.expired.title")}
        description={t("invite.expired.description", {
          company: invitation.company_name,
        })}
      />
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    return (
      <MessageCard
        title={t("invite.signedIn.title")}
        description={t("invite.signedIn.description", {
          currentEmail: user.email ?? "",
          email: invitation.email,
        })}
      >
        <SignOutToAcceptButton />
      </MessageCard>
    );
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>
            {t("invite.title", { company: invitation.company_name })}
          </CardTitle>
          <CardDescription>
            {t("invite.description", {
              role: getRoleLabels(t)[invitation.role],
            })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AcceptInviteForm token={token} email={invitation.email} />
        </CardContent>
      </Card>
    </div>
  );
}
