import { FileText } from "lucide-react";

import { ComingSoon } from "@/components/dashboard/coming-soon";

export default function DocumentsPage() {
  return (
    <ComingSoon
      icon={FileText}
      title="Documents"
      description="Registration papers, insurance and inspection documents, with AI-powered data extraction. Coming in a later phase."
    />
  );
}
