import type { Metadata } from "next";
import Link from "next/link";
import {
  Download,
  Eye,
  FileSpreadsheet,
  GraduationCap,
  Plus,
  Search,
  UserCheck,
  UserMinus,
  Users,
} from "lucide-react";

import { Badge, Card, Input } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Students",
};

type StudentsPageProps = {
  searchParams: Promise<{
    search?: string;
    class?: string;
  }>;
};

export default async function StudentsPage({
  searchParams,
}: StudentsPageProps) {
  const {
    search = "",
    class: selectedClassId = "",
  } = await searchParams;

  const supabase = await createClient();

  const { data: currentSession } = await supabase
    .from("academic_sessions")
    .select("id, name")
    .eq("is_current", true)
    .maybeSingle();

  const [
    { data: classes, error: classesError },
    { count: totalStudents },
    { count: activeStudents },
    { count: archivedStudents },
    { count: withdrawnStudents },
    { data: recentStudents },
  ] = await Promise.all([
    supabase
      .from("classes")
      .select(`
        id,
        name,
        sort_order,
        student_enrollments (
          id,
          status,
          academic_session_id
        )
      `)
      .eq("status", "active")
      .order("sort_order"),

    supabase
      .from("students")
      .select("*", {
        count: "exact",
        head: true,
      }),

    supabase
      .from("students")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq("status", "active"),

    supabase
      .from("students")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq("status", "archived"),

    supabase
      .from("students")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq("status", "withdrawn"),

    supabase
      .from("students")
      .select(`
        id,
        admission_number,
        surname,
        first_name,
        other_name,
        created_at,
        student_enrollments (
          class_id,
          academic_session_id,
          classes (
            id,
            name
          )
        )
      `)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  if (classesError) {
    console.error("Unable to load classes:", classesError);
  }

  let query = supabase
    .from("students")
    .select(`
      id,
      admission_number,
      surname,
      first_name,
      other_name,
      gender,
      status,
      passport_url,
      student_enrollments!inner (
        id,
        status,
        class_id,
        academic_session_id,
        classes (
          id,
          name
        )
      )
    `)
    .order("created_at", { ascending: false })
    .limit(100);

  if (currentSession?.id) {
    query = query.eq(
      "student_enrollments.academic_session_id",
      currentSession.id,
    );
  }

  if (selectedClassId) {
    query = query.eq(
      "student_enrollments.class_id",
      selectedClassId,
    );
  }

  if (search.trim()) {
    const value = search.trim();

    query = query.or(
      `surname.ilike.%${value}%,first_name.ilike.%${value}%,other_name.ilike.%${value}%,admission_number.ilike.%${value}%`,
    );
  }

  const { data: students, error: studentsError } =
    await query;

  if (studentsError) {
    console.error(
      "Unable to load students:",
      studentsError,
    );
  }

  const selectedClass =
    classes?.find(
      (schoolClass) =>
        schoolClass.id === selectedClassId,
    ) ?? null;

  const buildUrl = ({
    classId,
    searchValue,
  }: {
    classId?: string;
    searchValue?: string;
  }) => {
    const params = new URLSearchParams();

    if (classId) {
      params.set("class", classId);
    }

    if (searchValue) {
      params.set("search", searchValue);
    }

    const queryString = params.toString();

    return queryString
      ? `/students?${queryString}`
      : "/students";
  };

  const getClassCount = (
    enrollments:
      | {
          id: string;
          status: string;
          academic_session_id: string;
        }[]
      | null,
  ) =>
    enrollments?.filter(
      (enrollment) =>
        enrollment.status === "active" &&
        (!currentSession?.id ||
          enrollment.academic_session_id ===
            currentSession.id),
    ).length ?? 0;

  const sessionTotal =
    classes?.reduce(
      (total, schoolClass) =>
        total +
        getClassCount(
          schoolClass.student_enrollments,
        ),
      0,
    ) ?? 0;

  const newAdmissions =
    recentStudents?.filter((student) => {
      const createdAt = new Date(student.created_at);
      const thirtyDaysAgo = new Date();

      thirtyDaysAgo.setDate(
        thirtyDaysAgo.getDate() - 30,
      );

      return createdAt >= thirtyDaysAgo;
    }).length ?? 0;

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-semibold text-slate-950">
            Students Dashboard
          </h1>

          <p className="mt-2 text-slate-600">
            Manage student records for{" "}
            {currentSession?.name ??
              "the current academic session"}.
          </p>
        </div>

        <Link
          href="/students/new"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-green-700"
        >
          <Plus className="size-5" />
          Register Student
        </Link>
      </section>

      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-5">
        <DashboardStat
          title="Total Students"
          value={String(totalStudents ?? 0)}
          description="All records"
          icon={Users}
          tone="green"
        />

        <DashboardStat
          title="Active Students"
          value={String(activeStudents ?? 0)}
          description="Currently active"
          icon={UserCheck}
          tone="green"
        />

        <DashboardStat
          title="Current Session"
          value={String(sessionTotal)}
          description={
            currentSession?.name ?? "No active session"
          }
          icon={GraduationCap}
          tone="amber"
        />

        <DashboardStat
          title="New Admissions"
          value={String(newAdmissions)}
          description="Last 30 days"
          icon={Plus}
          tone="amber"
        />

        <DashboardStat
          title="Archived/Withdrawn"
          value={String(
            (archivedStudents ?? 0) +
              (withdrawnStudents ?? 0),
          )}
          description="Inactive records"
          icon={UserMinus}
          tone="neutral"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">
                Quick Actions
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Common student-management tasks
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <QuickAction
              href="/students/new"
              label="Register Student"
              description="Create a new record"
              icon={Plus}
            />

            <QuickAction
              href="/students"
              label="View Students"
              description="Browse all records"
              icon={Users}
            />

            <QuickAction
              href="/students/import"
              label="Import Students"
              description="CSV import coming soon"
              icon={FileSpreadsheet}
            />

            <QuickAction
              href="/students/export"
              label="Export Records"
              description="PDF and Excel soon"
              icon={Download}
            />
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-slate-950">
            Student Status
          </h2>

          <div className="mt-6 space-y-5">
            <StatusRow
              label="Active"
              value={activeStudents ?? 0}
              tone="green"
            />

            <StatusRow
              label="Archived"
              value={archivedStudents ?? 0}
              tone="amber"
            />

            <StatusRow
              label="Withdrawn"
              value={withdrawnStudents ?? 0}
              tone="neutral"
            />
          </div>
        </Card>
      </section>

      <section>
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-slate-950">
            Class Overview
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Click a class to view its registered students.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <Link
            href={buildUrl({
              searchValue: search || undefined,
            })}
            className={[
              "rounded-2xl border p-5 transition",
              !selectedClassId
                ? "border-green-600 bg-green-600 text-white shadow-md"
                : "border-slate-200 bg-white text-slate-900 hover:border-green-300 hover:bg-green-50",
            ].join(" ")}
          >
            <div className="flex items-center justify-between gap-3">
              <div
                className={[
                  "flex size-11 items-center justify-center rounded-xl",
                  !selectedClassId
                    ? "bg-white/15 text-white"
                    : "bg-green-100 text-green-700",
                ].join(" ")}
              >
                <Users className="size-5" />
              </div>

              <span
                className={[
                  "rounded-full px-3 py-1 text-sm font-bold",
                  !selectedClassId
                    ? "bg-white/15 text-white"
                    : "bg-slate-100 text-slate-700",
                ].join(" ")}
              >
                {sessionTotal}
              </span>
            </div>

            <p className="mt-5 font-semibold">
              All Students
            </p>

            <p
              className={[
                "mt-1 text-sm",
                !selectedClassId
                  ? "text-green-100"
                  : "text-slate-500",
              ].join(" ")}
            >
              Current session only
            </p>
          </Link>

          {classes?.map((schoolClass) => {
            const studentCount = getClassCount(
              schoolClass.student_enrollments,
            );

            const active =
              schoolClass.id === selectedClassId;

            return (
              <Link
                key={schoolClass.id}
                href={buildUrl({
                  classId: schoolClass.id,
                  searchValue: search || undefined,
                })}
                className={[
                  "rounded-2xl border p-5 transition",
                  active
                    ? "border-green-600 bg-green-600 text-white shadow-md"
                    : "border-slate-200 bg-white text-slate-900 hover:border-green-300 hover:bg-green-50",
                ].join(" ")}
              >
                <div className="flex items-center justify-between gap-3">
                  <div
                    className={[
                      "flex size-11 items-center justify-center rounded-xl",
                      active
                        ? "bg-white/15 text-white"
                        : "bg-amber-100 text-amber-700",
                    ].join(" ")}
                  >
                    <GraduationCap className="size-5" />
                  </div>

                  <span
                    className={[
                      "rounded-full px-3 py-1 text-sm font-bold",
                      active
                        ? "bg-white/15 text-white"
                        : "bg-amber-50 text-amber-800",
                    ].join(" ")}
                  >
                    {studentCount}
                  </span>
                </div>

                <p className="mt-5 font-semibold">
                  {schoolClass.name}
                </p>

                <p
                  className={[
                    "mt-1 text-sm",
                    active
                      ? "text-green-100"
                      : "text-slate-500",
                  ].join(" ")}
                >
                  {studentCount === 1
                    ? "1 registered student"
                    : `${studentCount} registered students`}
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <form className="flex flex-col gap-3 sm:flex-row">
            {selectedClassId ? (
              <input
                type="hidden"
                name="class"
                value={selectedClassId}
              />
            ) : null}

            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-400" />

              <Input
                name="search"
                type="search"
                defaultValue={search}
                placeholder="Search by name or admission number..."
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
                  classId:
                    selectedClassId || undefined,
                })}
                className="rounded-xl border border-slate-200 px-6 py-3 text-center font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Clear
              </Link>
            ) : null}
          </form>

          <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
            <div className="border-b border-slate-200 bg-slate-50 px-6 py-5">
              <h2 className="text-lg font-semibold text-slate-950">
                {selectedClass
                  ? `${selectedClass.name} Students`
                  : "All Students"}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {students?.length ?? 0} student
                {(students?.length ?? 0) === 1
                  ? ""
                  : "s"}{" "}
                shown
              </p>
            </div>

            {students?.length ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[850px] text-left">
                  <thead className="border-b border-slate-200 bg-slate-50">
                    <tr>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                        Student
                      </th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                        Admission Number
                      </th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                        Class
                      </th>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                        Gender
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
                    {students.map((student) => {
                      const enrollment =
                        student.student_enrollments?.[0];

                      const classRelation =
                        enrollment?.classes;

                      const className =
                        Array.isArray(classRelation)
                          ? classRelation[0]?.name
                          : classRelation?.name;

                      const fullName = [
                        student.surname,
                        student.first_name,
                        student.other_name,
                      ]
                        .filter(Boolean)
                        .join(" ");

                      return (
                        <tr
                          key={student.id}
                          className="transition hover:bg-green-50/40"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-green-100 text-green-700">
                                <GraduationCap className="size-5" />
                              </div>

                              <div>
                                <p className="font-semibold text-slate-900">
                                  {fullName}
                                </p>
                                <p className="mt-1 text-sm text-slate-500">
                                  Student record
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-4 font-medium text-slate-700">
                            {student.admission_number}
                          </td>

                          <td className="px-6 py-4 text-slate-600">
                            {className ?? "Not assigned"}
                          </td>

                          <td className="px-6 py-4 capitalize text-slate-600">
                            {student.gender}
                          </td>

                          <td className="px-6 py-4">
                            <Badge
                              variant={
                                student.status === "active"
                                  ? "success"
                                  : "neutral"
                              }
                            >
                              {student.status}
                            </Badge>
                          </td>

                          <td className="px-6 py-4 text-right">
                            <Link
                              href={`/students/${student.id}`}
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
                  <GraduationCap className="size-7" />
                </div>

                <h2 className="mt-5 text-lg font-semibold text-slate-900">
                  {search
                    ? "No matching students found"
                    : selectedClass
                      ? `No students registered in ${selectedClass.name}`
                      : "No students registered yet"}
                </h2>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                  {search
                    ? "Try another name or admission number."
                    : "Register a student to begin building this class list."}
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
            Latest student admissions
          </p>

          <div className="mt-6 space-y-4">
            {recentStudents?.length ? (
              recentStudents.map((student) => {
                const enrollment =
                  student.student_enrollments?.find(
                    (item) =>
                      !currentSession?.id ||
                      item.academic_session_id ===
                        currentSession.id,
                  ) ??
                  student.student_enrollments?.[0];

                const classRelation =
                  enrollment?.classes;

                const className =
                  Array.isArray(classRelation)
                    ? classRelation[0]?.name
                    : classRelation?.name;

                const fullName = [
                  student.surname,
                  student.first_name,
                  student.other_name,
                ]
                  .filter(Boolean)
                  .join(" ");

                return (
                  <Link
                    key={student.id}
                    href={`/students/${student.id}`}
                    className="flex items-center gap-3 rounded-xl border border-slate-100 p-4 transition hover:border-green-200 hover:bg-green-50"
                  >
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                      <GraduationCap className="size-5" />
                    </div>

                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-900">
                        {fullName}
                      </p>

                      <p className="mt-1 truncate text-xs text-slate-500">
                        {student.admission_number}
                        {className
                          ? ` · ${className}`
                          : ""}
                      </p>
                    </div>
                  </Link>
                );
              })
            ) : (
              <p className="text-sm text-slate-500">
                No student registrations yet.
              </p>
            )}
          </div>
        </Card>
      </section>
    </div>
  );
}

function DashboardStat({
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
