import { notFound } from "next/navigation";

// Unmatched URLs would otherwise fall through to app/not-found.tsx, which
// sits outside the [locale] layout (no translations, no theme). Catching
// them here renders the localized [locale]/not-found.tsx instead.
export default function CatchAllPage() {
  notFound();
}
