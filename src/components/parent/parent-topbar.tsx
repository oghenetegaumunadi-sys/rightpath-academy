import {
  Bell,
  UserRound,
} from "lucide-react";

import { ParentMobileNav } from "./parent-mobile-nav";

export function ParentTopbar({
  parentName,
}: {
  parentName: string;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="flex h-20 items-center justify-between px-5 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <ParentMobileNav />

          <div className="min-w-0">
            <p className="text-sm text-slate-500">
              Parent Portal
            </p>

            <p className="font-bold text-slate-950">
              RightPath Academy
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            className="relative rounded-xl border border-slate-200 p-2.5 text-slate-600"
            aria-label="Notifications"
          >
            <Bell className="size-5" />

            <span className="absolute right-2 top-2 size-2 rounded-full bg-amber-500 ring-2 ring-white" />
          </button>

          <div className="flex items-center gap-3 rounded-xl border border-slate-200 px-3 py-2">
            <div className="flex size-9 items-center justify-center rounded-xl bg-green-100 text-green-700">
              <UserRound className="size-5" />
            </div>

            <div className="hidden sm:block">
              <p className="text-sm font-bold text-slate-900">
                {parentName}
              </p>

              <p className="text-xs text-slate-500">
                Parent / Guardian
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
