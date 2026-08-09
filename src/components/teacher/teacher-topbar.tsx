import {
  Bell,
  UserRound,
} from "lucide-react";

import { TeacherMobileNav } from "./teacher-mobile-nav";

export function TeacherTopbar({
  teacherName,
  employeeId,
}: {
  teacherName: string;
  employeeId: string;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="flex h-20 items-center justify-between px-5 lg:px-8">
        <div className="flex items-center gap-3">
          <TeacherMobileNav />

          <div>
          <p className="text-sm text-slate-500">
            Teacher Portal
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

          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
            <div className="flex size-9 items-center justify-center rounded-xl bg-green-100 text-green-700">
              <UserRound className="size-5" />
            </div>

            <div className="hidden sm:block">
              <p className="text-sm font-bold text-slate-900">
                {teacherName}
              </p>

              <p className="text-xs text-slate-500">
                {employeeId}
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
