"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  CalendarCheck,
  FileText,
  LayoutDashboard,
  UserRound,
  UsersRound,
} from "lucide-react";

import { SchoolLogo } from "@/components/branding/school-logo";
import { SignOutButton } from "@/components/auth/sign-out-button";

const navigation = [
  {
    label: "Dashboard",
    href: "/parent",
    icon: LayoutDashboard,
  },
  {
    label: "My Children",
    href: "/parent/children",
    icon: UsersRound,
  },
  {
    label: "Attendance",
    href: "/parent/attendance",
    icon: CalendarCheck,
  },
  {
    label: "Results",
    href: "/parent/results",
    icon: FileText,
  },
  {
    label: "Announcements",
    href: "/parent/announcements",
    icon: Bell,
  },
  {
    label: "My Profile",
    href: "/parent/profile",
    icon: UserRound,
  },
];

export function ParentSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 bg-[#075a36] lg:flex lg:flex-col">
      <div className="flex h-24 items-center border-b border-white/10 px-6">
        <SchoolLogo
          size="md"
          inverse
          href="/parent"
          priority
        />
      </div>

      <div className="px-6 pt-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-green-200">
          Parent Portal
        </p>
      </div>

      <nav className="flex-1 overflow-y-auto px-4 py-4">
        <div className="space-y-1.5">
          {navigation.map((item) => {
            const Icon = item.icon;

            const active =
              pathname === item.href ||
              (item.href !== "/parent" &&
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
      </div>
    </aside>
  );
}
