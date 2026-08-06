import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  CalendarCheck,
  ClipboardList,
  FileText,
  GraduationCap,
  Users,
} from "lucide-react";

import { Badge, Card } from "@/components/ui";

export const metadata: Metadata = {
  title: "Reports",
};

const reportModules = [
  {
    title: "Daily Teaching Reports",
    description:
      "Review classes taught, subjects covered, topics taught, lesson status and missing teacher submissions.",
    href: "/reports/daily-teaching",
    icon: BookOpenCheck,
    status: "Available",
    available: true,
  },
  {
    title: "Student Reports",
    description:
      "Enrollment summaries, class lists, active students and admission statistics.",
    href: "/reports/students",
    icon: Users,
    status: "Available",
    available: true,
  },
  {
    title: "Attendance Reports",
    description:
      "Daily attendance summaries, absences, late arrivals and class completion.",
    href: "/reports/attendance",
    icon: CalendarCheck,
    status: "Available",
    available: true,
  },
  {
    title: "Academic Reports",
    description:
      "Published results, class performance, subject performance and report cards.",
    href: "/reports/academic",
    icon: GraduationCap,
    status: "Available",
    available: true,
  },
  {
    title: "Teacher Workload",
    description:
      "Teacher assignments, classes taught, subjects assigned and submission activity.",
    href: "/reports/teacher-workload",
    icon: ClipboardList,
    status: "Available",
    available: true,
  },
  {
    title: "Advanced Analytics",
    description:
      "Cross-term trends, printable summaries, CSV exports and deeper school analytics.",
    href: "#",
    icon: BarChart3,
    status: "Coming Soon",
    available: false,
  },
];

export default function ReportsPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950">
            Reports
          </h1>

          <p className="mt-2 max-w-3xl text-slate-600">
            Access operational, academic, attendance and teaching reports from one place.
          </p>
        </div>

        <Link
          href="/reports/daily-teaching/new"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-green-800"
        >
          <FileText className="size-5" />
          New Teaching Report
        </Link>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {reportModules.map((module) => {
          const Icon = module.icon;

          const content = (
            <Card className="h-full p-0">
              <div className="flex h-full flex-col p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex size-12 items-center justify-center rounded-2xl bg-green-100 text-green-700">
                    <Icon className="size-6" />
                  </div>

                  <Badge
                    variant={
                      module.available
                        ? "success"
                        : "warning"
                    }
                  >
                    {module.status}
                  </Badge>
                </div>

                <h2 className="mt-5 text-xl font-semibold text-slate-950">
                  {module.title}
                </h2>

                <p className="mt-3 flex-1 leading-7 text-slate-600">
                  {module.description}
                </p>

                <div className="mt-6 flex items-center gap-2 text-sm font-semibold text-green-700">
                  {module.available
                    ? "Open report"
                    : "Not available yet"}

                  {module.available ? (
                    <ArrowRight className="size-4" />
                  ) : null}
                </div>
              </div>
            </Card>
          );

          return module.available ? (
            <Link
              key={module.title}
              href={module.href}
              className="block transition hover:-translate-y-1"
            >
              {content}
            </Link>
          ) : (
            <div
              key={module.title}
              className="opacity-75"
            >
              {content}
            </div>
          );
        })}
      </section>
    </div>
  );
}
