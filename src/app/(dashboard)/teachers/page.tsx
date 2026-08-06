import type { Metadata } from "next";
import Link from "next/link";
import {
  BookOpen,
  Eye,
  GraduationCap,
  Plus,
  Search,
  UserCheck,
  UserMinus,
  Users,
} from "lucide-react";

import { Badge, Card, Input } from "@/components/ui";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = {
  title: "Teachers",
};

type TeacherStatus =
  | "active"
  | "inactive"
  | "suspended"
  | "graduated"
  | "withdrawn"
  | "archived";

type TeachersPageProps = {
  searchParams: Promise<{
    search?: string;
    status?: string;
  }>;
};

export default async function TeachersPage({
  searchParams,
}: TeachersPageProps) {
  const {
    search = "",
    status: rawStatus = "all",
  } = await searchParams;

  const validStatuses: TeacherStatus[] = [
    "active",
    "inactive",
    "suspended",
    "graduated",
    "withdrawn",
    "archived",
  ];

  const status: "all" | TeacherStatus =
    validStatuses.includes(rawStatus as TeacherStatus)
      ? (rawStatus as TeacherStatus)
      : "all";

  const supabase = createAdminClient();

  const [
    { count: totalTeachers },
    { count: activeTeachers },
    { count: inactiveTeachers },
    { data: recentTeachers },
  ] = await Promise.all([
    supabase
      .from("teachers")
      .select("*", {
        count: "exact",
        head: true,
      }),

    supabase
      .from("teachers")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq("status", "active"),

    supabase
      .from("teachers")
      .select("*", {
        count: "exact",
        head: true,
      })
      .neq("status", "active"),

    supabase
      .from("teachers")
      .select(`
        id,
        employee_id,
        full_name,
        specialization,
        status,
        created_at
      `)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  let query = supabase
    .from("teachers")
    .select(`
      id,
      employee_id,
      full_name,
      phone,
      email,
      gender,
      qualification,
      specialization,
      status,
      passport_url,
      created_at,
      teacher_assignments (
        id,
        class_subjects (
          id,
          subjects (
            id,
            name
          ),
          classes (
            id,
            name
          )
        )
      )
    `)
    .order("created_at", { ascending: false })
    .limit(100);

  if (status !== "all") {
    query = query.eq("status", status);
  }

  if (search.trim()) {
    const value = search.trim();

    query = query.or(
      `full_name.ilike.%${value}%,employee_id.ilike.%${value}%,phone.ilike.%${value}%,email.ilike.%${value}%`,
    );
  }

  const { data: teachers, error } = await query;

  if (error) {
    console.error("Unable to load teachers:", error);
  }

  const assignedTeachers =
    teachers?.filter(
      (teacher) =>
        (teacher.teacher_assignments?.length ?? 0) > 0,
    ).length ?? 0;

  const unassignedTeachers =
    teachers?.filter(
      (teacher) =>
        (teacher.teacher_assignments?.length ?? 0) === 0,
    ).length ?? 0;

  const newTeachers =
    recentTeachers?.filter((teacher) => {
      const createdAt = new Date(teacher.created_at);
      const thirtyDaysAgo = new Date();

      thirtyDaysAgo.setDate(
        thirtyDaysAgo.getDate() - 30,
      );

      return createdAt >= thirtyDaysAgo;
    }).length ?? 0;

  const buildUrl = ({
    searchValue,
    statusValue,
  }: {
    searchValue?: string;
    statusValue?: string;
  }) => {
    const params = new URLSearchParams();

    if (searchValue) {
      params.set("search", searchValue);
    }

    if (statusValue && statusValue !== "all") {
      params.set("status", statusValue);
    }

    const queryString = params.toString();

    return queryString
      ? `/teachers?${queryString}`
      : "/teachers";
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-semibold text-slate-950">
            Teachers Dashboard
          </h1>

          <p className="mt-2 text-slate-600">
            Manage teachers, staff records and academic assignments.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/results/score-entry"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-200 bg-white px-5 py-3 text-sm font-semibold text-amber-800 transition hover:bg-amber-50"
          >
            <BookOpen className="size-5" />
            Enter Scores
          </Link>

          <Link
            href="/teacher-assignments"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-green-200 bg-white px-5 py-3 text-sm font-semibold text-green-800 transition hover:bg-green-50"
          >
            <BookOpen className="size-5" />
            Assign Subjects
          </Link>

          <Link
            href="/teachers/new"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-green-700"
          >
            <Plus className="size-5" />
            Register Teacher
          </Link>
        </div>
      </section>

      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-5">
        <TeacherStat
          title="Total Teachers"
          value={String(totalTeachers ?? 0)}
          description="All staff records"
          icon={Users}
          tone="green"
        />

        <TeacherStat
          title="Active Teachers"
          value={String(activeTeachers ?? 0)}
          description="Currently active"
          icon={UserCheck}
          tone="green"
        />

        <TeacherStat
          title="New Teachers"
          value={String(newTeachers)}
          description="Registered in 30 days"
          icon={Plus}
          tone="amber"
        />

        <TeacherStat
          title="Assigned Teachers"
          value={String(assignedTeachers)}
          description="Have subject assignments"
          icon={BookOpen}
          tone="amber"
        />

        <TeacherStat
          title="Unassigned"
          value={String(unassignedTeachers)}
          description="Need assignments"
          icon={UserMinus}
          tone="neutral"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <h2 className="text-lg font-semibold text-slate-950">
            Quick Actions
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Common teacher-management tasks
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <QuickAction
              href="/teachers/new"
              label="Register Teacher"
              description="Create a new staff record"
              icon={Plus}
            />

            <QuickAction
              href="/teachers"
              label="View Teachers"
              description="Browse all staff"
              icon={Users}
            />

            <QuickAction
              href="/subjects"
              label="Assign Subjects"
              description="Manage teaching subjects"
              icon={BookOpen}
            />

            <QuickAction
              href="/classes"
              label="Assign Classes"
              description="Manage class teachers"
              icon={GraduationCap}
            />
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-slate-950">
            Teacher Status
          </h2>

          <div className="mt-6 space-y-5">
            <StatusRow
              label="Active"
              value={activeTeachers ?? 0}
              tone="green"
            />

            <StatusRow
              label="Inactive"
              value={inactiveTeachers ?? 0}
              tone="amber"
            />

            <StatusRow
              label="Unassigned"
              value={unassignedTeachers}
              tone="neutral"
            />
          </div>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <form className="flex flex-col gap-3 sm:flex-row">
            <input
              type="hidden"
              name="status"
              value={status}
            />

            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-400" />

              <Input
                name="search"
                type="search"
                defaultValue={search}
                placeholder="Search by name, staff ID, phone or email..."
                className="pl-12"
              />
            </div>

            <button
              type="submit"
              className="rounded-xl bg-green-600 px-6 py-3 font-semibold text-white transition hover:bg-green-700"
            >
              Search
            </button>

            {search ? (
              <Link
                href={buildUrl({
                  statusValue: status,
                })}
                className="rounded-xl border border-slate-200 px-6 py-3 text-center font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Clear
              </Link>
            ) : null}
          </form>

          <div className="mt-5 flex flex-wrap gap-2">
            {[
              ["all", "All"],
              ["active", "Active"],
              ["inactive", "Inactive"],
              ["archived", "Archived"],
            ].map(([value, label]) => (
              <Link
                key={value}
                href={buildUrl({
                  searchValue: search || undefined,
                  statusValue: value,
                })}
                className={[
                  "rounded-full px-4 py-2 text-sm font-semibold transition",
                  status === value
                    ? "bg-green-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-green-50 hover:text-green-800",
                ].join(" ")}
              >
                {label}
              </Link>
            ))}
          </div>

          <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
            {teachers?.length ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[950px] text-left">
                  <thead className="border-b border-slate-200 bg-slate-50">
                    <tr>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                        Teacher
                      </th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                        Staff ID
                      </th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                        Contact
                      </th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                        Specialization
                      </th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                        Assignments
                      </th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                        Status
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-500">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {teachers.map((teacher) => {
                      const assignmentCount =
                        teacher.teacher_assignments?.length ?? 0;

                      return (
                        <tr
                          key={teacher.id}
                          className="transition hover:bg-green-50/40"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-green-100 text-green-700">
                                <Users className="size-5" />
                              </div>

                              <div>
                                <p className="font-semibold text-slate-900">
                                  {teacher.full_name}
                                </p>

                                <p className="mt-1 text-sm capitalize text-slate-500">
                                  {teacher.gender ?? "Not specified"}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-4 font-medium text-slate-700">
                            {teacher.employee_id}
                          </td>

                          <td className="px-6 py-4">
                            <p className="text-sm text-slate-700">
                              {teacher.phone}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              {teacher.email ?? "No email"}
                            </p>
                          </td>

                          <td className="px-6 py-4 text-slate-600">
                            {teacher.specialization ??
                              teacher.qualification}
                          </td>

                          <td className="px-6 py-4 text-slate-600">
                            {assignmentCount === 1
                              ? "1 assignment"
                              : `${assignmentCount} assignments`}
                          </td>

                          <td className="px-6 py-4">
                            <Badge
                              variant={
                                teacher.status === "active"
                                  ? "success"
                                  : "neutral"
                              }
                            >
                              {teacher.status}
                            </Badge>
                          </td>

                          <td className="px-6 py-4 text-right">
                            <Link
                              href={`/teachers/${teacher.id}`}
                              className="inline-flex items-center gap-2 rounded-lg border border-green-200 px-3 py-2 text-sm font-semibold text-green-800 transition hover:bg-green-50"
                            >
                              <Eye className="size-4" />
                              View
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="px-6 py-16 text-center">
                <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-green-100 text-green-700">
                  <Users className="size-7" />
                </div>

                <h2 className="mt-5 text-lg font-semibold text-slate-900">
                  No teachers found
                </h2>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                  Register a teacher or change your search filters.
                </p>
              </div>
            )}
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-slate-950">
            Recently Registered
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Latest staff records
          </p>

          <div className="mt-6 space-y-4">
            {recentTeachers?.length ? (
              recentTeachers.map((teacher) => (
                <Link
                  key={teacher.id}
                  href={`/teachers/${teacher.id}`}
                  className="flex items-center gap-3 rounded-xl border border-slate-100 p-4 transition hover:border-green-200 hover:bg-green-50"
                >
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                    <Users className="size-5" />
                  </div>

                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-900">
                      {teacher.full_name}
                    </p>

                    <p className="mt-1 truncate text-xs text-slate-500">
                      {teacher.employee_id}
                      {teacher.specialization
                        ? ` · ${teacher.specialization}`
                        : ""}
                    </p>
                  </div>
                </Link>
              ))
            ) : (
              <p className="text-sm text-slate-500">
                No teacher registrations yet.
              </p>
            )}
          </div>
        </Card>
      </section>
    </div>
  );
}

function TeacherStat({
  title,
  value,
  description,
  icon: Icon,
  tone,
}: {
  title: string;
  value: string;
  description: string;
  icon: typeof Users;
  tone: "green" | "amber" | "neutral";
}) {
  const styles = {
    green: "bg-green-100 text-green-700",
    amber: "bg-amber-100 text-amber-700",
    neutral: "bg-slate-100 text-slate-700",
  };

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">
            {title}
          </p>

          <p className="mt-3 text-3xl font-semibold text-slate-950">
            {value}
          </p>

          <p className="mt-2 text-xs text-slate-500">
            {description}
          </p>
        </div>

        <div
          className={`flex size-11 items-center justify-center rounded-xl ${styles[tone]}`}
        >
          <Icon className="size-5" />
        </div>
      </div>
    </Card>
  );
}

function QuickAction({
  href,
  label,
  description,
  icon: Icon,
}: {
  href: string;
  label: string;
  description: string;
  icon: typeof Plus;
}) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-slate-200 p-4 transition hover:border-green-300 hover:bg-green-50"
    >
      <div className="flex size-10 items-center justify-center rounded-xl bg-green-100 text-green-700">
        <Icon className="size-5" />
      </div>

      <p className="mt-4 font-semibold text-slate-900">
        {label}
      </p>

      <p className="mt-1 text-xs leading-5 text-slate-500">
        {description}
      </p>
    </Link>
  );
}

function StatusRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "green" | "amber" | "neutral";
}) {
  const dots = {
    green: "bg-green-500",
    amber: "bg-amber-500",
    neutral: "bg-slate-400",
  };

  return (
    <div className="flex items-center justify-between border-b border-slate-100 pb-4 last:border-0 last:pb-0">
      <div className="flex items-center gap-3">
        <span
          className={`size-2.5 rounded-full ${dots[tone]}`}
        />

        <span className="text-sm text-slate-600">
          {label}
        </span>
      </div>

      <span className="font-semibold text-slate-900">
        {value}
      </span>
    </div>
  );
}
