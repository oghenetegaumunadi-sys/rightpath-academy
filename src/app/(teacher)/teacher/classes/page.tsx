import type { Metadata } from "next";
import Link from "next/link";
import {
  BookOpen,
  CalendarCheck,
  ChevronRight,
  ClipboardPenLine,
  GraduationCap,
} from "lucide-react";
import { redirect } from "next/navigation";

import { Badge, Card } from "@/components/ui";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "My Classes",
};

export default async function TeacherClassesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const admin = createAdminClient();

  const {
    data: teacher,
    error: teacherError,
  } = await admin
    .from("teachers")
    .select(`
      id,
      full_name,
      employee_id
    `)
    .eq("profile_id", user.id)
    .maybeSingle();

  if (teacherError || !teacher) {
    redirect("/unauthorized");
  }

  const {
    data: currentSession,
    error: sessionError,
  } = await admin
    .from("academic_sessions")
    .select(`
      id,
      name
    `)
    .eq("is_current", true)
    .order("starts_on", {
      ascending: false,
    })
    .limit(1)
    .maybeSingle();

  if (sessionError) {
    console.error("Unable to load current session:", {
      message: sessionError.message,
      code: sessionError.code,
      details: sessionError.details,
      hint: sessionError.hint,
    });
  }

  const {
    data: assignments,
    error: assignmentsError,
  } = await admin
    .from("teacher_assignments")
    .select(`
      id,
      class_subject_id,
      class_subjects (
        id,
        academic_session_id,
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
      )
    `)
    .eq("teacher_id", teacher.id);

  if (assignmentsError) {
    console.error("Unable to load teacher assignments:", {
      message: assignmentsError.message,
      code: assignmentsError.code,
      details: assignmentsError.details,
      hint: assignmentsError.hint,
    });
  }

  const rows =
    assignments
      ?.map((assignment) => {
        const classSubjectRelation =
          assignment.class_subjects;

        const classSubject = Array.isArray(
          classSubjectRelation,
        )
          ? classSubjectRelation[0]
          : classSubjectRelation;

        const classRelation =
          classSubject?.classes;

        const schoolClass = Array.isArray(
          classRelation,
        )
          ? classRelation[0]
          : classRelation;

        const subjectRelation =
          classSubject?.subjects;

        const subject = Array.isArray(
          subjectRelation,
        )
          ? subjectRelation[0]
          : subjectRelation;

        if (
          !classSubject ||
          !schoolClass ||
          !subject
        ) {
          return null;
        }

        if (
          currentSession &&
          classSubject.academic_session_id !==
            currentSession.id
        ) {
          return null;
        }

        return {
          assignmentId: assignment.id,
          classSubjectId: classSubject.id,
          classId: schoolClass.id,
          className: schoolClass.name,
          classSortOrder: schoolClass.sort_order,
          subjectId: subject.id,
          subjectName: subject.name,
          subjectCode: subject.code,
        };
      })
      .filter(
        (
          row,
        ): row is NonNullable<typeof row> =>
          Boolean(row),
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
      }) ?? [];

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <section>
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-green-700">
          Teacher Portal
        </p>

        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
          My Classes
        </h1>

        <p className="mt-2 text-slate-600">
          Your assigned classes and subjects
          {currentSession?.name
            ? ` for ${currentSession.name}`
            : ""}.
        </p>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {rows.map((row) => (
          <Card
            key={row.assignmentId}
            className="overflow-hidden p-0"
          >
            <div className="border-b border-slate-100 bg-gradient-to-br from-green-50 to-white p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-green-700 text-white">
                  <GraduationCap className="size-6" />
                </div>

                <Badge variant="success">
                  Assigned
                </Badge>
              </div>

              <h2 className="mt-5 text-2xl font-bold text-slate-950">
                {row.className}
              </h2>

              <p className="mt-2 text-sm font-semibold text-green-700">
                {row.subjectName}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                {row.subjectCode}
              </p>
            </div>

            <div className="space-y-3 p-5">
              <Link
                href={`/teacher/attendance?assignment=${row.assignmentId}`}
                className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-green-200 hover:bg-green-50 hover:text-green-800"
              >
                <span className="flex items-center gap-2">
                  <CalendarCheck className="size-4" />
                  Take Attendance
                </span>

                <ChevronRight className="size-4" />
              </Link>

              <Link
                href={`/teacher/scores?assignment=${row.assignmentId}`}
                className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-green-200 hover:bg-green-50 hover:text-green-800"
              >
                <span className="flex items-center gap-2">
                  <BookOpen className="size-4" />
                  Enter Scores
                </span>

                <ChevronRight className="size-4" />
              </Link>

              <Link
                href={`/teacher/reports/new?assignment=${row.assignmentId}`}
                className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-green-200 hover:bg-green-50 hover:text-green-800"
              >
                <span className="flex items-center gap-2">
                  <ClipboardPenLine className="size-4" />
                  Teaching Report
                </span>

                <ChevronRight className="size-4" />
              </Link>
            </div>
          </Card>
        ))}
      </section>

      {!rows.length ? (
        <Card className="border-dashed py-14 text-center">
          <BookOpen className="mx-auto size-10 text-slate-400" />

          <h2 className="mt-4 text-lg font-semibold text-slate-900">
            No assignments yet
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Your assigned classes and subjects will appear here once
            the school administrator assigns them to you.
          </p>
        </Card>
      ) : null}
    </div>
  );
}
