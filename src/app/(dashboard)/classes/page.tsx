import type { Metadata } from "next";
import Link from "next/link";
import {
  BookOpen,
  Eye,
  GraduationCap,
  School,
  Search,
  UserRoundCheck,
  Users,
} from "lucide-react";

import { Badge, Card, Input } from "@/components/ui";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = {
  title: "Classes",
};

type ClassesPageProps = {
  searchParams: Promise<{
    search?: string;
  }>;
};

export default async function ClassesPage({
  searchParams,
}: ClassesPageProps) {
  const { search = "" } = await searchParams;
  const admin = createAdminClient();

  const [
    { data: currentSession, error: sessionError },
    { data: classes, error: classesError },
  ] = await Promise.all([
    admin
      .from("academic_sessions")
      .select("id, name, starts_on")
      .eq("is_current", true)
      .order("starts_on", {
        ascending: false,
      })
      .limit(1)
      .maybeSingle(),

    admin
      .from("classes")
      .select(`
        id,
        name,
        slug,
        admission_code,
        sort_order,
        status,
        school_levels (
          id,
          name
        )
      `)
      .eq("status", "active")
      .order("sort_order"),
  ]);

  if (sessionError) {
    console.error("Unable to load current session:", {
      message: sessionError.message,
      code: sessionError.code,
      details: sessionError.details,
      hint: sessionError.hint,
    });
  }

  if (classesError) {
    console.error("Unable to load classes:", {
      message: classesError.message,
      code: classesError.code,
      details: classesError.details,
      hint: classesError.hint,
    });
  }

  const visibleClasses =
    classes?.filter((schoolClass) =>
      schoolClass.name
        .toLowerCase()
        .includes(search.trim().toLowerCase()),
    ) ?? [];

  const classIds = visibleClasses.map(
    (schoolClass) => schoolClass.id,
  );

  const [
    { data: enrollments, error: enrollmentsError },
    { data: classSubjects, error: subjectsError },
  ] =
    currentSession && classIds.length
      ? await Promise.all([
          admin
            .from("student_enrollments")
            .select(`
              id,
              student_id,
              class_id,
              status
            `)
            .in("class_id", classIds)
            .eq(
              "academic_session_id",
              currentSession.id,
            )
            .eq("status", "active"),

          admin
            .from("class_subjects")
            .select(`
              id,
              class_id,
              subject_id,
              teacher_assignments (
                id,
                teacher_id,
                is_class_teacher,
                teachers (
                  id,
                  full_name,
                  employee_id,
                  status
                )
              )
            `)
            .in("class_id", classIds)
            .eq(
              "academic_session_id",
              currentSession.id,
            ),
        ])
      : [
          {
            data: [],
            error: null,
          },
          {
            data: [],
            error: null,
          },
        ];

  if (enrollmentsError) {
    console.error("Unable to load class enrollments:", {
      message: enrollmentsError.message,
      code: enrollmentsError.code,
      details: enrollmentsError.details,
      hint: enrollmentsError.hint,
    });
  }

  if (subjectsError) {
    console.error("Unable to load class subjects:", {
      message: subjectsError.message,
      code: subjectsError.code,
      details: subjectsError.details,
      hint: subjectsError.hint,
    });
  }

  const getStudentCount = (classId: string) =>
    enrollments?.filter(
      (enrollment) =>
        enrollment.class_id === classId,
    ).length ?? 0;

  const getClassSubjectRows = (classId: string) =>
    classSubjects?.filter(
      (classSubject) =>
        classSubject.class_id === classId,
    ) ?? [];

  const getSubjectCount = (classId: string) =>
    getClassSubjectRows(classId).length;

  const getTeacherIds = (classId: string) => {
    const ids = new Set<string>();

    for (const classSubject of getClassSubjectRows(
      classId,
    )) {
      for (const assignment of
        classSubject.teacher_assignments ?? []) {
        if (assignment.teacher_id) {
          ids.add(assignment.teacher_id);
        }
      }
    }

    return ids;
  };

  const getTeacherCount = (classId: string) =>
    getTeacherIds(classId).size;

  const getClassTeacher = (classId: string) => {
    for (const classSubject of getClassSubjectRows(
      classId,
    )) {
      const assignment =
        classSubject.teacher_assignments?.find(
          (item) => item.is_class_teacher,
        );

      if (!assignment) {
        continue;
      }

      const teacherRelation = assignment.teachers;

      const teacher = Array.isArray(teacherRelation)
        ? teacherRelation[0]
        : teacherRelation;

      if (teacher) {
        return teacher;
      }
    }

    return null;
  };

  const totalStudents =
    visibleClasses.reduce(
      (total, schoolClass) =>
        total + getStudentCount(schoolClass.id),
      0,
    );

  const totalSubjects =
    new Set(
      classSubjects?.map(
        (classSubject) => classSubject.subject_id,
      ) ?? [],
    ).size;

  const totalTeachers = new Set(
    visibleClasses.flatMap((schoolClass) =>
      Array.from(getTeacherIds(schoolClass.id)),
    ),
  ).size;

  const classesWithTeachers =
    visibleClasses.filter(
      (schoolClass) =>
        getClassTeacher(schoolClass.id) !== null,
    ).length;

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-semibold text-slate-950">
            Classes Dashboard
          </h1>

          <p className="mt-2 text-slate-600">
            View class enrollment and academic assignments for{" "}
            {currentSession?.name ??
              "the current academic session"}.
          </p>
        </div>

        <Link
          href="/subjects/assign"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-green-700"
        >
          <BookOpen className="size-5" />
          Manage Class Subjects
        </Link>
      </section>

      {!currentSession ? (
        <Card className="border-amber-200 bg-amber-50">
          <p className="font-semibold text-amber-900">
            No current academic session is active.
          </p>

          <p className="mt-2 text-sm text-amber-800">
            Class statistics will appear after an academic
            session is activated.
          </p>
        </Card>
      ) : null}

      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <ClassStat
          title="Active Classes"
          value={String(visibleClasses.length)}
          description="Available school classes"
          icon={School}
          tone="green"
        />

        <ClassStat
          title="Students"
          value={String(totalStudents)}
          description="Current-session enrollment"
          icon={Users}
          tone="green"
        />

        <ClassStat
          title="Subjects"
          value={String(totalSubjects)}
          description="Unique assigned subjects"
          icon={BookOpen}
          tone="amber"
        />

        <ClassStat
          title="Class Teachers"
          value={`${classesWithTeachers}/${visibleClasses.length}`}
          description={`${totalTeachers} assigned teachers`}
          icon={UserRoundCheck}
          tone="neutral"
        />
      </section>

      <Card>
        <form className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-400" />

            <Input
              name="search"
              type="search"
              defaultValue={search}
              placeholder="Search classes..."
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
              href="/classes"
              className="rounded-xl border border-slate-200 px-6 py-3 text-center font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Clear
            </Link>
          ) : null}
        </form>
      </Card>

      {visibleClasses.length ? (
        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {visibleClasses.map((schoolClass) => {
            const levelRelation =
              schoolClass.school_levels;

            const schoolLevel = Array.isArray(
              levelRelation,
            )
              ? levelRelation[0]
              : levelRelation;

            const studentCount = getStudentCount(
              schoolClass.id,
            );

            const subjectCount = getSubjectCount(
              schoolClass.id,
            );

            const teacherCount = getTeacherCount(
              schoolClass.id,
            );

            const classTeacher = getClassTeacher(
              schoolClass.id,
            );

            return (
              <Card
                key={schoolClass.id}
                className="overflow-hidden p-0"
              >
                <div className="border-b border-slate-100 bg-gradient-to-br from-green-50 to-amber-50 p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex size-12 items-center justify-center rounded-2xl bg-green-600 text-white shadow-sm">
                      <GraduationCap className="size-6" />
                    </div>

                    <Badge variant="success">
                      {schoolClass.status}
                    </Badge>
                  </div>

                  <h2 className="mt-5 text-2xl font-semibold text-slate-950">
                    {schoolClass.name}
                  </h2>

                  <p className="mt-1 text-sm text-slate-600">
                    {schoolLevel?.name ??
                      "School level unavailable"}
                  </p>

                  <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-amber-700">
                    Admission code:{" "}
                    {schoolClass.admission_code}
                  </p>
                </div>

                <div className="grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-100">
                  <Metric
                    label="Students"
                    value={studentCount}
                  />

                  <Metric
                    label="Subjects"
                    value={subjectCount}
                  />

                  <Metric
                    label="Teachers"
                    value={teacherCount}
                  />
                </div>

                <div className="p-6">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Class Teacher
                  </p>

                  {classTeacher ? (
                    <div className="mt-3 flex items-center gap-3 rounded-xl bg-green-50 p-4">
                      <div className="flex size-10 items-center justify-center rounded-xl bg-green-100 text-green-700">
                        <UserRoundCheck className="size-5" />
                      </div>

                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-900">
                          {classTeacher.full_name}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {classTeacher.employee_id}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3 rounded-xl border border-dashed border-amber-300 bg-amber-50 p-4">
                      <p className="text-sm font-semibold text-amber-900">
                        No class teacher assigned
                      </p>

                      <p className="mt-1 text-xs text-amber-700">
                        Assignment will be configured next.
                      </p>
                    </div>
                  )}

                  <Link
                    href={`/classes/${schoolClass.id}`}
                    className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-green-200 px-4 py-3 text-sm font-semibold text-green-800 transition hover:bg-green-50"
                  >
                    <Eye className="size-4" />
                    Open Class
                  </Link>
                </div>
              </Card>
            );
          })}
        </section>
      ) : (
        <Card className="border-dashed py-16 text-center">
          <School className="mx-auto size-12 text-slate-400" />

          <h2 className="mt-5 text-xl font-semibold text-slate-900">
            No classes found
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Try another search term.
          </p>
        </Card>
      )}
    </div>
  );
}

function ClassStat({
  title,
  value,
  description,
  icon: Icon,
  tone,
}: {
  title: string;
  value: string;
  description: string;
  icon: typeof School;
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

function Metric({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="px-3 py-5 text-center">
      <p className="text-2xl font-semibold text-slate-950">
        {value}
      </p>

      <p className="mt-1 text-xs text-slate-500">
        {label}
      </p>
    </div>
  );
}
