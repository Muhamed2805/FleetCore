import { redirect } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCurrentProfile } from "@/lib/supabase/queries";

export default async function DashboardPage() {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/login");
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Welcome{profile.full_name ? `, ${profile.full_name}` : ""}
          </h1>
          <p className="text-muted-foreground">{profile.companyName}</p>
        </div>
        <form action="/auth/signout" method="post">
          <Button type="submit" variant="outline">
            Sign out
          </Button>
        </form>
      </div>

      <Card className="max-w-sm">
        <CardHeader>
          <CardTitle>Your account</CardTitle>
          <CardDescription>{profile.email}</CardDescription>
        </CardHeader>
        <CardContent>
          <Badge variant="secondary" className="capitalize">
            {profile.role.replace("_", " ")}
          </Badge>
        </CardContent>
      </Card>
    </div>
  );
}
