import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpenCheck,
  ClipboardPenLine,
  UserRound,
} from "lucide-react";

import {
  Badge,
  Card,
} from "@/components/ui";
import { createAdminClient } from "@/lib/supabase/admin";

import { TeachingReportForm } from "./teaching-report-form";

export const metadata: Metadata = {
  title: "New Teaching Report",
};

type NewTeachingReportPageProps = {
  searchParams: Promise<{
    teacher?: string;
  }>;
};

export default async function NewTeachingReportPage({
  searchParams,
}: NewTeachingReportPageProps) {
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
        specialization
      `)
      .eq("status", "active")
      .order("full_name"),
  ]);

  const selectedTeacher =
    teachers?.find(
      (teacher) =>
        teacher.id === selectedTeacherId,
    ) ?? null;

  let assignments: {
    id: string;
    classSubjectId: string;
    className: string;
    subjectName: string;
    subjectCode: string;
  }[] = [];

  if (selectedTeacher && currentSession) {
    const { data: rows, error } = await admin
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
      .eq("teacher_id", selectedTeacher.id);

    if (error) {
      console.error(
        "Unable to load teacher assignments:",
        {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
        },
      );
    }

    assignments =
      rows
        ?.map((row) => {
          const classSubjectRelation =
            row.class_subjects;

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
            !subject ||
            classSubject.academic_session_id !==
              currentSession.id
          ) {
            return null;
          }

          return {
            id: row.id,
            classSubjectId: classSubject.id,
            className: schoolClass.name,
            classSortOrder:
              schoolClass.sort_order,
            subjectName: subject.name,
            subjectCode: subject.code,
          };
        })
        .filter(
          (
            assignment,
          ): assignment is NonNullable<
            typeof assignment
          > => Boolean(assignment),
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
        .map((assignment) => ({
          id: assignment.id,
          classSubjectId:
            assignment.classSubjectId,
          className: assignment.className,
          subjectName: assignment.subjectName,
          subjectCode: assignment.subjectCode,
        })) ?? [];
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <section>
        <Link
          href="/reports/daily-teaching"
          className="inline-flex items-center gap-2 text-sm font-semibold text-green-700 hover:text-green-800"
        >
          <ArrowLeft className="size-4" />
          Back to daily teaching reports
        </Link>

        <div className="mt-4 flex items-start gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-green-700 text-white">
            <ClipboardPenLine className="size-6" />
          </div>

          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-950">
              New Daily Teaching Report
            </h1>

            <p className="mt-2 text-slate-600">
              Record a lesson taught during{" "}
              {currentSession?.name ??
                "the current academic session"}.
            </p>
          </div>
        </div>
      </section>

      {!currentSession ? (
        <Card className="border-amber-200 bg-amber-50">
          <p className="font-semibold text-amber-900">
            No current academic session is active.
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
                href={`/reports/daily-teaching/new?teacher=${teacher.id}`}
                className={[
                  "rounded-2xl border p-5 transition",
                  active
                    ? "border-green-700 bg-green-700 text-white shadow-md"
                    : "border-slate-200 bg-white text-slate-900 hover:border-green-300 hover:bg-green-50",
                ].join(" ")}
              >
                <div
                  className={[
                    "flex size-11 items-center justify-center rounded-xl",
                    active
                      ? "bg-white/15 text-white"
                      : "bg-green-100 text-green-700",
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
        <Card>
          <div className="mb-6 flex items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <h2 className="text-xl font-semibold text-slate-950">
                Lesson Details
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Complete one form for each lesson taught.
              </p>
            </div>

            <Badge variant="info">
              {assignments.length} assignment
              {assignments.length === 1 ? "" : "s"}
            </Badge>
          </div>

          {assignments.length ? (
            <TeachingReportForm
              key={selectedTeacher.id}
              teacherId={selectedTeacher.id}
              teacherName={
                selectedTeacher.full_name
              }
              assignments={assignments}
              defaultDate={getLagosDate()}
            />
          ) : (
            <div className="rounded-2xl border border-dashed border-amber-300 bg-amber-50 px-6 py-12 text-center">
              <BookOpenCheck className="mx-auto size-10 text-amber-700" />

              <p className="mt-4 font-semibold text-amber-900">
                No class subjects assigned
              </p>

              <p className="mt-2 text-sm text-amber-700">
                Assign a class subject to this teacher
                before creating a teaching report.
              </p>
            </div>
          )}
        </Card>
      ) : (
        <Card className="border-dashed py-14 text-center">
          <ClipboardPenLine className="mx-auto size-10 text-slate-400" />

          <h2 className="mt-4 text-lg font-semibold text-slate-900">
            Select a teacher
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Choose a teacher above to open the
            daily teaching report form.
          </p>
        </Card>
      )}
    </div>
  );
}

function getLagosDate() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Lagos",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}
