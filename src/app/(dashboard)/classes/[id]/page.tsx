import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  GraduationCap,
  UserRoundCheck,
  Users,
} from "lucide-react";

import { Badge, Card } from "@/components/ui";
import { createAdminClient } from "@/lib/supabase/admin";

type ClassProfilePageProps = {
  params: Promise<{
    id: string;
  }>;
};

export async function generateMetadata({
  params,
}: ClassProfilePageProps): Promise<Metadata> {
  const { id } = await params;
  const admin = createAdminClient();

  const { data: schoolClass } = await admin
    .from("classes")
    .select("name")
    .eq("id", id)
    .maybeSingle();

  return {
    title: schoolClass?.name ?? "Class Profile",
  };
}

export default async function ClassProfilePage({
  params,
}: ClassProfilePageProps) {
  const { id } = await params;
  const admin = createAdminClient();

  const [
    { data: currentSession },
    { data: schoolClass, error: classError },
  ] = await Promise.all([
    admin
      .from("academic_sessions")
      .select("id, name")
      .eq("is_current", true)
      .maybeSingle(),

    admin
      .from("classes")
      .select(`
        id,
        name,
        admission_code,
        status,
        school_levels (
          id,
          name
        )
      `)
      .eq("id", id)
      .maybeSingle(),
  ]);

  if (classError) {
    console.error("Unable to load class:", {
      message: classError.message,
      code: classError.code,
      details: classError.details,
      hint: classError.hint,
    });
  }

  if (!schoolClass) {
    notFound();
  }

  const [
    { data: enrollments },
    { data: classSubjects },
  ] = currentSession
    ? await Promise.all([
        admin
          .from("student_enrollments")
          .select(`
            id,
            student_id,
            status,
            students (
              id,
              admission_number,
              surname,
              first_name,
              other_name,
              gender,
              status
            )
          `)
          .eq("class_id", schoolClass.id)
          .eq(
            "academic_session_id",
            currentSession.id,
          )
          .eq("status", "active"),

        admin
          .from("class_subjects")
          .select(`
            id,
            is_compulsory,
            subjects (
              id,
              name,
              code
            ),
            teacher_assignments (
              id,
              is_class_teacher,
              teachers (
                id,
                full_name,
                employee_id
              )
            )
          `)
          .eq("class_id", schoolClass.id)
          .eq(
            "academic_session_id",
            currentSession.id,
          ),
      ])
    : [
        { data: [] },
        { data: [] },
      ];

  const levelRelation = schoolClass.school_levels;

  const schoolLevel = Array.isArray(levelRelation)
    ? levelRelation[0]
    : levelRelation;

  const classTeacherAssignment =
    classSubjects
      ?.flatMap(
        (subject) =>
          subject.teacher_assignments ?? [],
      )
      .find(
        (assignment) => assignment.is_class_teacher,
      ) ?? null;

  const classTeacherRelation =
    classTeacherAssignment?.teachers;

  const classTeacher = Array.isArray(
    classTeacherRelation,
  )
    ? classTeacherRelation[0]
    : classTeacherRelation;

  const teacherIds = new Set<string>();

  for (const classSubject of classSubjects ?? []) {
    for (const assignment of
      classSubject.teacher_assignments ?? []) {
      const teacherRelation = assignment.teachers;

      const teacher = Array.isArray(teacherRelation)
        ? teacherRelation[0]
        : teacherRelation;

      if (teacher?.id) {
        teacherIds.add(teacher.id);
      }
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div>
        <Link
          href="/classes"
          className="inline-flex items-center gap-2 text-sm font-semibold text-green-700 hover:text-green-800"
        >
          <ArrowLeft className="size-4" />
          Back to classes
        </Link>

        <div className="mt-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-semibold text-slate-950">
                {schoolClass.name}
              </h1>

              <Badge
                variant={
                  schoolClass.status === "active"
                    ? "success"
                    : "neutral"
                }
              >
                {schoolClass.status}
              </Badge>
            </div>

            <p className="mt-2 text-slate-600">
              {schoolLevel?.name ??
                "School level unavailable"}{" "}
              · Admission code{" "}
              {schoolClass.admission_code}
            </p>

            <p className="mt-1 text-sm text-slate-500">
              {currentSession?.name ??
                "No current academic session"}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href={`/subjects/assign?class=${schoolClass.id}`}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-green-200 bg-white px-5 py-3 text-sm font-semibold text-green-800 transition hover:bg-green-50"
            >
              <BookOpen className="size-4" />
              Manage Subjects
            </Link>

            <Link
              href="/teacher-assignments"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-green-700"
            >
              <UserRoundCheck className="size-4" />
              Assign Teachers
            </Link>
          </div>
        </div>
      </div>

      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Students"
          value={String(enrollments?.length ?? 0)}
          icon={Users}
        />

        <SummaryCard
          label="Subjects"
          value={String(classSubjects?.length ?? 0)}
          icon={BookOpen}
        />

        <SummaryCard
          label="Teachers"
          value={String(teacherIds.size)}
          icon={UserRoundCheck}
        />

        <SummaryCard
          label="Class Teacher"
          value={classTeacher ? "Assigned" : "Not assigned"}
          icon={GraduationCap}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <h2 className="text-lg font-semibold text-slate-950">
            Registered Students
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Current-session student enrollment
          </p>

          <div className="mt-6 overflow-hidden rounded-xl border border-slate-200">
            {enrollments?.length ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px] text-left">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                        Student
                      </th>
                      <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                        Admission Number
                      </th>
                      <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                        Gender
                      </th>
                      <th className="px-5 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-500">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {enrollments.map((enrollment) => {
                      const studentRelation =
                        enrollment.students;

                      const student = Array.isArray(
                        studentRelation,
                      )
                        ? studentRelation[0]
                        : studentRelation;

                      if (!student) {
                        return null;
                      }

                      const fullName = [
                        student.surname,
                        student.first_name,
                        student.other_name,
                      ]
                        .filter(Boolean)
                        .join(" ");

                      return (
                        <tr key={enrollment.id}>
                          <td className="px-5 py-4 font-semibold text-slate-900">
                            {fullName}
                          </td>

                          <td className="px-5 py-4 text-slate-600">
                            {student.admission_number}
                          </td>

                          <td className="px-5 py-4 capitalize text-slate-600">
                            {student.gender}
                          </td>

                          <td className="px-5 py-4 text-right">
                            <Link
                              href={`/students/${student.id}`}
                              className="font-semibold text-green-700 hover:text-green-800"
                            >
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
              <div className="px-6 py-14 text-center text-sm text-slate-500">
                No students are enrolled in this class.
              </div>
            )}
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-slate-950">
            Class Teacher
          </h2>

          {classTeacher ? (
            <Link
              href={`/teachers/${classTeacher.id}`}
              className="mt-6 block rounded-xl border border-green-200 bg-green-50 p-5 transition hover:bg-green-100"
            >
              <div className="flex size-11 items-center justify-center rounded-xl bg-green-600 text-white">
                <UserRoundCheck className="size-5" />
              </div>

              <p className="mt-4 font-semibold text-slate-950">
                {classTeacher.full_name}
              </p>

              <p className="mt-1 text-sm text-slate-600">
                {classTeacher.employee_id}
              </p>
            </Link>
          ) : (
            <div className="mt-6 rounded-xl border border-dashed border-amber-300 bg-amber-50 p-5">
              <p className="font-semibold text-amber-900">
                No class teacher assigned
              </p>

              <p className="mt-2 text-sm text-amber-800">
                Class-teacher assignment will be added next.
              </p>
            </div>
          )}
        </Card>
      </section>

      <Card>
        <h2 className="text-lg font-semibold text-slate-950">
          Subjects and Teachers
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Current academic assignments for this class
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {classSubjects?.length ? (
            classSubjects.map((classSubject) => {
              const subjectRelation =
                classSubject.subjects;

              const subject = Array.isArray(
                subjectRelation,
              )
                ? subjectRelation[0]
                : subjectRelation;

              const teachers =
                classSubject.teacher_assignments
                  ?.map((assignment) => {
                    const relation =
                      assignment.teachers;

                    return Array.isArray(relation)
                      ? relation[0]
                      : relation;
                  })
                  .filter(Boolean) ?? [];

              return (
                <div
                  key={classSubject.id}
                  className="rounded-2xl border border-slate-200 p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-950">
                        {subject?.name ??
                          "Unknown subject"}
                      </p>

                      <p className="mt-1 text-sm font-semibold text-green-700">
                        {subject?.code ?? "N/A"}
                      </p>
                    </div>

                    <Badge
                      variant={
                        classSubject.is_compulsory
                          ? "warning"
                          : "neutral"
                      }
                    >
                      {classSubject.is_compulsory
                        ? "Compulsory"
                        : "Elective"}
                    </Badge>
                  </div>

                  <div className="mt-5 border-t border-slate-100 pt-4">
                    {teachers.length ? (
                      <div className="space-y-2">
                        {teachers.map((teacher) => (
                          <Link
                            key={teacher!.id}
                            href={`/teachers/${teacher!.id}`}
                            className="block text-sm font-semibold text-slate-700 hover:text-green-700"
                          >
                            {teacher!.full_name}
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500">
                        No teacher assigned
                      </p>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-sm text-slate-500">
              No subjects are assigned to this class.
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof Users;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">
            {label}
          </p>

          <p className="mt-2 text-2xl font-semibold text-slate-950">
            {value}
          </p>
        </div>

        <div className="flex size-11 items-center justify-center rounded-xl bg-green-100 text-green-700">
          <Icon className="size-5" />
        </div>
      </div>
    </Card>
  );
}
