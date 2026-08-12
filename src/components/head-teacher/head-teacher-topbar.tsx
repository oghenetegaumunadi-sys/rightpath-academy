import { ShieldCheck } from "lucide-react";

import { HeadTeacherMobileNav } from "./head-teacher-mobile-nav";

export function HeadTeacherTopbar({
  headTeacherName,
  sectionName,
}: {
  headTeacherName: string;
  sectionName: string;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="flex h-20 items-center justify-between gap-4 px-5 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <HeadTeacherMobileNav />

          <div className="min-w-0">
            <p className="text-sm text-slate-500">
              Head Teacher Portal
            </p>

            <p className="truncate font-bold text-slate-950">
              {sectionName}
            </p>
          </div>
        </div>

        <div className="hidden items-center gap-3 rounded-xl border border-slate-200 px-3 py-2 sm:flex">
          <div className="flex size-9 items-center justify-center rounded-xl bg-green-100 text-green-700">
            <ShieldCheck className="size-5" />
          </div>

          <div>
            <p className="text-sm font-bold text-slate-900">
              {headTeacherName}
            </p>

            <p className="text-xs text-slate-500">
              Head Teacher
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
