import { Badge } from "@/components/ui/badge";
import { expiryUrgency, formatDate } from "@/lib/vehicles";

export function ExpiryBadge({ date }: { date: string | null }) {
  const urgency = expiryUrgency(date);

  if (urgency === "none") {
    return <span className="text-sm text-muted-foreground">—</span>;
  }

  const variant =
    urgency === "expired"
      ? "destructive"
      : urgency === "soon"
        ? "secondary"
        : "outline";

  return (
    <Badge variant={variant} className="font-normal">
      {formatDate(date)}
    </Badge>
  );
}
