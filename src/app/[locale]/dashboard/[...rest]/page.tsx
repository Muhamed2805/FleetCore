import { notFound } from "next/navigation";

// Keeps unknown dashboard URLs inside the dashboard shell: renders
// dashboard/not-found.tsx instead of the full-page [locale] 404.
export default function DashboardCatchAllPage() {
  notFound();
}
