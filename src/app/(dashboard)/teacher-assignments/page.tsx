import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  UserRound,
} from "lucide-react";

import {
  Badge,
  Card,
} from "@/components/ui";
import { createAdminClient } from "@/lib/supabase/admin";

import { TeacherSubjectForm } from "./teacher-subject-form";

export const metadata: Metadata = {
  title: "Assign Teacher Subjects",
};

type TeacherAssignmentPageProps = {
  searchParams: Promise<{
    teacher?: string;
  }>;
};

export default async function TeacherAssignmentPage({
  searchParams,
}: TeacherAssignmentPageProps) {
  const {
    teacher: selectedTeacherId = "",
  } = await searchParams;

  const admin = createAdminClient();

  const [
    { data: currentSession },
    { data: teachers },
  ] = await Promise.all([
    admin
      .from("academic_sessions")
      .select("id, name")
      .eq("is_current", true)
      .maybeSingle(),

    admin
      .from("teachers")
      .select(`
        id,
        employee_id,
        full_name,
        specialization,
        status
      `)
      .eq("status", "active")
      .order("full_name"),
  ]);

  const selectedTeacher =
    teachers?.find(
      (teacher) =>
        teacher.id === selectedTeacherId,
    ) ?? null;

  let assignmentOptions: {
    id: string;
    subjectName: string;
    subjectCode: string;
    className: string;
    isCompulsory: boolean;
  }[] = [];

  let assignedClassSubjectIds: string[] = [];

  if (selectedTeacher && currentSession) {
    const [
      { data: classSubjects },
      { data: teacherAssignments },
    ] = await Promise.all([
      admin
        .from("class_subjects")
        .select(`
          id,
          is_compulsory,
          classes (
            id,
            name,
            sort_order
          ),
          subjects (
            id,
            name,
            code
          )
        `)
        .eq(
          "academic_session_id",
          currentSession.id,
        ),

      admin
        .from("teacher_assignments")
        .select(`
          id,
          class_subject_id,
          class_subjects!inner (
            academic_session_id
          )
        `)
        .eq(
          "teacher_id",
          selectedTeacher.id,
        )
        .eq(
          "class_subjects.academic_session_id",
          currentSession.id,
        ),
    ]);

    assignmentOptions =
      classSubjects
        ?.map((item) => {
          const classRelation = item.classes;

          const schoolClass =
            Array.isArray(classRelation)
              ? classRelation[0]
              : classRelation;

          const subjectRelation = item.subjects;

          const subject =
            Array.isArray(subjectRelation)
              ? subjectRelation[0]
              : subjectRelation;

          if (!schoolClass || !subject) {
            return null;
          }

          return {
            id: item.id,
            subjectName: subject.name,
            subjectCode: subject.code,
            className: schoolClass.name,
            classSortOrder:
              schoolClass.sort_order,
            isCompulsory:
              item.is_compulsory,
          };
        })
        .filter(
          (
            item,
          ): item is NonNullable<typeof item> =>
            Boolean(item),
        )
        .sort((a, b) => {
          if (
            a.classSortOrder !==
            b.classSortOrder
          ) {
            return (
              a.classSortOrder -
              b.classSortOrder
            );
          }

          return a.subjectName.localeCompare(
            b.subjectName,
          );
        })
        .map((item) => ({
          id: item.id,
          subjectName: item.subjectName,
          subjectCode: item.subjectCode,
          className: item.className,
          isCompulsory: item.isCompulsory,
        })) ?? [];

    assignedClassSubjectIds =
      teacherAssignments?.map(
        (assignment) =>
          assignment.class_subject_id,
      ) ?? [];
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div>
        <Link
          href="/teachers"
          className="inline-flex items-center gap-2 text-sm font-semibold text-green-700 hover:text-green-800"
        >
          <ArrowLeft className="size-4" />
          Back to teachers
        </Link>

        <h1 className="mt-3 text-3xl font-semibold text-slate-950">
          Teacher Subject Assignment
        </h1>

        <p className="mt-2 text-slate-600">
          Assign class subjects for{" "}
          {currentSession?.name ??
            "the current academic session"}.
        </p>
      </div>

      {!currentSession ? (
        <Card className="border-amber-200 bg-amber-50">
          <p className="font-semibold text-amber-900">
            No active academic session was found.
          </p>
        </Card>
      ) : null}

      <section>
        <h2 className="text-lg font-semibold text-slate-950">
          Select a Teacher
        </h2>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {teachers?.map((teacher) => {
            const active =
              teacher.id === selectedTeacherId;

            return (
              <Link
                key={teacher.id}
                href={`/teacher-assignments?teacher=${teacher.id}`}
                className={[
                  "rounded-2xl border p-5 transition",
                  active
                    ? "border-green-600 bg-green-600 text-white shadow-md"
                    : "border-slate-200 bg-white text-slate-900 hover:border-green-300 hover:bg-green-50",
                ].join(" ")}
              >
                <div
                  className={[
                    "flex size-11 items-center justify-center rounded-xl",
                    active
                      ? "bg-white/15 text-white"
                      : "bg-amber-100 text-amber-700",
                  ].join(" ")}
                >
                  <UserRound className="size-5" />
                </div>

                <p className="mt-5 font-semibold">
                  {teacher.full_name}
                </p>

                <p
                  className={[
                    "mt-1 text-sm",
                    active
                      ? "text-green-100"
                      : "text-slate-500",
                  ].join(" ")}
                >
                  {teacher.employee_id}
                </p>

                {teacher.specialization ? (
                  <p
                    className={[
                      "mt-2 text-xs",
                      active
                        ? "text-green-100"
                        : "text-slate-400",
                    ].join(" ")}
                  >
                    {teacher.specialization}
                  </p>
                ) : null}
              </Link>
            );
          })}
        </div>
      </section>

      {selectedTeacher && currentSession ? (
        <section className="space-y-5">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-2xl font-semibold text-slate-950">
                {selectedTeacher.full_name}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {assignedClassSubjectIds.length} current assignment
                {assignedClassSubjectIds.length === 1
                  ? ""
                  : "s"}
              </p>
            </div>

            <Badge variant="info">
              {currentSession.name}
            </Badge>
          </div>

          <TeacherSubjectForm
            key={selectedTeacher.id}
            teacherId={selectedTeacher.id}
            academicSessionId={
              currentSession.id
            }
            assignments={assignmentOptions}
            assignedClassSubjectIds={
              assignedClassSubjectIds
            }
          />
        </section>
      ) : (
        <Card className="border-dashed text-center">
          <BookOpen className="mx-auto size-10 text-slate-400" />

          <h2 className="mt-4 text-lg font-semibold text-slate-900">
            Select a teacher
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Choose a teacher above to manage subject assignments.
          </p>
        </Card>
      )}
    </div>
  );
}
