import {
  BarChart3,
  CalendarCheck,
  GraduationCap,
  UserCheck,
  Users,
  WalletCards,
} from "lucide-react";
import { redirect } from "next/navigation";

import { SectionCard } from "@/components/dashboard/section-card";
import { StatCard } from "@/components/dashboard/stat-card";
import { getCurrentUser } from "@/lib/auth/get-current-user";

const announcements = [
  {
    title: "First Term Staff Meeting",
    date: "Today, 2:00 PM",
  },
  {
    title: "Continuous Assessment Submission",
    date: "Due Friday",
  },
  {
    title: "Parent–Teacher Meeting",
    date: "August 12",
  },
];

const recentStudents = [
  {
    name: "Student registration will appear here",
    className: "No records yet",
  },
  {
    name: "Connect this section to Supabase",
    className: "Students module",
  },
  {
    name: "Recent admissions will update automatically",
    className: "Coming next",
  },
];

export default async function PrincipalDashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const displayName =
    user.user_metadata?.full_name ||
    user.email?.split("@")[0] ||
    "Principal";

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <section className="overflow-hidden rounded-3xl bg-green-700 px-7 py-8 text-white shadow-lg shadow-green-700/10 sm:px-9">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div>
            <p className="text-sm font-semibold text-green-100">
              Rightpath Academy
            </p>

            <h1 className="mt-2 text-3xl font-semibold tracking-tight">
              Welcome back, {displayName}
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-green-100">
              Here is a quick overview of today&apos;s school
              activities, academic progress and administration.
            </p>
          </div>

          <div className="rounded-2xl bg-amber-400 px-5 py-4 text-slate-950">
            <p className="text-xs font-bold uppercase tracking-widest">
              Current session
            </p>
            <p className="mt-1 text-lg font-semibold">
              2026/2027
            </p>
            <p className="text-sm">First Term</p>
          </div>
        </div>
      </section>

      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          title="Total Students"
          value="0"
          description="Registered students"
          icon={GraduationCap}
        />

        <StatCard
          title="Total Teachers"
          value="0"
          description="Active teaching staff"
          icon={Users}
        />

        <StatCard
          title="Attendance Today"
          value="0%"
          description="Attendance not recorded"
          icon={CalendarCheck}
          accent="amber"
        />

        <StatCard
          title="Pending Results"
          value="0"
          description="Awaiting approval"
          icon={BarChart3}
          accent="amber"
        />

        <StatCard
          title="Active Parents"
          value="0"
          description="Linked guardians"
          icon={UserCheck}
        />

        <StatCard
          title="Outstanding Fees"
          value="₦0"
          description="No payments recorded"
          icon={WalletCards}
          accent="amber"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <SectionCard
          title="Recent Announcements"
          description="Latest notices and upcoming activities"
        >
          <div className="space-y-4">
            {announcements.map((announcement) => (
              <div
                key={announcement.title}
                className="flex items-center justify-between gap-4 rounded-xl border border-slate-100 bg-slate-50 px-4 py-4"
              >
                <div>
                  <p className="font-semibold text-slate-900">
                    {announcement.title}
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    {announcement.date}
                  </p>
                </div>

                <span className="size-2 shrink-0 rounded-full bg-amber-500" />
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title="Recent Student Registrations"
          description="New admissions will appear here"
        >
          <div className="space-y-4">
            {recentStudents.map((student) => (
              <div
                key={student.name}
                className="flex items-center gap-4 rounded-xl border border-slate-100 px-4 py-4"
              >
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-green-100 text-green-700">
                  <GraduationCap className="size-5" />
                </div>

                <div>
                  <p className="font-semibold text-slate-900">
                    {student.name}
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    {student.className}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </section>
    </div>
  );
}
