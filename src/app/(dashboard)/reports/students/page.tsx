import type { Metadata } from "next";
import { Users } from "lucide-react";

import { ReportComingSoon } from "@/components/reports/report-coming-soon";

export const metadata: Metadata = {
  title: "Student Reports — Coming Soon",
};

export default function StudentReportsPage() {
  return (
    <ReportComingSoon
      title="Student Reports"
      description="Detailed enrollment, admission and student population reports are planned for a future release."
      icon={<Users className="size-8" />}
      features={[
        "Students by class and session",
        "Admissions by date range",
        "Active and archived student summaries",
        "Gender and enrollment distribution",
      ]}
    />
  );
}
