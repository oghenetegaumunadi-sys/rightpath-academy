"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BookOpen,
  CalendarCheck,
  CalendarDays,
  ClipboardPenLine,
  GraduationCap,
  LayoutDashboard,
  ShieldCheck,
  UserRound,
  Users,
} from "lucide-react";

import { SchoolLogo } from "@/components/branding/school-logo";
import { SignOutButton } from "@/components/auth/sign-out-button";

const navigation = [
  {
    label: "Dashboard",
    href: "/head-teacher",
    icon: LayoutDashboard,
  },
  {
    label: "My Section",
    href: "/head-teacher/section",
    icon: ShieldCheck,
  },
  {
    label: "General Attendance",
    href: "/head-teacher/attendance",
    icon: CalendarCheck,
  },
  {
    label: "Section Teachers",
    href: "/head-teacher/teachers",
    icon: Users,
  },
  {
    label: "My Timetable",
    href: "/head-teacher/timetable",
    icon: CalendarDays,
  },
  {
    label: "My Classes",
    href: "/head-teacher/classes",
    icon: BookOpen,
  },
  {
    label: "Subject Attendance",
    href: "/head-teacher/subject-attendance",
    icon: GraduationCap,
  },
  {
    label: "Enter Scores",
    href: "/head-teacher/scores",
    icon: BarChart3,
  },
  {
    label: "Teaching Reports",
    href: "/head-teacher/reports",
    icon: ClipboardPenLine,
  },
  {
    label: "My Profile",
    href: "/head-teacher/profile",
    icon: UserRound,
  },
];

export function HeadTeacherSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 bg-[#075a36] lg:flex lg:flex-col">
      <div className="flex h-24 items-center border-b border-white/10 px-6">
        <SchoolLogo
          size="md"
          inverse
          href="/head-teacher"
          priority
        />
      </div>

      <div className="px-6 pt-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-green-200">
          Head Teacher Portal
        </p>
      </div>

      <nav className="flex-1 overflow-y-auto px-4 py-4">
        <div className="space-y-1.5">
          {navigation.map((item) => {
            const Icon = item.icon;

            const active =
              pathname === item.href ||
              (item.href !== "/head-teacher" &&
                pathname.startsWith(`${item.href}/`));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition",
                  active
                    ? "bg-white text-green-800 shadow-sm"
                    : "text-green-50 hover:bg-white/10 hover:text-white",
                ].join(" ")}
              >
                <Icon
                  className={[
                    "size-5",
                    active
                      ? "text-green-700"
                      : "text-green-200",
                  ].join(" ")}
                />

                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="border-t border-white/10 p-4">
        <SignOutButton />

        <div className="mt-3 rounded-2xl bg-white/10 p-4">
          <p className="text-sm font-bold text-white">
            Section Leadership
          </p>

          <p className="mt-1 text-xs leading-5 text-green-100">
            Academic oversight while retaining your normal teaching responsibilities.
          </p>
        </div>
      </div>
    </aside>
  );
}
