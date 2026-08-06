"use client";

import {
  Bell,
  Menu,
  Search,
  UserRound,
} from "lucide-react";

type TopbarProps = {
  onOpenNavigation?: () => void;
};

export function Topbar({
  onOpenNavigation,
}: TopbarProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="flex h-20 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onOpenNavigation}
            className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-600 transition hover:border-green-200 hover:bg-green-50 hover:text-green-800 lg:hidden"
            aria-label="Open navigation"
          >
            <Menu className="size-5" />
          </button>

          <div className="relative hidden md:block">
            <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />

            <input
              type="search"
              placeholder="Search students, teachers, classes..."
              className="w-80 rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-100 xl:w-96"
            />
          </div>

          <div className="md:hidden">
            <p className="truncate text-sm font-bold text-slate-950">
              RightPath Academy
            </p>

            <p className="text-xs text-slate-500">
              School Management System
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <button
            type="button"
            className="relative rounded-xl border border-slate-200 bg-white p-2.5 text-slate-600 transition hover:border-green-200 hover:bg-green-50 hover:text-green-800"
            aria-label="Notifications"
          >
            <Bell className="size-5" />

            <span className="absolute right-2 top-2 size-2 rounded-full bg-amber-500 ring-2 ring-white" />
          </button>

          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
            <div className="flex size-9 items-center justify-center rounded-xl bg-green-100 text-green-700">
              <UserRound className="size-5" />
            </div>

            <div className="hidden text-left sm:block">
              <p className="text-sm font-bold text-slate-900">
                Principal
              </p>

              <p className="text-xs text-slate-500">
                School Administrator
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
