import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarCheck,
  GraduationCap,
  School,
  UserRound,
} from "lucide-react";

import { SchoolLogo } from "@/components/branding/school-logo";
import { Badge } from "@/components/ui";
import { createAdminClient } from "@/lib/supabase/admin";

import { PrintReportButton } from "./print-button";

type ReportCardPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export const metadata: Metadata = {
  title: "Student Report Card",
};

export default async function ReportCardPage({
  params,
}: ReportCardPageProps) {
  const { id } = await params;
  const admin = createAdminClient();

  const {
    data: termResult,
    error,
  } = await admin
    .from("term_results")
    .select(`
      id,
      enrollment_id,
      term_id,
      total_score,
      average_score,
      class_position,
      attendance_present,
      attendance_absent,
      attendance_late,
      teacher_comment,
      principal_comment,
      status,
      published_at,
      terms (
        id,
        name,
        term_number,
        starts_on,
        ends_on,
        academic_sessions (
          id,
          name
        )
      ),
      student_enrollments (
        id,
        class_id,
        student_id,
        students (
          id,
          admission_number,
          surname,
          first_name,
          other_name,
          gender,
          date_of_birth
        ),
        classes (
          id,
          name
        )
      )
    `)
    .eq("id", id)
    .eq("status", "published")
    .maybeSingle();

  if (error) {
    console.error(
      "Unable to load report card:",
      {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      },
    );
  }

  if (!termResult) {
    notFound();
  }

  const enrollmentRelation =
    termResult.student_enrollments;

  const enrollment = Array.isArray(
    enrollmentRelation,
  )
    ? enrollmentRelation[0]
    : enrollmentRelation;

  const studentRelation =
    enrollment?.students;

  const student = Array.isArray(
    studentRelation,
  )
    ? studentRelation[0]
    : studentRelation;

  const classRelation =
    enrollment?.classes;

  const schoolClass = Array.isArray(
    classRelation,
  )
    ? classRelation[0]
    : classRelation;

  const termRelation = termResult.terms;

  const term = Array.isArray(termRelation)
    ? termRelation[0]
    : termRelation;

  const sessionRelation =
    term?.academic_sessions;

  const session = Array.isArray(
    sessionRelation,
  )
    ? sessionRelation[0]
    : sessionRelation;

  if (!enrollment || !student || !term) {
    notFound();
  }

  const {
    data: subjectRows,
    error: subjectError,
  } = await admin
    .from("subject_results")
    .select(`
      total_score,
      grade,
      remark,
      assessment_sheets!inner (
        id,
        term_id,
        status,
        class_subjects (
          id,
          subjects (
            id,
            name,
            code
          )
        )
      )
    `)
    .eq("enrollment_id", enrollment.id)
    .eq(
      "assessment_sheets.term_id",
      term.id,
    )
    .eq(
      "assessment_sheets.status",
      "published",
    );

  if (subjectError) {
    console.error(
      "Unable to load subject results:",
      {
        message: subjectError.message,
        code: subjectError.code,
        details: subjectError.details,
        hint: subjectError.hint,
      },
    );
  }

  const sheetIds =
    subjectRows
      ?.map((row) => {
        const relation =
          row.assessment_sheets;

        const sheet = Array.isArray(relation)
          ? relation[0]
          : relation;

        return sheet?.id;
      })
      .filter(
        (sheetId): sheetId is string =>
          Boolean(sheetId),
      ) ?? [];

  const {
    data: components,
  } = await admin
    .from("assessment_components")
    .select(`
      id,
      name,
      code,
      maximum_score,
      sort_order
    `)
    .eq("is_active", true)
    .order("sort_order");

  const {
    data: scoreRows,
  } = sheetIds.length
    ? await admin
        .from("student_scores")
        .select(`
          assessment_sheet_id,
          component_id,
          raw_score
        `)
        .eq(
          "enrollment_id",
          enrollment.id,
        )
        .in(
          "assessment_sheet_id",
          sheetIds,
        )
    : { data: [] };

  const subjects =
    subjectRows
      ?.map((row) => {
        const sheetRelation =
          row.assessment_sheets;

        const sheet = Array.isArray(
          sheetRelation,
        )
          ? sheetRelation[0]
          : sheetRelation;

        const classSubjectRelation =
          sheet?.class_subjects;

        const classSubject = Array.isArray(
          classSubjectRelation,
        )
          ? classSubjectRelation[0]
          : classSubjectRelation;

        const subjectRelation =
          classSubject?.subjects;

        const subject = Array.isArray(
          subjectRelation,
        )
          ? subjectRelation[0]
          : subjectRelation;

        if (!sheet || !subject) {
          return null;
        }

        const scores = Object.fromEntries(
          scoreRows
            ?.filter(
              (score) =>
                score.assessment_sheet_id ===
                sheet.id,
            )
            .map((score) => [
              score.component_id,
              Number(score.raw_score),
            ]) ?? [],
        );

        return {
          id: subject.id,
          name: subject.name,
          code: subject.code,
          scores,
          total: Number(row.total_score),
          grade: row.grade ?? "—",
          remark: row.remark ?? "—",
        };
      })
      .filter(
        (
          subject,
        ): subject is NonNullable<
          typeof subject
        > => Boolean(subject),
      )
      .sort((a, b) =>
        a.name.localeCompare(b.name),
      ) ?? [];

  const fullName = [
    student.surname,
    student.first_name,
    student.other_name,
  ]
    .filter(Boolean)
    .join(" ");

  const attendanceTotal =
    termResult.attendance_present +
    termResult.attendance_absent +
    termResult.attendance_late;

  return (
    <div className="mx-auto max-w-6xl space-y-6 print:max-w-none print:space-y-3">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center print:hidden">
        <Link
          href={`/results/report-cards?class=${enrollment.class_id}`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-green-700"
        >
          <ArrowLeft className="size-4" />
          Back to report cards
        </Link>

        <PrintReportButton />
      </div>

      <article className="overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-sm print:rounded-none print:border-slate-500 print:shadow-none">
        <header className="border-b-4 border-green-600 bg-gradient-to-r from-green-50 via-white to-amber-50 px-8 py-7 text-center print:px-5 print:py-4">
          <SchoolLogo
            size="xl"
            showName={false}
            href={null}
            priority
          />

          <h1 className="mt-4 text-3xl font-bold uppercase tracking-wide text-slate-950">
            RightPath Academy
          </h1>

          <p className="mt-2 text-sm font-semibold uppercase tracking-[0.2em] text-green-700">
            Academic Report Card
          </p>

          <p className="mt-3 text-sm text-slate-600">
            {term.name}
            {session?.name
              ? ` · ${session.name} Academic Session`
              : ""}
          </p>
        </header>

        <section className="grid gap-4 border-b border-slate-200 px-8 py-6 sm:grid-cols-2 lg:grid-cols-4 print:grid-cols-4 print:px-5 print:py-3">
          <StudentDetail
            label="Student Name"
            value={fullName}
            icon={UserRound}
          />

          <StudentDetail
            label="Admission Number"
            value={student.admission_number}
            icon={GraduationCap}
          />

          <StudentDetail
            label="Class"
            value={
              schoolClass?.name ??
              "Unknown class"
            }
            icon={School}
          />

          <StudentDetail
            label="Gender"
            value={student.gender}
            icon={UserRound}
          />

          <StudentDetail
            label="Date of Birth"
            value={formatDate(
              student.date_of_birth,
            )}
            icon={CalendarCheck}
          />

          <StudentDetail
            label="Average"
            value={`${Number(
              termResult.average_score,
            ).toFixed(2)}%`}
            icon={GraduationCap}
          />

          <StudentDetail
            label="Subjects"
            value={String(subjects.length)}
            icon={School}
          />

          <StudentDetail
            label="Result Status"
            value={termResult.status}
            icon={GraduationCap}
          />
        </section>

        <section className="px-8 py-6 print:px-5 print:py-3">
          <h2 className="text-lg font-semibold text-slate-950">
            Academic Performance
          </h2>

          <div className="mt-4 overflow-hidden rounded-xl border border-slate-300 print:rounded-none">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-300 bg-slate-100">
                <tr>
                  <th className="px-4 py-3 font-bold text-slate-700">
                    Subject
                  </th>

                  {components?.map(
                    (component) => (
                      <th
                        key={component.id}
                        className="px-3 py-3 text-center font-bold text-slate-700"
                      >
                        {component.code}/
                        {component.maximum_score}
                      </th>
                    ),
                  )}

                  <th className="px-3 py-3 text-center font-bold text-slate-700">
                    Total
                  </th>

                  <th className="px-3 py-3 text-center font-bold text-slate-700">
                    Grade
                  </th>

                  <th className="px-4 py-3 font-bold text-slate-700">
                    Remark
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200">
                {subjects.map((subject) => (
                  <tr key={subject.id}>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-900">
                        {subject.name}
                      </p>

                      <p className="text-xs text-slate-500">
                        {subject.code}
                      </p>
                    </td>

                    {components?.map(
                      (component) => (
                        <td
                          key={component.id}
                          className="px-3 py-3 text-center text-slate-700"
                        >
                          {subject.scores[
                            component.id
                          ] ?? "—"}
                        </td>
                      ),
                    )}

                    <td className="px-3 py-3 text-center font-bold text-green-800">
                      {subject.total}
                    </td>

                    <td className="px-3 py-3 text-center">
                      <Badge
                        variant={
                          subject.total >= 50
                            ? "success"
                            : "danger"
                        }
                      >
                        {subject.grade}
                      </Badge>
                    </td>

                    <td className="px-4 py-3 text-slate-700">
                      {subject.remark}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="grid gap-5 border-t border-slate-200 bg-slate-50 px-8 py-6 md:grid-cols-2 print:grid-cols-2 print:px-5 print:py-3">
          <div>
            <h2 className="font-semibold text-slate-950">
              Term Summary
            </h2>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <SummaryItem
                label="Total Score"
                value={Number(
                  termResult.total_score,
                ).toFixed(2)}
              />

              <SummaryItem
                label="Average"
                value={`${Number(
                  termResult.average_score,
                ).toFixed(2)}%`}
              />

              <SummaryItem
                label="Subjects Offered"
                value={String(subjects.length)}
              />

              <SummaryItem
                label="Published"
                value={
                  termResult.published_at
                    ? formatDateTime(
                        termResult.published_at,
                      )
                    : "—"
                }
              />
            </div>
          </div>

          <div>
            <h2 className="font-semibold text-slate-950">
              Attendance Summary
            </h2>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <SummaryItem
                label="Days Recorded"
                value={String(attendanceTotal)}
              />

              <SummaryItem
                label="Present"
                value={String(
                  termResult.attendance_present,
                )}
              />

              <SummaryItem
                label="Absent"
                value={String(
                  termResult.attendance_absent,
                )}
              />

              <SummaryItem
                label="Late"
                value={String(
                  termResult.attendance_late,
                )}
              />
            </div>
          </div>
        </section>

        <section className="grid gap-6 border-t border-slate-200 px-8 py-7 md:grid-cols-2 print:grid-cols-2 print:px-5 print:py-4">
          <CommentBox
            title="Teacher's Comment"
            value={
              termResult.teacher_comment ??
              "No teacher comment provided."
            }
          />

          <CommentBox
            title="Principal's Comment"
            value={
              termResult.principal_comment ??
              "No principal comment provided."
            }
          />
        </section>

        <footer className="grid gap-8 border-t border-slate-200 px-8 py-8 text-center sm:grid-cols-2 print:grid-cols-2 print:px-5 print:py-5">
          <SignatureLine label="Teacher's Signature" />
          <SignatureLine label="Principal's Signature" />
        </footer>
      </article>
    </div>
  );
}

function StudentDetail({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof UserRound;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-green-100 text-green-700 print:hidden">
        <Icon className="size-4" />
      </div>

      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
          {label}
        </p>

        <p className="mt-1 font-semibold capitalize text-slate-900">
          {value}
        </p>
      </div>
    </div>
  );
}

function SummaryItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 print:rounded-none">
      <p className="text-xs text-slate-500">
        {label}
      </p>

      <p className="mt-1 font-bold text-slate-900">
        {value}
      </p>
    </div>
  );
}

function CommentBox({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div>
      <h2 className="font-semibold text-slate-950">
        {title}
      </h2>

      <div className="mt-3 min-h-24 rounded-xl border border-slate-300 bg-slate-50 p-4 text-sm leading-6 text-slate-700 print:rounded-none">
        {value}
      </div>
    </div>
  );
}

function SignatureLine({
  label,
}: {
  label: string;
}) {
  return (
    <div>
      <div className="mx-auto mt-8 max-w-xs border-t border-slate-500 pt-2">
        <p className="text-sm font-semibold text-slate-700">
          {label}
        </p>
      </div>
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}
