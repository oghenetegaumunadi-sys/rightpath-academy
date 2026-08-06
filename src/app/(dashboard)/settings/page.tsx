import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Bell,
  BookOpenCheck,
  GraduationCap,
  LockKeyhole,
  Palette,
  School,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";

import { Badge, Card } from "@/components/ui";

export const metadata: Metadata = {
  title: "Settings",
};

const settingsSections = [
  {
    title: "School Profile",
    description:
      "Manage the school name, contact details, address, motto, prefixes, currency and time zone.",
    href: "/settings/school-profile",
    icon: School,
    active: true,
  },
  {
    title: "Academic Setup",
    description:
      "Manage academic sessions, terms, current session settings and term dates.",
    href: "/settings/academic",
    icon: GraduationCap,
    active: false,
  },
  {
    title: "Assessment Structure",
    description:
      "Configure CA, Assignment and Examination scores and grading rules.",
    href: "/settings/assessment",
    icon: BookOpenCheck,
    active: false,
  },
  {
    title: "Branding",
    description:
      "Manage the school logo, colours, printed documents and report-card identity.",
    href: "/settings/branding",
    icon: Palette,
    active: false,
  },
  {
    title: "Users and Roles",
    description:
      "Review staff accounts, access roles and administrative permissions.",
    href: "/users",
    icon: Users,
    active: true,
  },
  {
    title: "Notifications",
    description:
      "Configure email alerts, teaching-report reminders and result notices.",
    href: "#",
    icon: Bell,
    active: false,
  },
  {
    title: "Security",
    description:
      "Configure password policies, sessions, audit controls and account security.",
    href: "#",
    icon: LockKeyhole,
    active: false,
  },
  {
    title: "Data and Backups",
    description:
      "Manage exports, backup processes, archive rules and system records.",
    href: "#",
    icon: ShieldCheck,
    active: false,
  },
];

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <section className="flex items-start gap-4">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-green-700 text-white">
          <Settings className="size-6" />
        </div>

        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950">
            Settings
          </h1>

          <p className="mt-2 max-w-3xl text-slate-600">
            Manage school identity, academic configuration,
            branding, access and system preferences.
          </p>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {settingsSections.map((section) => {
          const Icon = section.icon;

          const content = (
            <Card className="h-full p-0">
              <div className="flex h-full flex-col p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex size-12 items-center justify-center rounded-2xl bg-green-100 text-green-700">
                    <Icon className="size-6" />
                  </div>

                  <Badge
                    variant={
                      section.active
                        ? "success"
                        : "warning"
                    }
                  >
                    {section.active
                      ? "Available"
                      : "Coming Soon"}
                  </Badge>
                </div>

                <h2 className="mt-5 text-xl font-semibold text-slate-950">
                  {section.title}
                </h2>

                <p className="mt-3 flex-1 leading-7 text-slate-600">
                  {section.description}
                </p>

                <div className="mt-6 flex items-center gap-2 text-sm font-semibold text-green-700">
                  {section.active
                    ? "Open settings"
                    : "Not available yet"}

                  {section.active ? (
                    <ArrowRight className="size-4" />
                  ) : null}
                </div>
              </div>
            </Card>
          );

          return section.active ? (
            <Link
              key={section.title}
              href={section.href}
              className="block transition hover:-translate-y-1"
            >
              {content}
            </Link>
          ) : (
            <div
              key={section.title}
              className="opacity-80"
            >
              {content}
            </div>
          );
        })}
      </section>
    </div>
  );
}
