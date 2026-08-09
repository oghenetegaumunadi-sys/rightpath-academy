"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  BarChart3,
  BookOpen,
  CalendarCheck,
  ClipboardPenLine,
  LayoutDashboard,
  Menu,
  UserRound,
  X,
} from "lucide-react";

import { SchoolLogo } from "@/components/branding/school-logo";
import { SignOutButton } from "@/components/auth/sign-out-button";

const navigation = [
  {
    label: "My Dashboard",
    href: "/teacher",
    icon: LayoutDashboard,
  },
  {
    label: "My Classes",
    href: "/teacher/classes",
    icon: BookOpen,
  },
  {
    label: "Take Attendance",
    href: "/teacher/attendance",
    icon: CalendarCheck,
  },
  {
    label: "Enter Scores",
    href: "/teacher/scores",
    icon: BarChart3,
  },
  {
    label: "Teaching Reports",
    href: "/teacher/reports",
    icon: ClipboardPenLine,
  },
  {
    label: "My Profile",
    href: "/teacher/profile",
    icon: UserRound,
  },
];

export function TeacherMobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex size-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 lg:hidden"
        aria-label="Open teacher navigation"
      >
        <Menu className="size-5" />
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
          />

          <aside className="relative flex h-full w-[86%] max-w-sm flex-col bg-[#075a36] shadow-2xl">
            <div className="flex h-20 items-center justify-between border-b border-white/10 px-5">
              <SchoolLogo
                size="md"
                inverse
                href="/teacher"
                priority
              />

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex size-10 items-center justify-center rounded-xl bg-white/10 text-white"
                aria-label="Close navigation"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="px-5 pt-6">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-green-200">
                Teacher Portal
              </p>
            </div>

            <nav className="flex-1 overflow-y-auto px-4 py-4">
              <div className="space-y-1.5">
                {navigation.map((item) => {
                  const Icon = item.icon;

                  const active =
                    pathname === item.href ||
                    (item.href !== "/teacher" &&
                      pathname.startsWith(
                        `${item.href}/`,
                      ));

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
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
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}
