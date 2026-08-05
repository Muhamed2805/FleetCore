import { FileText } from "lucide-react";
import type { Metadata } from "next";

import { ComingSoon } from "@/components/dashboard/coming-soon";

export const metadata: Metadata = { title: "Documents" };

export default function DocumentsPage() {
  return (
    <ComingSoon
      icon={FileText}
      title="Documents"
      description="Registration papers, insurance and inspection documents, with AI-powered data extraction. Coming in a later phase."
    />
  );
}
