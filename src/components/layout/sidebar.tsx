"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BookOpen,
  CalendarCheck,
  ClipboardList,
  FileText,
  LayoutDashboard,
  Library,
  Settings,
  ShieldCheck,
  UserCog,
  Users,
  WalletCards,
  X,
} from "lucide-react";

import { SchoolLogo } from "@/components/branding/school-logo";

type SidebarProps = {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
};

const navigation = [
  {
    label: "Dashboard",
    href: "/dashboard/principal",
    icon: LayoutDashboard,
  },
  {
    label: "Students",
    href: "/students",
    icon: Users,
  },
  {
    label: "Teachers",
    href: "/teachers",
    icon: UserCog,
  },
  {
    label: "Classes",
    href: "/classes",
    icon: BookOpen,
  },
  {
    label: "Subjects",
    href: "/subjects",
    icon: ClipboardList,
  },
  {
    label: "Attendance",
    href: "/attendance",
    icon: CalendarCheck,
  },
  {
    label: "Results",
    href: "/results/score-entry",
    icon: BarChart3,
  },
  {
    label: "Report Cards",
    href: "/results/report-cards",
    icon: FileText,
  },
  {
    label: "Finance",
    href: "/finance",
    icon: WalletCards,
  },
  {
    label: "Library",
    href: "/library",
    icon: Library,
  },
  {
    label: "Reports",
    href: "/reports",
    icon: ShieldCheck,
  },
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
  },
  {
    label: "User Management",
    href: "/users",
    icon: UserCog,
  },
];

function SidebarContent({
  onNavigate,
}: {
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col bg-[#075a36] text-white">
      <div className="flex h-24 items-center border-b border-white/10 px-6">
        <SchoolLogo
          size="md"
          inverse
          href="/dashboard/principal"
          priority
        />
      </div>

      <nav className="flex-1 overflow-y-auto px-4 py-6">
        <p className="mb-3 px-3 text-[11px] font-bold uppercase tracking-[0.2em] text-green-200">
          Main Menu
        </p>

        <div className="space-y-1.5">
          {navigation.map((item) => {
            const Icon = item.icon;

            const active =
              pathname === item.href ||
              pathname.startsWith(`${item.href}/`) ||
              (item.href === "/results/score-entry" &&
                pathname.startsWith("/results"));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={[
                  "group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition",
                  active
                    ? "bg-white text-green-800 shadow-sm"
                    : "text-green-50 hover:bg-white/10 hover:text-white",
                ].join(" ")}
              >
                <Icon
                  className={[
                    "size-5 shrink-0",
                    active
                      ? "text-green-700"
                      : "text-green-200 group-hover:text-white",
                  ].join(" ")}
                />

                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="border-t border-white/10 p-4">
        <div className="rounded-2xl bg-white/10 p-4">
          <p className="text-sm font-bold text-white">
            RightPath Academy
          </p>

          <p className="mt-1 text-xs leading-5 text-green-100">
            One connected platform for school administration.
          </p>
        </div>

        <p className="mt-4 px-2 text-[11px] text-green-200">
          Powered by Kosta Technologies
        </p>
      </div>
    </div>
  );
}

export function Sidebar({
  mobileOpen = false,
  onMobileClose,
}: SidebarProps) {
  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 lg:block">
        <SidebarContent />
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation overlay"
            className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm"
            onClick={onMobileClose}
          />

          <aside className="relative h-full w-[86%] max-w-72 shadow-2xl">
            <button
              type="button"
              onClick={onMobileClose}
              aria-label="Close navigation"
              className="absolute right-4 top-4 z-10 rounded-xl bg-white/10 p-2 text-white transition hover:bg-white/20"
            >
              <X className="size-5" />
            </button>

            <SidebarContent
              onNavigate={onMobileClose}
            />
          </aside>
        </div>
      ) : null}
    </>
  );
}
