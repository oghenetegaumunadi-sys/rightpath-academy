import type { Metadata } from "next";
import { GraduationCap } from "lucide-react";

import { ReportComingSoon } from "@/components/reports/report-coming-soon";

export const metadata: Metadata = {
  title: "Academic Reports — Coming Soon",
};

export default function AcademicReportsPage() {
  return (
    <ReportComingSoon
      title="Academic Reports"
      description="Advanced performance analysis and cross-term academic reports are planned for a future release."
      icon={<GraduationCap className="size-8" />}
      features={[
        "Subject performance summaries",
        "Class average comparisons",
        "Pass and fail distributions",
        "Cross-term academic trends",
      ]}
    />
  );
}
